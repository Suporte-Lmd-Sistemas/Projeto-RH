from fastapi import APIRouter, Query

from app.schemas.dashboard_vendas import DashboardVendasResponse
from app.services.dashboard_vendas_service import DashboardVendasService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Vendas"])


@router.get("/vendas", response_model=DashboardVendasResponse)
def get_dashboard_vendas(
    period: str = Query(default="month"),
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    empresa_id: int | None = Query(default=None),
):
    service = DashboardVendasService()

    return service.get_dashboard_vendas(
        period=period,
        start=start,
        end=end,
        empresa_id=empresa_id,
    )