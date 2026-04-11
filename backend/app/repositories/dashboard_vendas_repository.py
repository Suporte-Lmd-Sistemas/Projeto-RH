from __future__ import annotations

from app.repositories.base_dashboard_repository import BaseDashboardRepository
from app.services.base_dashboard_service import DateRange


class DashboardVendasRepository(BaseDashboardRepository):
    def get_faturamento_total(self, date_range: DateRange, empresa_id: int | None) -> float:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT COALESCE(
                SUM(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                0
            ) AS TOTAL
            FROM TB_PEDIDO_VENDA PV
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._scalar(sql, params)

    def get_total_pedidos(self, date_range: DateRange, empresa_id: int | None) -> int:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT COUNT(*) AS TOTAL
            FROM TB_PEDIDO_VENDA PV
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }
        return self._safe_int(self._scalar(sql, params))

    def get_historico_vendas(self, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                EXTRACT(YEAR FROM PV.PEV_DT_LANCAMENTO) AS ANO,
                EXTRACT(MONTH FROM PV.PEV_DT_LANCAMENTO) AS MES,
                COALESCE(
                    SUM(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR,
                COUNT(*) AS PEDIDOS
            FROM TB_PEDIDO_VENDA PV
            WHERE PV.PEV_DT_LANCAMENTO >= DATEADD(-11 MONTH TO CURRENT_DATE)
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY 1, 2
            ORDER BY 1, 2
        """

        rows = self._fetch_all(sql, empresa_params)

        return [
            {
                "ano": self._safe_int(row.get("ANO")),
                "label": self._month_label(self._safe_int(row.get("MES"))),
                "valor": self._safe_float(row.get("VALOR")),
                "pedidos": self._safe_int(row.get("PEDIDOS")),
            }
            for row in rows
        ]

    def get_top_clientes(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                PV.PEV_CLIENTE AS CLIENTE_ID,
                COALESCE(
                    NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''),
                    P.PES_RSOCIAL_NOME
                ) AS CLIENTE_NOME,
                COALESCE(
                    SUM(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR,
                COUNT(*) AS PEDIDOS
            FROM TB_PEDIDO_VENDA PV
            INNER JOIN TB_CLIENTE C
                ON C.CLI_PESSOA = PV.PEV_CLIENTE
            INNER JOIN TB_PESSOA P
                ON P.PES_ID = C.CLI_PESSOA
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND PV.PEV_CLIENTE IS NOT NULL
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY
                PV.PEV_CLIENTE,
                COALESCE(NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''), P.PES_RSOCIAL_NOME)
            ORDER BY VALOR DESC
            ROWS 10
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
                "valor": self._safe_float(row.get("VALOR")),
                "pedidos": self._safe_int(row.get("PEDIDOS")),
            }
            for row in rows
        ]

    def get_top_produtos(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_item_sql, empresa_item_params = self._empresa_filter("PEVI.PEVI_EMPRESA", empresa_id)
        empresa_pedido_sql, empresa_pedido_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                PEVI.PEVI_PRODUTO AS PRODUTO_ID,
                COALESCE(
                    NULLIF(TRIM(PR.PRD_DESCRICAO), ''),
                    'Produto sem descricao'
                ) AS PRODUTO,
                COALESCE(
                    SUM(CAST(COALESCE(PEVI.PEVI_QUANTIDADE, 0) AS NUMERIC(18,4))),
                    0
                ) AS QUANTIDADE,
                COALESCE(
                    SUM(CAST(COALESCE(PEVI.PEVI_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR
            FROM TB_PEDIDO_VENDA_ITEM PEVI
            INNER JOIN TB_PEDIDO_VENDA PV
                ON PV.PEV_ID = PEVI.PEVI_PEDIDO_VENDA
               AND PV.PEV_EMPRESA = PEVI.PEVI_EMPRESA
            LEFT JOIN TB_PRODUTO PR
                ON PR.PRD_ID = PEVI.PEVI_PRODUTO
               AND PR.PRD_EMPRESA = PEVI.PEVI_EMPRESA
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_item_sql}
              {empresa_pedido_sql}
            GROUP BY
                PEVI.PEVI_PRODUTO,
                COALESCE(NULLIF(TRIM(PR.PRD_DESCRICAO), ''), 'Produto sem descricao')
            ORDER BY VALOR DESC
            ROWS 5
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_item_params,
            **empresa_pedido_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "produto": row.get("PRODUTO") or f"Produto {self._safe_int(row.get('PRODUTO_ID'))}",
                "quantidade": self._safe_float(row.get("QUANTIDADE")),
                "valor": self._safe_float(row.get("VALOR")),
            }
            for row in rows
        ]

    def get_vendas_por_cidade(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                CID.CID_NOME AS CIDADE,
                COUNT(*) AS QUANTIDADE
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
            GROUP BY CID.CID_NOME
            ORDER BY QUANTIDADE DESC
            ROWS 10
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "cidade": row.get("CIDADE") or "Nao informada",
                "quantidade": self._safe_int(row.get("QUANTIDADE")),
            }
            for row in rows
        ]

    def get_vendas_por_vendedor(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                PV.PEV_VENDEDOR AS VENDEDOR_ID,
                COALESCE(
                    NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''),
                    P.PES_RSOCIAL_NOME
                ) AS VENDEDOR_NOME,
                COUNT(*) AS PEDIDOS,
                COALESCE(
                    SUM(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR
            FROM TB_PEDIDO_VENDA PV
            LEFT JOIN TB_PESSOA P
                ON P.PES_ID = PV.PEV_VENDEDOR
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              AND PV.PEV_VENDEDOR IS NOT NULL
              {empresa_sql}
            GROUP BY
                PV.PEV_VENDEDOR,
                COALESCE(NULLIF(TRIM(P.PES_FANTASIA_APELIDO), ''), P.PES_RSOCIAL_NOME)
            ORDER BY VALOR DESC
            ROWS 10
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "vendedor": row.get("VENDEDOR_NOME")
                or f"Vendedor {self._safe_int(row.get('VENDEDOR_ID'))}",
                "pedidos": self._safe_int(row.get("PEDIDOS")),
                "valor": self._safe_float(row.get("VALOR")),
            }
            for row in rows
        ]

    def get_vendas_por_grupo(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_item_sql, empresa_item_params = self._empresa_filter("PEVI.PEVI_EMPRESA", empresa_id)
        empresa_pedido_sql, empresa_pedido_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                PG.PGRU_DESCRICAO AS LABEL,
                PR.PRD_GRUPO AS GRUPO_ID,
                COALESCE(
                    SUM(CAST(COALESCE(PEVI.PEVI_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR
            FROM TB_PEDIDO_VENDA_ITEM PEVI
            INNER JOIN TB_PEDIDO_VENDA PV
                ON PV.PEV_ID = PEVI.PEVI_PEDIDO_VENDA
               AND PV.PEV_EMPRESA = PEVI.PEVI_EMPRESA
            LEFT JOIN TB_PRODUTO PR
                ON PR.PRD_ID = PEVI.PEVI_PRODUTO
               AND PR.PRD_EMPRESA = PEVI.PEVI_EMPRESA
            LEFT JOIN TB_PROD_GRUPO PG
                ON PG.PGRU_ID = PR.PRD_GRUPO
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_item_sql}
              {empresa_pedido_sql}
            GROUP BY
                PG.PGRU_DESCRICAO,
                PR.PRD_GRUPO
            ORDER BY VALOR DESC
            ROWS 10
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_item_params,
            **empresa_pedido_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "label": row.get("LABEL")
                or f"Grupo {self._safe_int(row.get('GRUPO_ID'))}"
                or "Nao informado",
                "valor": self._safe_float(row.get("VALOR")),
            }
            for row in rows
        ]

    def get_vendas_por_marca(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_item_sql, empresa_item_params = self._empresa_filter("PEVI.PEVI_EMPRESA", empresa_id)
        empresa_pedido_sql, empresa_pedido_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                PM.PMAR_DESCRICAO AS LABEL,
                PR.PRD_MARCA AS MARCA_ID,
                COALESCE(
                    SUM(CAST(COALESCE(PEVI.PEVI_VALOR_TOTAL, 0) AS NUMERIC(18,2))),
                    0
                ) AS VALOR
            FROM TB_PEDIDO_VENDA_ITEM PEVI
            INNER JOIN TB_PEDIDO_VENDA PV
                ON PV.PEV_ID = PEVI.PEVI_PEDIDO_VENDA
               AND PV.PEV_EMPRESA = PEVI.PEVI_EMPRESA
            LEFT JOIN TB_PRODUTO PR
                ON PR.PRD_ID = PEVI.PEVI_PRODUTO
               AND PR.PRD_EMPRESA = PEVI.PEVI_EMPRESA
            LEFT JOIN TB_PROD_MARCA PM
                ON PM.PMAR_ID = PR.PRD_MARCA
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_item_sql}
              {empresa_pedido_sql}
            GROUP BY
                PM.PMAR_DESCRICAO,
                PR.PRD_MARCA
            ORDER BY VALOR DESC
            ROWS 10
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_item_params,
            **empresa_pedido_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "label": row.get("LABEL")
                or f"Marca {self._safe_int(row.get('MARCA_ID'))}"
                or "Nao informada",
                "valor": self._safe_float(row.get("VALOR")),
            }
            for row in rows
        ]

    def get_media_por_faixa_horaria(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                CASE
                    WHEN EXTRACT(HOUR FROM PV.PEV_DT_LANCAMENTO) BETWEEN 0 AND 5 THEN '00h-05h'
                    WHEN EXTRACT(HOUR FROM PV.PEV_DT_LANCAMENTO) BETWEEN 6 AND 11 THEN '06h-11h'
                    WHEN EXTRACT(HOUR FROM PV.PEV_DT_LANCAMENTO) BETWEEN 12 AND 17 THEN '12h-17h'
                    ELSE '18h-23h'
                END AS FAIXA,
                AVG(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))) AS VALOR,
                COUNT(*) AS PEDIDOS
            FROM TB_PEDIDO_VENDA PV
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY 1
            ORDER BY 1
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        return [
            {
                "faixa": row.get("FAIXA") or "",
                "valor": self._safe_float(row.get("VALOR")),
                "pedidos": self._safe_int(row.get("PEDIDOS")),
            }
            for row in rows
        ]

    def get_media_por_dia_semana(self, date_range: DateRange, empresa_id: int | None) -> list[dict]:
        empresa_sql, empresa_params = self._empresa_filter("PV.PEV_EMPRESA", empresa_id)

        sql = f"""
            SELECT
                EXTRACT(WEEKDAY FROM PV.PEV_DT_LANCAMENTO) AS DIA_NUM,
                AVG(CAST(COALESCE(PV.PEV_VALOR_TOTAL, 0) AS NUMERIC(18,2))) AS VALOR,
                COUNT(*) AS PEDIDOS
            FROM TB_PEDIDO_VENDA PV
            WHERE PV.PEV_DT_LANCAMENTO BETWEEN :start_date AND :end_date
              AND COALESCE(PV.PEV_STATUS, '') <> 'CANCELADO'
              {empresa_sql}
            GROUP BY 1
            ORDER BY 1
        """

        params = {
            "start_date": date_range.start,
            "end_date": date_range.end,
            **empresa_params,
        }

        rows = self._fetch_all(sql, params)

        labels = {
            0: "Dom",
            1: "Seg",
            2: "Ter",
            3: "Qua",
            4: "Qui",
            5: "Sex",
            6: "Sab",
        }

        return [
            {
                "dia": labels.get(self._safe_int(row.get("DIA_NUM")), str(row.get("DIA_NUM"))),
                "valor": self._safe_float(row.get("VALOR")),
                "pedidos": self._safe_int(row.get("PEDIDOS")),
            }
            for row in rows
        ]