"""
app/schemas/dashboard.py
──────────────────────────────────────────────────────────────────────────────
Response models for all dashboard endpoints.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    total_contacts: int = Field(..., ge=0)
    total_organizations: int = Field(..., ge=0)
    total_states: int = Field(..., ge=0)
    total_sectors: int = Field(..., ge=0)
    upcoming_followups: int = Field(..., ge=0)
    new_this_month: int = Field(..., ge=0)
    high_priority_count: int = Field(..., ge=0)
    business_card_imports: int = Field(..., ge=0)


class DashboardStatsResponse(BaseModel):
    success: bool = True
    data: DashboardStats


class ChartDataPoint(BaseModel):
    name: str
    value: int = Field(..., ge=0)


class DashboardChartData(BaseModel):
    by_sector: list[ChartDataPoint]
    by_state: list[ChartDataPoint]
    by_source_type: list[ChartDataPoint]
    growth_by_month: list[ChartDataPoint]


class DashboardChartResponse(BaseModel):
    success: bool = True
    data: DashboardChartData


class RecentContactItem(BaseModel):
    contact_id: str
    name: Optional[str]
    company: Optional[str]
    sector: Optional[str]
    source_type: Optional[str]
    date_added: Optional[str]


class RecentActivityResponse(BaseModel):
    success: bool = True
    data: list[RecentContactItem]


class FollowUpItem(BaseModel):
    contact_id: str
    name: Optional[str]
    company: Optional[str]
    phone: Optional[str]
    followup_date: str
    days_until: int
    is_overdue: bool


class FollowUpSummary(BaseModel):
    due_today: list[FollowUpItem]
    due_this_week: list[FollowUpItem]
    overdue: list[FollowUpItem]


class FollowUpResponse(BaseModel):
    success: bool = True
    data: FollowUpSummary


class DataQualityIssue(BaseModel):
    contact_id: str
    name: Optional[str]
    company: Optional[str]
    missing_fields: list[str]


class DataQualitySummary(BaseModel):
    missing_email: int
    missing_phone: int
    missing_linkedin: int
    missing_sector: int
    potential_duplicates: int
    incomplete_contacts: list[DataQualityIssue]


class DataQualityResponse(BaseModel):
    success: bool = True
    data: DataQualitySummary
