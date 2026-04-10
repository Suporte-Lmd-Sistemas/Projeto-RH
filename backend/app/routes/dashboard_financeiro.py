from fastapi import APIRouter, Query
from app.schemas.dashboard_financeiro import DashboardFinanceiroResponse
from app.services.dashboard_financeiro_service import DashboardFinanceiroService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Financeiro"])


@router.get("/financeiro", response_model=DashboardFinanceiroResponse)
def get_dashboard_financeiro(
    period: str = Query(default="month"),
    type: str = Query(default="faturamento"),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    empresa_id: int | None = Query(default=None),
):
    service = DashboardFinanceiroService()

    return service.get_dashboard_financeiro(
        period=period,
        report_type=type,
        start=start,
        end=end,
        empresa_id=empresa_id,
    )