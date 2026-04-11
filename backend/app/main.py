from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.home import router as home_router
from app.routes.departamentos import router as departamentos_router
from app.routes.cargos import router as cargos_router
from app.routes.funcionarios import router as funcionarios_router
from app.routes.erp_test import router as erp_test_router
from app.routes.erp_pessoas import router as erp_pessoas_router
from app.routes.integracao_rh import router as integracao_rh_router
from app.routes.erp_colaboradores import router as erp_colaboradores_router
from app.routes.indicadores import router as indicadores_router
from app.routes.performance import router as performance_router
from app.routes.dashboard_financeiro import router as dashboard_financeiro_router
from app.routes.dashboard_vendas import router as dashboard_vendas_router
from app.routes.dashboard_funcionarios import router as dashboard_funcionarios_router
from app.routes.dashboard_auditoria import router as dashboard_auditoria_router

from app.database.create_tables import create_tables

app = FastAPI(
    title="RH App API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

app.include_router(home_router)
app.include_router(departamentos_router)
app.include_router(cargos_router)
app.include_router(funcionarios_router)
app.include_router(erp_test_router)
app.include_router(erp_pessoas_router)
app.include_router(integracao_rh_router)
app.include_router(erp_colaboradores_router)
app.include_router(indicadores_router)
app.include_router(performance_router)
app.include_router(dashboard_financeiro_router)
app.include_router(dashboard_vendas_router)
app.include_router(dashboard_funcionarios_router)
app.include_router(dashboard_auditoria_router)