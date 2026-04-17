# app/services/report_executor.py

from typing import Any, Dict, List, Optional

from sqlalchemy import text

from app.services.report_parameter_extractor import extract_params_from_queries
from app.services.report_parameter_resolver import ParameterResolver, ReportParameter


class ReportExecutorService:
    """
    Serviço responsável por:
    - descobrir parâmetros usados pelo relatório
    - gerar binds automáticos
    - executar preview
    """

    def __init__(self, db_session):
        self.db = db_session

    def get_sql_list(self, parsed_report: Dict[str, Any]) -> List[str]:
        sql_list: List[str] = []

        for q in parsed_report.get("queries", []):
            if isinstance(q, dict):
                sql = q.get("sql", "")
            else:
                sql = getattr(q, "sql", "")

            if sql and str(sql).strip():
                sql_list.append(str(sql))

        return sql_list

    def get_main_sql(self, parsed_report: Dict[str, Any]) -> str:
        """
        Primeira versão: usa a primeira query válida.
        """
        sql_list = self.get_sql_list(parsed_report)
        if not sql_list:
            raise ValueError("Nenhuma query encontrada no relatório.")

        return sql_list[0]

    def describe_parameters(
        self,
        parsed_report: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[ReportParameter]:
        sql_list = self.get_sql_list(parsed_report)
        param_names = extract_params_from_queries(sql_list)

        resolver = ParameterResolver(user_context=user_context)
        return resolver.describe(param_names)

    def build_parameter_bundle(
        self,
        parsed_report: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        report_params = self.describe_parameters(parsed_report, user_context=user_context)

        return {
            "param_names": [p.original_name for p in report_params],
            "parameters": [
                {
                    "original_name": p.original_name,
                    "normalized_name": p.normalized_name,
                    "semantic_key": p.semantic_key,
                    "inferred_type": p.inferred_type,
                    "required": p.required,
                    "default_value": p.default_value,
                    "aliases": p.aliases,
                }
                for p in report_params
            ]
        }

    def execute_preview(
        self,
        parsed_report: Dict[str, Any],
        payload: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executa a query principal do relatório com parâmetros dinâmicos.
        """
        resolver = ParameterResolver(user_context=user_context)
        report_params = self.describe_parameters(parsed_report, user_context=user_context)
        bind_params = resolver.resolve(report_params, incoming_payload=payload)

        main_sql = self.get_main_sql(parsed_report)

        # opcional: limitar volume
        if limit and limit > 0:
            # Firebird suporta FIRST
            main_sql = f"SELECT FIRST {int(limit)} * FROM ({main_sql}) X"

        result = self.db.execute(text(main_sql), bind_params)
        rows = result.fetchall()
        columns = list(result.keys())

        linhas = []
        for row in rows:
            linhas.append(dict(zip(columns, row)))

        return {
            "colunas": columns,
            "linhas": linhas,
            "total_registros": len(linhas),
            "parametros_usados": bind_params,
            "parametros_detectados": [
                {
                    "original_name": p.original_name,
                    "normalized_name": p.normalized_name,
                    "semantic_key": p.semantic_key,
                    "inferred_type": p.inferred_type,
                    "required": p.required,
                    "default_value": p.default_value,
                    "aliases": p.aliases,
                }
                for p in report_params
            ]
        }