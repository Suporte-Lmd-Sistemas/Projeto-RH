from fastapi import APIRouter
from sqlalchemy import text
from app.database.connection import engine

router = APIRouter()

@router.get("/")
def home():
    return {
        "mensagem": "API do módulo RH está funcionando!"
    }

@router.get("/teste-banco")
def teste_banco():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return {"banco": "conectado com sucesso"}
    except Exception as e:
        return {"erro": str(e)}