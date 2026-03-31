from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.departamento import Departamento

router = APIRouter(prefix="/departamentos", tags=["Departamentos"])

@router.post("/")
def criar_departamento(nome: str, descricao: str = "", db: Session = Depends(get_db)):
    novo = Departamento(nome=nome, descricao=descricao)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.get("/")
def listar_departamentos(db: Session = Depends(get_db)):
    return db.query(Departamento).all()