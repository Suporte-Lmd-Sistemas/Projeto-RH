from fastapi import APIRouter, Query

from app.schemas.dashboard_funcionarios import DashboardFuncionariosResponse
from app.services.dashboard_funcionarios_service import DashboardFuncionariosService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Funcionarios"])


@router.get("/funcionarios", response_model=DashboardFuncionariosResponse)
def get_dashboard_funcionarios(
    empresa_id: int | None = Query(default=None),
):
    service = DashboardFuncionariosService()
    return service.get_dashboard_funcionarios(empresa_id=empresa_id)