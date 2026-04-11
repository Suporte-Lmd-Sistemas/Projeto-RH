from __future__ import annotations

from app.repositories.dashboard_funcionarios_repository import DashboardFuncionariosRepository


class DashboardFuncionariosService:
    def __init__(self) -> None:
        self.repository = DashboardFuncionariosRepository()

    def get_dashboard_funcionarios(self, empresa_id: int | None = None) -> dict:
        total_funcionarios = self.repository.get_total_funcionarios(empresa_id)
        ativos = self.repository.get_total_ativos(empresa_id)
        afastados = self.repository.get_total_afastados(empresa_id)
        vendedores = self.repository.get_total_vendedores(empresa_id)
        media_salarial = self.repository.get_media_salarial(empresa_id)

        funcionarios_rows = self.repository.get_funcionarios(empresa_id)
        distribuicao_rows = self.repository.get_distribuicao_funcoes(empresa_id)

        funcionarios = [
            {
                "pessoaId": int(row.get("PESSOA_ID", 0) or 0),
                "nome": row.get("NOME") or "Sem nome",
                "funcao": row.get("COL_FUNCAO"),
                "status": row.get("COL_STATUS"),
                "dataAdmissao": row.get("COL_DATA_ADMISSAO").isoformat() if row.get("COL_DATA_ADMISSAO") else None,
                "salario": float(row.get("SALARIO", 0) or 0),
                "vendedor": str(row.get("PES_VENDEDOR") or "N").upper() == "S",
                "usuarioId": int(row.get("USU_ID", 0) or 0) if row.get("USU_ID") is not None else None,
                "usuarioNome": row.get("USU_NOME"),
            }
            for row in funcionarios_rows
        ]

        distribuicao_funcoes = [
            {
                "funcao": row.get("FUNCAO") or "Nao informada",
                "quantidade": int(row.get("QUANTIDADE", 0) or 0),
            }
            for row in distribuicao_rows
        ]

        return {
            "resumo": {
                "totalFuncionarios": total_funcionarios,
                "ativos": ativos,
                "afastados": afastados,
                "vendedores": vendedores,
                "mediaSalarial": round(media_salarial, 2),
            },
            "funcionarios": funcionarios,
            "distribuicaoFuncoes": distribuicao_funcoes,
        }