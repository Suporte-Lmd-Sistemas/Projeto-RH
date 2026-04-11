from __future__ import annotations

from app.repositories.dashboard_financeiro_repository import DashboardFinanceiroRepository
from app.services.base_dashboard_service import BaseDashboardService


class DashboardFinanceiroService(BaseDashboardService):
    def __init__(self) -> None:
        self.repository = DashboardFinanceiroRepository()

    def get_dashboard_financeiro(
        self,
        period: str,
        report_type: str,
        start: str | None,
        end: str | None,
        empresa_id: int | None = None,
    ) -> dict:
        date_range = self._resolve_period(period, start, end)

        contas_pagar_total = self.repository.get_contas_pagar_total(date_range, empresa_id)
        contas_receber_total = self.repository.get_contas_receber_total(date_range, empresa_id)
        total_vencido = self.repository.get_total_receber_vencido(empresa_id)
        recuperado_mes = self.repository.get_total_recebido_periodo(date_range, empresa_id)

        return {
            "contasPagar": {
                "total": contas_pagar_total,
                "variation": self._get_contas_pagar_variation(date_range, empresa_id),
                "subtitle": "Compromissos financeiros do periodo selecionado",
                "highlight": self.repository.get_contas_pagar_highlight(empresa_id),
                "history": self.repository.get_contas_pagar_history(empresa_id),
            },
            "contasReceber": {
                "total": contas_receber_total,
                "variation": self._get_contas_receber_variation(date_range, empresa_id),
                "subtitle": "Titulos a receber e carteira financeira ativa",
                "highlight": self.repository.get_contas_receber_highlight(date_range, empresa_id),
                "history": self.repository.get_contas_receber_history(empresa_id),
            },
            "inadimplencia": {
                "taxa": round((total_vencido / contas_receber_total) * 100, 1)
                if contas_receber_total
                else 0,
                "totalVencido": total_vencido,
                "totalReceber": contas_receber_total,
                "recuperadoMes": recuperado_mes,
            },
            "receitasDespesas": self.repository.get_receitas_despesas(date_range, empresa_id),
            "aging": self.repository.get_aging(empresa_id),
            "melhoresClientes": self.repository.get_melhores_clientes(date_range, empresa_id),
            "melhoresFornecedores": self.repository.get_melhores_fornecedores(date_range, empresa_id),
            "estoqueCritico": self.repository.get_estoque_critico(empresa_id),
            "cidadesClientes": self.repository.get_clientes_por_cidade(date_range, empresa_id),
        }

    def _get_contas_receber_variation(self, date_range, empresa_id: int | None) -> str:
        previous_period = self._previous_period(date_range)
        current_value = self.repository.get_contas_receber_total(date_range, empresa_id)
        previous_value = self.repository.get_contas_receber_total(previous_period, empresa_id)
        return self._format_variation(current_value, previous_value)

    def _get_contas_pagar_variation(self, date_range, empresa_id: int | None) -> str:
        previous_period = self._previous_period(date_range)
        current_value = self.repository.get_contas_pagar_total(date_range, empresa_id)
        previous_value = self.repository.get_contas_pagar_total(previous_period, empresa_id)
        return self._format_variation(current_value, previous_value)