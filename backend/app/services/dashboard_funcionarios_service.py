from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.cargo import Cargo
from app.models.departamento import Departamento
from app.models.funcionario import Funcionario
from app.repositories.dashboard_funcionarios_repository import DashboardFuncionariosRepository


class DashboardFuncionariosService:
    def __init__(self) -> None:
        self.repository = DashboardFuncionariosRepository()

    def get_dashboard_funcionarios(
        self,
        db: Session,
        empresa_id: int | None = None,
        nome: str = "",
        departamento_id: int | None = None,
        status: str = "",
        cargo: str = "",
    ) -> dict:
        resumo = {
            "total": self.repository.get_total_funcionarios(empresa_id),
            "ativos": self.repository.get_total_ativos(empresa_id),
            "afastados": self.repository.get_total_afastados(empresa_id),
            "vendedores": self.repository.get_total_vendedores(empresa_id),
            "mediaSalarial": self.repository.get_media_salarial(empresa_id),
        }

        distribuicao_funcoes_rows = self.repository.get_distribuicao_funcoes(empresa_id)
        distribuicao_funcoes = [
            {
                "funcao": row.get("FUNCAO") or "Nao informada",
                "quantidade": int(row.get("QUANTIDADE") or 0),
            }
            for row in distribuicao_funcoes_rows
        ]

        funcionarios_rh = db.query(Funcionario).all()
        if departamento_id is not None:
            funcionarios_rh = [f for f in funcionarios_rh if f.departamento_id == departamento_id]

        funcionarios_rh_map = {f.col_pessoa: f for f in funcionarios_rh}

        departamentos_map = {
            d.id: d.nome for d in db.query(Departamento).all()
        }
        cargos_map = {
            c.id: c.nome for c in db.query(Cargo).all()
        }

        erp_rows = self.repository.get_funcionarios_erp(empresa_id)

        resultado_funcionarios: list[dict] = []

        nome_filtro = (nome or "").strip().lower()
        status_filtro = (status or "").strip().lower()
        cargo_filtro = (cargo or "").strip().lower()

        for row in erp_rows:
            col_pessoa = int(row.get("COL_PESSOA") or 0)
            funcionario_rh = funcionarios_rh_map.get(col_pessoa)

            nome_erp = str(row.get("NOME") or "")
            cargo_erp = str(row.get("COL_FUNCAO") or "")
            status_erp = str(row.get("COL_STATUS") or "")

            if nome_filtro and nome_filtro not in nome_erp.lower():
                continue

            if cargo_filtro and cargo_filtro not in cargo_erp.lower():
                continue

            if status_filtro and status_filtro not in status_erp.lower():
                continue

            cargo_rh_id = funcionario_rh.cargo_id if funcionario_rh else None
            departamento_rh_id = funcionario_rh.departamento_id if funcionario_rh else None

            resultado_funcionarios.append(
                {
                    "rhId": funcionario_rh.id if funcionario_rh else None,
                    "colPessoa": col_pessoa,
                    "nome": nome_erp,
                    "cargoOficial": cargo_erp or None,
                    "cargoRhId": cargo_rh_id,
                    "cargoRhNome": cargos_map.get(cargo_rh_id),
                    "departamentoId": departamento_rh_id,
                    "departamentoNome": departamentos_map.get(departamento_rh_id),
                    "status": status_erp or None,
                    "salario": float(row.get("SALARIO") or 0) if row.get("SALARIO") is not None else None,
                    "dataAdmissao": str(row.get("COL_DATA_ADMISSAO")) if row.get("COL_DATA_ADMISSAO") else None,
                    "dataAfastamento": str(row.get("COL_DATA_AFASTAMENTO")) if row.get("COL_DATA_AFASTAMENTO") else None,
                    "email": row.get("PES_EMAIL"),
                    "telefone": row.get("PES_TELEFONE"),
                    "celular": row.get("PES_CELULAR"),
                    "vendedor": str(row.get("PES_VENDEDOR") or "N").strip().upper() == "S",
                }
            )

        return {
            "resumo": resumo,
            "distribuicaoFuncoes": distribuicao_funcoes,
            "funcionarios": resultado_funcionarios,
        }