"""
app/routers/dashboard.py
"""

from fastapi import APIRouter, Depends

from app.schemas.dashboard import (
    DashboardChartResponse,
    DashboardStatsResponse,
    DataQualityResponse,
    FollowUpResponse,
    RecentActivityResponse,
)
from app.services.dashboard_service import DashboardService
from app.services.dependencies import CurrentUser, get_dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    current_user: CurrentUser,
    svc: DashboardService = Depends(get_dashboard_service),
):
    return DashboardStatsResponse(data=svc.get_stats())


@router.get("/charts", response_model=DashboardChartResponse)
async def get_charts(
    current_user: CurrentUser,
    svc: DashboardService = Depends(get_dashboard_service),
):
    return DashboardChartResponse(data=svc.get_chart_data())


@router.get("/recent", response_model=RecentActivityResponse)
async def get_recent(
    current_user: CurrentUser,
    limit: int = 10,
    svc: DashboardService = Depends(get_dashboard_service),
):
    return RecentActivityResponse(data=svc.get_recent_activity(limit=limit))


@router.get("/followups", response_model=FollowUpResponse)
async def get_followups(
    current_user: CurrentUser,
    svc: DashboardService = Depends(get_dashboard_service),
):
    return FollowUpResponse(data=svc.get_followups())


@router.get("/data-quality", response_model=DataQualityResponse)
async def get_data_quality(
    current_user: CurrentUser,
    svc: DashboardService = Depends(get_dashboard_service),
):
    return DataQualityResponse(data=svc.get_data_quality())
