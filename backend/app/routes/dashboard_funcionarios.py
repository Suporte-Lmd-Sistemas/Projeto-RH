from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dashboard_funcionarios import DashboardFuncionariosResponse
from app.services.dashboard_funcionarios_service import DashboardFuncionariosService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Funcionários"])


@router.get("/funcionarios", response_model=DashboardFuncionariosResponse)
def get_dashboard_funcionarios(
    empresa_id: int | None = Query(default=None),
    nome: str = Query(default=""),
    departamento_id: int | None = Query(default=None),
    status: str = Query(default=""),
    cargo: str = Query(default=""),
    db: Session = Depends(get_db),
):
    service = DashboardFuncionariosService()

    return service.get_dashboard_funcionarios(
        db=db,
        empresa_id=empresa_id,
        nome=nome,
        departamento_id=departamento_id,
        status=status,
        cargo=cargo,
    )