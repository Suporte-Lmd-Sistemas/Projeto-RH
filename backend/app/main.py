from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.routes.home import router as home_router
from app.routes.funcionarios import router as funcionarios_router
from app.routes.erp_test import router as erp_test_router
from app.routes.erp_pessoas import router as erp_pessoas_router
from app.routes.erp_colaboradores import router as erp_colaboradores_router
from app.routes.indicadores import router as indicadores_router
from app.routes.performance import router as performance_router
from app.routes.dashboard_financeiro import router as dashboard_financeiro_router
from app.routes.dashboard_vendas import router as dashboard_vendas_router
from app.routes.relatorio import router as relatorio_router
from app.routes.auth import router as auth_router
from app.routes.empresa import router as empresa_router

app = FastAPI(
    title="Dashboard App API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=(
        r"^http://("
        r"localhost|"
        r"127\.0\.0\.1|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home_router)
app.include_router(funcionarios_router)
app.include_router(erp_test_router)
app.include_router(erp_pessoas_router)
app.include_router(erp_colaboradores_router)
app.include_router(indicadores_router)
app.include_router(performance_router)
app.include_router(dashboard_financeiro_router)
app.include_router(dashboard_vendas_router)
app.include_router(relatorio_router)
app.include_router(auth_router)
app.include_router(empresa_router)


@app.get("/health", tags=["Sistema"])
def health_check():
    return {
        "success": True,
        "message": "API online"
    }


BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"

if FRONTEND_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="assets")


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    index_file = FRONTEND_DIST_DIR / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "message": "Frontend buildado não encontrado. Execute o build do React."
        }
    )


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend_spa(full_path: str):
    blocked_prefixes = (
        "docs",
        "redoc",
        "openapi.json",
        "assets",
        "health",
    )

    if full_path.startswith(blocked_prefixes):
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": "Rota não encontrada"}
        )

    index_file = FRONTEND_DIST_DIR / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return JSONResponse(
        status_code=503,
        content={
            "success": False,
            "message": "Frontend buildado não encontrado. Execute o build do React."
        }
    )