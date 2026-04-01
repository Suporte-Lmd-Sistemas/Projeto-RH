from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db
from app.database.erp_connection import get_erp_db
from app.models.funcionario import Funcionario
from app.models.departamento import Departamento

router = APIRouter(prefix="/indicadores", tags=["Indicadores RH"])


@router.get("/resumo")
def resumo_rh(
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db)
):
    funcionarios = db.query(Funcionario).all()

    total_funcionarios = len(funcionarios)
    total_ativos = 0
    total_afastados = 0
    salarios = []

    for funcionario in funcionarios:
        query = text("""
            SELECT
                c.COL_STATUS,
                c.COL_SALARIO_VALOR,
                c.COL_DATA_AFASTAMENTO
            FROM TB_COLABORADOR c
            WHERE c.COL_PESSOA = :col_pessoa
        """)

        colaborador = erp_db.execute(
            query,
            {"col_pessoa": funcionario.col_pessoa}
        ).fetchone()

        if colaborador:
            status = colaborador[0]
            salario = colaborador[1]
            data_afastamento = colaborador[2]

            if status is not None:
                status_str = str(status).strip().upper()
                if status_str in ["A", "ATIVO", "1", "S"]:
                    total_ativos += 1

            if data_afastamento is not None:
                total_afastados += 1

            if salario is not None:
                salarios.append(float(salario))

    media_salarial = round(sum(salarios) / len(salarios), 2) if salarios else 0

    return {
        "total_funcionarios_rh": total_funcionarios,
        "total_ativos": total_ativos,
        "total_afastados": total_afastados,
        "media_salarial": media_salarial
    }


@router.get("/por-departamento")
def funcionarios_por_departamento(
    db: Session = Depends(get_db)
):
    departamentos = db.query(Departamento).all()
    resultado = []

    for departamento in departamentos:
        total = db.query(Funcionario).filter(
            Funcionario.departamento_id == departamento.id
        ).count()

        resultado.append({
            "departamento_id": departamento.id,
            "departamento_nome": departamento.nome,
            "total_funcionarios": total
        })

    return resultado