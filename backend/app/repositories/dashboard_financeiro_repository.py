from __future__ import annotations

from typing import Any
import unicodedata
from datetime import date

from app.repositories.base_dashboard_repository import BaseDashboardRepository
from app.services.base_dashboard_service import DateRange


class DashboardFinanceiroRepository(BaseDashboardRepository):
    def _normalize_city_name(self, value: str | None) -> str:
        if not value:
            return ""

        normalized = unicodedata.normalize("NFKD", value)
        normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
        normalized = normalized.upper().strip()
        normalized = " ".join(normalized.split())
        return normalized

    def _get_city_position(self, city_name: str) -> dict[str, Any]:
        map_positions = {
            "SAO PAULO": {"x": 312, "y": 202, "cor": "#1d4ed8"},
            "RIO DE JANEIRO": {"x": 338, "y": 214, "cor": "#0f766e"},
            "BELO HORIZONTE": {"x": 318, "y": 182, "cor": "#2563eb"},
            "CURITIBA": {"x": 290, "y": 248, "cor": "#f59e0b"},
            "GOIANIA": {"x": 270, "y": 176, "cor": "#06b6d4"},
            "PORTO ALEGRE": {"x": 268, "y": 286, "cor": "#ef4444"},
            "SALVADOR": {"x": 350, "y": 185, "cor": "#7c3aed"},
            "BRASILIA": {"x": 284, "y": 170, "cor": "#0891b2"},
            "CAMPINAS": {"x": 304, "y": 198, "cor": "#2563eb"},
            "SANTOS": {"x": 316, "y": 216, "cor": "#0ea5e9"},
            "LEOPOLDINA": {"x": 345, "y": 188, "cor": "#1d4ed8"},
            "CATAGUASES": {"x": 337, "y": 183, "cor": "#0f766e"},
            "SAO JOAO NEPOMUCENO": {"x": 324, "y": 191, "cor": "#7c3aed"},
            "ALEM PARAIBA": {"x": 360, "y": 182, "cor": "#2563eb"},
            "MURIAE": {"x": 346, "y": 198, "cor": "#f59e0b"},
            "MAR DE ESPANHA": {"x": 318, "y": 196, "cor": "#06b6d4"},
            "RECREIO": {"x": 352, "y": 191, "cor": "#ef4444"},
            "ASTOLFO DUTRA": {"x": 333, "y": 189, "cor": "#0ea5e9"},
            "RIO NOVO": {"x": 316, "y": 187, "cor": "#0891b2"},
            "NAO INFORMADA": {"x": 250, "y": 160, "cor": "#64748b"},
        }

        return map_positions.get(
            self._normalize_city_name(city_name),
            {"x": 250, "y": 160, "cor": "#64748b"},
        )

    def get_contas_receber_total(self, date_range: DateRange, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(
                SUM(CAST(COALESCE(REC_VALOR, 0) AS NUMERIC(18,2))),
                0
            ) AS TOTAL
            FROM TB_RECEBIMENTO
            WHERE REC_DT_VENCIMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(REC_STATUS, '') <> 'CANCELADO'
              AND COALESCE(REC_ABERTO, 'N') = 'S'
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._scalar(sql, params)

    def get_contas_pagar_total(self, date_range: DateRange, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("PAG_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(
                SUM(CAST(COALESCE(PAG_VALOR, 0) AS NUMERIC(18,2))),
                0
            ) AS TOTAL
            FROM TB_PAGAMENTO
            WHERE PAG_DT_VENCIMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PAG_STATUS, '') <> 'CANCELADO'
              AND COALESCE(PAG_ABERTO, 'N') = 'S'
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._scalar(sql, params)

    def get_total_receber_vencido(self, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(
                SUM(CAST(COALESCE(REC_VALOR, 0) AS NUMERIC(18,2))),
                0
            ) AS TOTAL
            FROM TB_RECEBIMENTO
            WHERE REC_DT_VENCIMENTO < CURRENT_DATE
              AND COALESCE(REC_STATUS, '') <> 'CANCELADO'
              AND COALESCE(REC_ABERTO, 'N') = 'S'
              {empresa_sql}
        """

        return self._scalar(sql, empresa_params)

    def get_total_recebido_periodo(self, date_range: DateRange, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("R.REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(SUM(CAST(COALESCE(I.RIT_VALOR, 0) AS NUMERIC(18,2))), 0) AS TOTAL
            FROM TB_RECEBIMENTO_ITEM I
            INNER JOIN TB_RECEBIMENTO R
                ON R.REC_ID = I.RIT_RECEBIMENTO
               AND R.REC_EMPRESA = I.RIT_EMPRESA
            WHERE I.RIT_DT_ACAO BETWEEN :start_date AND :end_date
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._scalar(sql, params)

    def get_total_pago_periodo(self, date_range: DateRange, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("P.PAG_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(SUM(CAST(COALESCE(I.PIT_VALOR, 0) AS NUMERIC(18,2))), 0) AS TOTAL
            FROM TB_PAGAMENTO_ITEM I
            INNER JOIN TB_PAGAMENTO P
                ON P.PAG_ID = I.PIT_PAGAMENTO
               AND P.PAG_EMPRESA = I.PIT_EMPRESA
            WHERE I.PIT_DT_ACAO BETWEEN :start_date AND :end_date
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._scalar(sql, params)

    def get_contas_pagar_highlight(self, empresa_id: int | None) -> str:
        empresa_sql, empresa_params = self._empresa_filter("PAG_EMPRESA", empresa_id)

        sql = f"""
            SELECT COUNT(*) AS TOTAL
            FROM TB_PAGAMENTO
            WHERE PAG_DT_VENCIMENTO BETWEEN CURRENT_DATE AND DATEADD(7 DAY TO CURRENT_DATE)
              AND COALESCE(PAG_STATUS, '') <> 'CANCELADO'
              AND COALESCE(PAG_ABERTO, 'N') = 'S'
              {empresa_sql}
        """

        quantidade = self._safe_int(self._scalar(sql, empresa_params))
        return f"{quantidade} titulos vencem nos proximos 7 dias"

    def get_contas_receber_highlight(self, date_range: DateRange, empresa_id: int | None) -> str:
        empresa_sql, empresa_params = self._empresa_filter("REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT AVG(
                CASE
                    WHEN REC_DT_EMISSAO IS NOT NULL AND REC_DT_VENCIMENTO IS NOT NULL
                    THEN DATEDIFF(DAY FROM REC_DT_EMISSAO TO REC_DT_VENCIMENTO)
                    ELSE NULL
                END
            ) AS TOTAL
            FROM TB_RECEBIMENTO
            WHERE REC_DT_VENCIMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(REC_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        prazo_medio = self._safe_int(round(self._scalar(sql, params) or 0))
        return f"Prazo medio de recebimento em {prazo_medio} dias"

    def get_contas_receber_history(self, empresa_id: int | None) -> list[int]:
        empresa_sql, empresa_params = self._empresa_filter("REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                EXTRACT(YEAR FROM REC_DT_VENCIMENTO) AS ANO,
                EXTRACT(MONTH FROM REC_DT_VENCIMENTO) AS MES,
                COALESCE(
                    SUM(CAST(COALESCE(REC_VALOR, 0) AS NUMERIC(18,2))),
                    0
                ) AS TOTAL
            FROM TB_RECEBIMENTO
            WHERE REC_DT_VENCIMENTO >= DATEADD(-11 MONTH TO CURRENT_DATE)
              AND COALESCE(REC_STATUS, '') <> 'CANCELADO'
              AND COALESCE(REC_ABERTO, 'N') = 'S'
              {empresa_sql}
            GROUP BY 1, 2
            ORDER BY 1, 2
        """

        rows = self._fetch_all(sql, empresa_params)
        return [self._safe_int(row.get("TOTAL")) for row in rows][-12:]

    def get_contas_pagar_history(self, empresa_id: int | None) -> list[int]:
        empresa_sql, empresa_params = self._empresa_filter("PAG_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                EXTRACT(YEAR FROM PAG_DT_VENCIMENTO) AS ANO,
                EXTRACT(MONTH FROM PAG_DT_VENCIMENTO) AS MES,
                COALESCE(
                    SUM(CAST(COALESCE(PAG_VALOR, 0) AS NUMERIC(18,2))),
                    0
                ) AS TOTAL
            FROM TB_PAGAMENTO
            WHERE PAG_DT_VENCIMENTO >= DATEADD(-11 MONTH TO CURRENT_DATE)
              AND COALESCE(PAG_STATUS, '') <> 'CANCELADO'
              AND COALESCE(PAG_ABERTO, 'N') = 'S'
              {empresa_sql}
            GROUP BY 1, 2
            ORDER BY 1, 2
        """

        rows = self._fetch_all(sql, empresa_params)
        return [self._safe_int(row.get("TOTAL")) for row in rows][-12:]

    def get_receitas_despesas(
        self,
        date_range: DateRange,
        empresa_id: int | None,
    ) -> list[dict[str, Any]]:
        empresa_rec_sql, empresa_rec_params = self._empresa_filter("R.REC_EMPRESA", empresa_id)
        empresa_pag_sql, empresa_pag_params = self._empresa_filter("P.PAG_EMPRESA", empresa_id)

        receitas_sql = f"""
            SELECT
                EXTRACT(YEAR FROM R.REC_DT_EMISSAO) AS ANO,
                EXTRACT(MONTH FROM R.REC_DT_EMISSAO) AS MES,
                COALESCE(SUM(CAST(COALESCE(R.REC_VALOR, 0) AS NUMERIC(18,2))), 0) AS TOTAL
            FROM TB_RECEBIMENTO R
            JOIN TB_RECEBIMENTO_ITEM I ON I.RIT_RECEBIMENTO = R.REC_ID
            WHERE R.REC_DT_EMISSAO BETWEEN :start_date AND :end_date
              AND R.REC_STATUS NOT IN ('BX', 'CN')
              {empresa_rec_sql}
            GROUP BY 1, 2
        """

        despesas_sql = f"""
            SELECT
                EXTRACT(YEAR FROM I.PIT_DT_ACAO) AS ANO,
                EXTRACT(MONTH FROM I.PIT_DT_ACAO) AS MES,
                COALESCE(SUM(CAST(COALESCE(I.PIT_VALOR, 0) AS NUMERIC(18,2))), 0) AS TOTAL
            FROM TB_PAGAMENTO_ITEM I
            INNER JOIN TB_PAGAMENTO P
                ON P.PAG_ID = I.PIT_PAGAMENTO
               AND P.PAG_EMPRESA = I.PIT_EMPRESA
            WHERE I.PIT_DT_ACAO BETWEEN :start_date AND :end_date
              {empresa_pag_sql}
            GROUP BY 1, 2
        """

        params_rec = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_rec_params,
        }
        params_pag = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_pag_params,
        }

        receitas_rows = self._fetch_all(receitas_sql, params_rec)
        despesas_rows = self._fetch_all(despesas_sql, params_pag)

        receitas_map = {
            (self._safe_int(row.get("ANO")), self._safe_int(row.get("MES"))): self._safe_float(row.get("TOTAL"))
            for row in receitas_rows
        }
        despesas_map = {
            (self._safe_int(row.get("ANO")), self._safe_int(row.get("MES"))): self._safe_float(row.get("TOTAL"))
            for row in despesas_rows
        }

        all_keys = sorted(set(receitas_map.keys()) | set(despesas_map.keys()))

        return [
            {
                "label": self._month_label(month),
                "receitas": receitas_map.get((year, month), 0),
                "despesas": despesas_map.get((year, month), 0),
            }
            for year, month in all_keys
            if year and month
        ]

    def get_aging(self, empresa_id: int | None) -> list[dict[str, Any]]:
        empresa_sql, empresa_params = self._empresa_filter("REC_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                REC_DT_VENCIMENTO,
                CAST(COALESCE(REC_VALOR, 0) AS NUMERIC(18,2)) AS VALOR_ABERTO
            FROM TB_RECEBIMENTO
            WHERE COALESCE(REC_STATUS, '') <> 'CANCELADO'
              AND COALESCE(REC_ABERTO, 'N') = 'S'
              {empresa_sql}
        """

        rows = self._fetch_all(sql, empresa_params)
        today = date.today()

        result = {
            "1-7 dias": {"faixa": "1-7 dias", "valor": 0.0, "titulos": 0, "tone": "blue"},
            "1-21 dias": {"faixa": "1-21 dias", "valor": 0.0, "titulos": 0, "tone": "sky"},
            "1-30 dias": {"faixa": "1-30 dias", "valor": 0.0, "titulos": 0, "tone": "amber"},
            "31-60 dias": {"faixa": "31-60 dias", "valor": 0.0, "titulos": 0, "tone": "orange"},
            "61-90 dias": {"faixa": "61-90 dias", "valor": 0.0, "titulos": 0, "tone": "orange-strong"},
            "91-120 dias": {"faixa": "91-120 dias", "valor": 0.0, "titulos": 0, "tone": "red-soft"},
            "A vencer": {"faixa": "A vencer", "valor": 0.0, "titulos": 0, "tone": "teal"},
            "+120 dias": {"faixa": "+120 dias", "valor": 0.0, "titulos": 0, "tone": "red"},
        }

        for row in rows:
            vencimento = row.get("REC_DT_VENCIMENTO")
            valor = self._safe_float(row.get("VALOR_ABERTO"))

            if vencimento is None:
                continue

            atraso = (today - vencimento).days

            if atraso <= 0:
                result["A vencer"]["valor"] += valor
                result["A vencer"]["titulos"] += 1
            elif 1 <= atraso <= 7:
                result["1-7 dias"]["valor"] += valor
                result["1-7 dias"]["titulos"] += 1
            elif 8 <= atraso <= 21:
                result["1-21 dias"]["valor"] += valor
                result["1-21 dias"]["titulos"] += 1
            elif 22 <= atraso <= 30:
                result["1-30 dias"]["valor"] += valor
                result["1-30 dias"]["titulos"] += 1
            elif 31 <= atraso <= 60:
                result["31-60 dias"]["valor"] += valor
                result["31-60 dias"]["titulos"] += 1
            elif 61 <= atraso <= 90:
                result["61-90 dias"]["valor"] += valor
                result["61-90 dias"]["titulos"] += 1
            elif 91 <= atraso <= 120:
                result["91-120 dias"]["valor"] += valor
                result["91-120 dias"]["titulos"] += 1
            else:
                result["+120 dias"]["valor"] += valor
                result["+120 dias"]["titulos"] += 1

        ordered_keys = [
            "1-7 dias",
            "1-21 dias",
            "1-30 dias",
            "31-60 dias",
            "61-90 dias",
            "91-120 dias",
            "A vencer",
            "+120 dias",
        ]
        return [result[key] for key in ordered_keys]

    def get_melhores_clientes(
        self,
        date_range: DateRange,
        empresa_id: int | None,
    ) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("R.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                R.PEV_CLIENTE AS CLIENTE_ID,
                COALESCE(NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''), P.PES_RSOCIAL_NOME) AS CLIENTE_NOME,
                COALESCE(SUM(CAST(COALESCE(R.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))), 0) AS VALOR_TOTAL,
                COUNT(*) AS PEDIDOS
            FROM TB_PEDIDO_VENDA R
            INNER JOIN TB_CLIENTE C
                ON C.CLI_PESSOA = R.PEV_CLIENTE
            INNER JOIN TB_PESSOA P
                ON P.PES_ID = C.CLI_PESSOA
            WHERE R.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND R.PEV_CLIENTE IS NOT NULL
              AND COALESCE(R.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY
                R.PEV_CLIENTE,
                COALESCE(NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''), P.PES_RSOCIAL_NOME)
            ORDER BY VALOR_TOTAL DESC
            ROWS 5
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "nome": row.get("CLIENTE_NOME") or f"Cliente {self._safe_int(row.get('CLIENTE_ID'))}",
                "valor": self._safe_float(row.get("VALOR_TOTAL")),
                "pedidos": self._safe_int(row.get("PEDIDOS")),
            }
            for row in rows
        ]

    def get_melhores_fornecedores(
        self,
        date_range: DateRange,
        empresa_id: int | None,
    ) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("P.PAG_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                P.PAG_PESSOA AS FORNECEDOR_ID,
                COALESCE(NULLIF(TRIM(PS.PES_FANTASIA_APELIDO), ''), PS.PES_RSOCIAL_NOME) AS FORNECEDOR_NOME,
                COUNT(*) AS QUANTIDADE,
                COALESCE(SUM(CAST(COALESCE(P.PAG_VALOR, 0) AS NUMERIC(18,2))), 0) AS VOLUME
            FROM TB_PAGAMENTO P
            INNER JOIN TB_FORNECEDOR F
                ON F.FOR_PESSOA = P.PAG_PESSOA
            INNER JOIN TB_PESSOA PS
                ON PS.PES_ID = F.FOR_PESSOA
            WHERE P.PAG_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND P.PAG_PESSOA IS NOT NULL
              AND COALESCE(P.PAG_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY
                P.PAG_PESSOA,
                COALESCE(NULLIF(TRIM(PS.PES_FANTASIA_APELIDO), ''), PS.PES_RSOCIAL_NOME)
            ORDER BY QUANTIDADE DESC
            ROWS 5
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "nome": row.get("FORNECEDOR_NOME") or f"Fornecedor {self._safe_int(row.get('FORNECEDOR_ID'))}",
                "quantidade": self._safe_int(row.get("QUANTIDADE")),
                "volume": self._safe_float(row.get("VOLUME")),
            }
            for row in rows
        ]

    def get_estoque_critico(self, empresa_id: int | None) -> list[dict]:
        resultado_com_minimo = self._get_estoque_critico_com_minimo(empresa_id)
        if resultado_com_minimo:
            return resultado_com_minimo
        return self._get_estoque_critico_sem_minimo(empresa_id)

    def _get_estoque_critico_com_minimo(self, empresa_id: int | None) -> list[dict]:
        empresa_prod_sql, empresa_prod_params = self._empresa_filter("P.PRD_EMPRESA", empresa_id)
        empresa_est_sql, empresa_est_params = self._empresa_filter("E.PRDE_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                P.PRD_ID AS PRODUTO_ID,
                P.PRD_DESCRICAO AS PRODUTO,
                CAST(COALESCE(E.PRDE_ESTOQUE, 0) AS NUMERIC(18,2)) AS ESTOQUE,
                CAST(COALESCE(P.PRD_ESTOQUE_MINIMO, 0) AS NUMERIC(18,2)) AS MINIMO,
                P.PRD_STATUS,
                P.PRD_CONTROLA_ESTOQUE
            FROM TB_PRODUTO P
            INNER JOIN TB_PRODUTO_ESTOQUE E
                ON E.PRDE_PRODUTO = P.PRD_ID
               AND E.PRDE_EMPRESA = P.PRD_EMPRESA
            WHERE COALESCE(P.PRD_ESTOQUE_MINIMO, 0) > 0
              AND COALESCE(E.PRDE_ESTOQUE, 0) <= COALESCE(P.PRD_ESTOQUE_MINIMO, 0)
              {empresa_prod_sql}
              {empresa_est_sql}
            ORDER BY P.PRD_DESCRICAO
            ROWS 30
        """

        params = {
            **empresa_prod_params,
            **empresa_est_params,
        }

        rows = self._fetch_all(sql, params)

        result = []
        for row in rows:
            product_status = str(row.get("PRD_STATUS") or "").strip().upper()
            controls_stock = str(row.get("PRD_CONTROLA_ESTOQUE") or "").strip().upper()

            if product_status in {"INATIVO", "I", "0"}:
                continue

            if controls_stock not in {"S", "SIM", "1", "T", "TRUE"}:
                continue

            estoque = self._safe_float(row.get("ESTOQUE"))
            minimo = self._safe_float(row.get("MINIMO"))

            if minimo <= 0:
                continue

            if estoque <= minimo * 0.5:
                status = "Critico"
            elif estoque <= minimo * 0.8:
                status = "Reposicao"
            else:
                status = "Atencao"

            result.append(
                {
                    "produto": row.get("PRODUTO"),
                    "estoque": self._safe_int(round(estoque)),
                    "minimo": self._safe_int(round(minimo)),
                    "status": status,
                }
            )

            if len(result) == 10:
                break

        return result

    def _get_estoque_critico_sem_minimo(self, empresa_id: int | None) -> list[dict]:
        empresa_prod_sql, empresa_prod_params = self._empresa_filter("P.PRD_EMPRESA", empresa_id)
        empresa_est_sql, empresa_est_params = self._empresa_filter("E.PRDE_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                P.PRD_ID AS PRODUTO_ID,
                P.PRD_DESCRICAO AS PRODUTO,
                CAST(COALESCE(E.PRDE_ESTOQUE, 0) AS NUMERIC(18,2)) AS ESTOQUE,
                P.PRD_STATUS,
                P.PRD_CONTROLA_ESTOQUE
            FROM TB_PRODUTO P
            INNER JOIN TB_PRODUTO_ESTOQUE E
                ON E.PRDE_PRODUTO = P.PRD_ID
               AND E.PRDE_EMPRESA = P.PRD_EMPRESA
            {f"WHERE 1=1 {empresa_prod_sql} {empresa_est_sql}"}
            ORDER BY E.PRDE_ESTOQUE ASC, P.PRD_DESCRICAO
            ROWS 30
        """

        params = {
            **empresa_prod_params,
            **empresa_est_params,
        }

        rows = self._fetch_all(sql, params)

        result = []
        for row in rows:
            product_status = str(row.get("PRD_STATUS") or "").strip().upper()
            controls_stock = str(row.get("PRD_CONTROLA_ESTOQUE") or "").strip().upper()

            if product_status in {"INATIVO", "I", "0"}:
                continue

            if controls_stock not in {"S", "SIM", "1", "T", "TRUE"}:
                continue

            estoque = self._safe_float(row.get("ESTOQUE"))

            status = "Atencao"
            if estoque <= 0:
                status = "Critico"
            elif estoque <= 3:
                status = "Reposicao"

            result.append(
                {
                    "produto": row.get("PRODUTO"),
                    "estoque": self._safe_int(round(estoque)),
                    "minimo": 0,
                    "status": status,
                }
            )

            if len(result) == 10:
                break

        return result

    def get_clientes_por_cidade(
        self,
        date_range: DateRange,
        empresa_id: int | None,
    ) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                CID.CID_ID AS CIDADE_ID,
                CID.CID_NOME AS CIDADE_NOME,
                COUNT(DISTINCT P.PES_ID) AS QUANTIDADE
            FROM TB_PEDIDO_VENDA PV
            INNER JOIN TB_CLIENTE C
                ON C.CLI_PESSOA = PV.PEV_CLIENTE
            INNER JOIN TB_PESSOA P
                ON P.PES_ID = C.CLI_PESSOA
            LEFT JOIN TB_CIDADE CID
                ON CID.CID_ID = P.PES_CIDADE
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND PV.PEV_CLIENTE IS NOT NULL
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY CID.CID_ID, CID.CID_NOME
            ORDER BY QUANTIDADE DESC
            ROWS 10
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        result = []
        for row in rows:
            city_name = row.get("CIDADE_NOME") or "Nao informada"
            position = self._get_city_position(city_name)

            result.append(
                {
                    "cidade": city_name,
                    "quantidade": self._safe_int(row.get("QUANTIDADE")),
                    "x": position["x"],
                    "y": position["y"],
                    "cor": position["cor"],
                }
            )

        return result