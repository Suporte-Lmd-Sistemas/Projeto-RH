from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.departamento import Departamento
from app.models.funcionario import Funcionario

router = APIRouter(prefix="/departamentos", tags=["Departamentos"])


class DepartamentoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=255)


class DepartamentoUpdate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=255)


@router.get("/")
def listar_departamentos(db: Session = Depends(get_db)):
    departamentos = db.query(Departamento).order_by(Departamento.nome).all()

    return [
        {
            "id": departamento.id,
            "nome": departamento.nome,
            "descricao": departamento.descricao,
        }
        for departamento in departamentos
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_departamento(payload: DepartamentoCreate, db: Session = Depends(get_db)):
    nome_limpo = payload.nome.strip()

    if not nome_limpo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do departamento é obrigatório.",
        )

    departamento_existente = (
        db.query(Departamento)
        .filter(Departamento.nome == nome_limpo)
        .first()
    )

    if departamento_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um departamento com esse nome.",
        )

    novo_departamento = Departamento(
        nome=nome_limpo,
        descricao=payload.descricao.strip() if payload.descricao else None,
    )

    db.add(novo_departamento)
    db.commit()
    db.refresh(novo_departamento)

    return {
        "id": novo_departamento.id,
        "nome": novo_departamento.nome,
        "descricao": novo_departamento.descricao,
    }


@router.put("/{departamento_id}")
def atualizar_departamento(
    departamento_id: int,
    payload: DepartamentoUpdate,
    db: Session = Depends(get_db),
):
    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if not departamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Departamento não encontrado.",
        )

    nome_limpo = payload.nome.strip()

    if not nome_limpo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O nome do departamento é obrigatório.",
        )

    departamento_existente = (
        db.query(Departamento)
        .filter(Departamento.nome == nome_limpo, Departamento.id != departamento_id)
        .first()
    )

    if departamento_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe outro departamento com esse nome.",
        )

    departamento.nome = nome_limpo
    departamento.descricao = payload.descricao.strip() if payload.descricao else None

    db.commit()
    db.refresh(departamento)

    return {
        "id": departamento.id,
        "nome": departamento.nome,
        "descricao": departamento.descricao,
    }


@router.delete("/{departamento_id}")
def excluir_departamento(departamento_id: int, db: Session = Depends(get_db)):
    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if not departamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Departamento não encontrado.",
        )

    funcionario_vinculado = (
        db.query(Funcionario)
        .filter(Funcionario.departamento_id == departamento_id)
        .first()
    )

    if funcionario_vinculado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir este departamento porque ele está vinculado a funcionário(s).",
        )

    db.delete(departamento)
    db.commit()

    return {"detail": "Departamento excluído com sucesso."}