from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.database.session import get_db
from app.models.funcionario import Funcionario

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])


@router.post("/")
def criar_funcionario(
    nome: str,
    cpf: str,
    data_admissao: date,
    cargo_id: int,
    departamento_id: int,
    db: Session = Depends(get_db)
):
    novo = Funcionario(
        nome=nome,
        cpf=cpf,
        data_admissao=data_admissao,
        cargo_id=cargo_id,
        departamento_id=departamento_id
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return novo


@router.get("/")
def listar_funcionarios(db: Session = Depends(get_db)):
    return db.query(Funcionario).all()