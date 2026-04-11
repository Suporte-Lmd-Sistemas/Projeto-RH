from __future__ import annotations

from app.repositories.dashboard_vendas_repository import DashboardVendasRepository
from app.services.base_dashboard_service import BaseDashboardService


class DashboardVendasService(BaseDashboardService):
    def __init__(self) -> None:
        self.repository = DashboardVendasRepository()

    def get_dashboard_vendas(
        self,
        period: str,
        start: str | None,
        end: str | None,
        empresa_id: int | None = None,
    ) -> dict:
        date_range = self._resolve_period(period, start, end)

        faturamento = self.repository.get_faturamento_total(date_range, empresa_id)
        pedidos = self.repository.get_total_pedidos(date_range, empresa_id)
        ticket_medio = faturamento / pedidos if pedidos else 0

        return {
            "resumo": {
                "faturamento": faturamento,
                "pedidos": pedidos,
                "ticketMedio": round(ticket_medio, 2),
                "variation": self._get_faturamento_variation(date_range, empresa_id),
            },
            "historico": self.repository.get_historico_vendas(empresa_id),
            "topClientes": self.repository.get_top_clientes(date_range, empresa_id),
            "topProdutos": self.repository.get_top_produtos(date_range, empresa_id),
            "vendasPorCidade": self.repository.get_vendas_por_cidade(date_range, empresa_id),
            "vendasPorVendedor": self.repository.get_vendas_por_vendedor(date_range, empresa_id),
            "vendasPorGrupo": self.repository.get_vendas_por_grupo(date_range, empresa_id),
            "vendasPorMarca": self.repository.get_vendas_por_marca(date_range, empresa_id),
            "mediaPorFaixaHoraria": self.repository.get_media_por_faixa_horaria(date_range, empresa_id),
            "mediaPorDiaSemana": self.repository.get_media_por_dia_semana(date_range, empresa_id),
        }

    def _get_faturamento_variation(self, date_range, empresa_id: int | None) -> str:
        previous_period = self._previous_period(date_range)
        current_value = self.repository.get_faturamento_total(date_range, empresa_id)
        previous_value = self.repository.get_faturamento_total(previous_period, empresa_id)
        return self._format_variation(current_value, previous_value)