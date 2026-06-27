"""
app/services/dashboard_service.py
──────────────────────────────────────────────────────────────────────────────
Dashboard business logic — all live data from repository.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from typing import Any

from app.core.logging import get_logger
from app.schemas.dashboard import (
    ChartDataPoint,
    DashboardChartData,
    DashboardStats,
    DataQualityIssue,
    DataQualitySummary,
    FollowUpItem,
    FollowUpSummary,
    RecentContactItem,
)
from app.services.base_repository import AbstractContactRepository

logger = get_logger(__name__)


class DashboardService:
    def __init__(self, repo: AbstractContactRepository) -> None:
        self._repo = repo

    def get_stats(self) -> DashboardStats:
        contacts = self._repo.get_all()
        today = date.today()
        month_start = today.replace(day=1)

        total = len(contacts)
        orgs = len({(c.get("Company") or "").strip().lower() for c in contacts if c.get("Company")})
        states = len({(c.get("State") or "").strip() for c in contacts if c.get("State")})
        sectors = len({(c.get("Sector") or "").strip() for c in contacts if c.get("Sector")})

        upcoming = 0
        new_this_month = 0
        high_priority = 0
        bc_imports = 0

        for c in contacts:
            # Follow-ups in next 30 days
            fu = _parse_date(c.get("Next_Followup_Date"))
            if fu and today <= fu <= today + timedelta(days=30):
                upcoming += 1

            # New this month
            added = _parse_date(c.get("Date_Added"))
            if added and added >= month_start:
                new_this_month += 1

            # High priority
            if (c.get("Contact_Priority") or "").strip() == "High":
                high_priority += 1

            # Business card imports
            if (c.get("Source_Type") or "").strip() == "Business Card":
                bc_imports += 1

        return DashboardStats(
            total_contacts=total,
            total_organizations=orgs,
            total_states=states,
            total_sectors=sectors,
            upcoming_followups=upcoming,
            new_this_month=new_this_month,
            high_priority_count=high_priority,
            business_card_imports=bc_imports,
        )

    def get_chart_data(self) -> DashboardChartData:
        contacts = self._repo.get_all()

        sector_counter: Counter = Counter()
        state_counter: Counter = Counter()
        source_counter: Counter = Counter()
        month_counter: Counter = Counter()

        for c in contacts:
            if c.get("Sector"):
                sector_counter[c["Sector"].strip()] += 1
            if c.get("State"):
                state_counter[c["State"].strip()] += 1
            source = (c.get("Source_Type") or "Unknown").strip()
            source_counter[source] += 1
            added = _parse_date(c.get("Date_Added"))
            if added:
                key = added.strftime("%b %Y")
                month_counter[key] += 1

        def top_n(counter: Counter, n: int = 8) -> list[ChartDataPoint]:
            return [
                ChartDataPoint(name=k, value=v)
                for k, v in counter.most_common(n)
            ]

        # Sort growth by actual date
        today = date.today()
        growth = []
        for i in range(5, -1, -1):
            target = today.replace(day=1) - timedelta(days=i * 28)
            key = target.strftime("%b %Y")
            growth.append(ChartDataPoint(name=key, value=month_counter.get(key, 0)))

        return DashboardChartData(
            by_sector=top_n(sector_counter),
            by_state=top_n(state_counter),
            by_source_type=top_n(source_counter),
            growth_by_month=growth,
        )

    def get_recent_activity(self, limit: int = 10) -> list[RecentContactItem]:
        contacts = self._repo.get_all()

        with_dates = []
        for c in contacts:
            d = _parse_date(c.get("Date_Added"))
            if d:
                with_dates.append((d, c))

        with_dates.sort(key=lambda x: x[0], reverse=True)

        return [
            RecentContactItem(
                contact_id=c.get("Contact_ID", ""),
                name=c.get("Name"),
                company=c.get("Company"),
                sector=c.get("Sector"),
                source_type=c.get("Source_Type"),
                date_added=str(d),
            )
            for d, c in with_dates[:limit]
        ]

    def get_followups(self) -> FollowUpSummary:
        contacts = self._repo.get_all()
        today = date.today()
        week_end = today + timedelta(days=7)

        due_today: list[FollowUpItem] = []
        due_week: list[FollowUpItem] = []
        overdue: list[FollowUpItem] = []

        for c in contacts:
            fu = _parse_date(c.get("Next_Followup_Date"))
            if not fu:
                continue

            days_until = (fu - today).days
            item = FollowUpItem(
                contact_id=c.get("Contact_ID", ""),
                name=c.get("Name"),
                company=c.get("Company"),
                phone=c.get("Phone"),
                followup_date=fu.isoformat(),
                days_until=days_until,
                is_overdue=days_until < 0,
            )

            if days_until < 0:
                overdue.append(item)
            elif days_until == 0:
                due_today.append(item)
            elif fu <= week_end:
                due_week.append(item)

        overdue.sort(key=lambda x: x.days_until)
        return FollowUpSummary(
            due_today=due_today,
            due_this_week=due_week,
            overdue=overdue,
        )

    def get_data_quality(self) -> DataQualitySummary:
        contacts = self._repo.get_all()

        missing_email = 0
        missing_phone = 0
        missing_linkedin = 0
        missing_sector = 0
        incomplete: list[DataQualityIssue] = []

        for c in contacts:
            missing: list[str] = []
            if not c.get("Email") and not c.get("Alternate_Email"):
                missing_email += 1
                missing.append("Email")
            if not c.get("Phone") and not c.get("Alternate_Phone"):
                missing_phone += 1
                missing.append("Phone")
            if not c.get("LinkedIn"):
                missing_linkedin += 1
                missing.append("LinkedIn")
            if not c.get("Sector"):
                missing_sector += 1
                missing.append("Sector")

            if len(missing) >= 2:
                incomplete.append(DataQualityIssue(
                    contact_id=c.get("Contact_ID", ""),
                    name=c.get("Name"),
                    company=c.get("Company"),
                    missing_fields=missing,
                ))

        # Naive duplicate count based on matching names
        name_counts: Counter = Counter()
        for c in contacts:
            name = (c.get("Name") or "").strip().lower()
            if name:
                name_counts[name] += 1
        potential_dupes = sum(1 for v in name_counts.values() if v > 1)

        return DataQualitySummary(
            missing_email=missing_email,
            missing_phone=missing_phone,
            missing_linkedin=missing_linkedin,
            missing_sector=missing_sector,
            potential_duplicates=potential_dupes,
            incomplete_contacts=incomplete[:20],
        )


def _parse_date(val: Any) -> date | None:
    if not val:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(val.strip(), fmt).date()
            except ValueError:
                continue
    return None
