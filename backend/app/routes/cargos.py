from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.cargo import Cargo

router = APIRouter(prefix="/cargos", tags=["Cargos"])

@router.post("/")
def criar_cargo(nome: str, descricao: str = "", db: Session = Depends(get_db)):
    novo = Cargo(nome=nome, descricao=descricao)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.get("/")
def listar_cargos(db: Session = Depends(get_db)):
    return db.query(Cargo).all()