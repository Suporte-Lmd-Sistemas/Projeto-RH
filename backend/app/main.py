from fastapi import FastAPI

from app.routes.home import router as home_router
from app.routes.departamentos import router as departamentos_router
from app.routes.cargos import router as cargos_router
from app.routes.funcionarios import router as funcionarios_router
from app.routes.erp_test import router as erp_test_router
from app.routes.erp_pessoas import router as erp_pessoas_router

from app.database.create_tables import create_tables

app = FastAPI(
    title="RH App API",
    version="1.0.0"
)

create_tables()

app.include_router(home_router)
app.include_router(departamentos_router)
app.include_router(cargos_router)
app.include_router(funcionarios_router)
app.include_router(erp_test_router)
app.include_router(erp_pessoas_router)