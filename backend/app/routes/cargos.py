from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.cargo import Cargo
from app.models.funcionario import Funcionario

router = APIRouter(prefix="/cargos", tags=["Cargos"])


class CargoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=255)


class CargoUpdate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=255)


@router.get("/")
def listar_cargos(db: Session = Depends(get_db)):
    cargos = db.query(Cargo).order_by(Cargo.nome).all()

    return [
        {
            "id": cargo.id,
            "nome": cargo.nome,
            "descricao": cargo.descricao,
        }
        for cargo in cargos
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_cargo(payload: CargoCreate, db: Session = Depends(get_db)):
    nome_limpo = payload.nome.strip()

    if not nome_limpo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do cargo é obrigatório.",
        )

    cargo_existente = (
        db.query(Cargo)
        .filter(Cargo.nome == nome_limpo)
        .first()
    )

    if cargo_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um cargo com esse nome.",
        )

    novo_cargo = Cargo(
        nome=nome_limpo,
        descricao=payload.descricao.strip() if payload.descricao else None,
    )

    db.add(novo_cargo)
    db.commit()
    db.refresh(novo_cargo)

    return {
        "id": novo_cargo.id,
        "nome": novo_cargo.nome,
        "descricao": novo_cargo.descricao,
    }


@router.put("/{cargo_id}")
def atualizar_cargo(
    cargo_id: int,
    payload: CargoUpdate,
    db: Session = Depends(get_db),
):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cargo não encontrado.",
        )

    nome_limpo = payload.nome.strip()

    if not nome_limpo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do cargo é obrigatório.",
        )

    cargo_existente = (
        db.query(Cargo)
        .filter(Cargo.nome == nome_limpo, Cargo.id != cargo_id)
        .first()
    )

    if cargo_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe outro cargo com esse nome.",
        )

    cargo.nome = nome_limpo
    cargo.descricao = payload.descricao.strip() if payload.descricao else None

    db.commit()
    db.refresh(cargo)

    return {
        "id": cargo.id,
        "nome": cargo.nome,
        "descricao": cargo.descricao,
    }


@router.delete("/{cargo_id}")
def excluir_cargo(cargo_id: int, db: Session = Depends(get_db)):
    cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

    if not cargo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cargo não encontrado.",
        )

    funcionario_vinculado = (
        db.query(Funcionario)
        .filter(Funcionario.cargo_id == cargo_id)
        .first()
    )

    if funcionario_vinculado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir este cargo porque ele está vinculado a funcionário(s).",
        )

    db.delete(cargo)
    db.commit()

    return {"detail": "Cargo excluído com sucesso."}