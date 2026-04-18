from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.relatorio_fastreport_parser import parse_fastreport_xml


class RelatoriosService:
    def __init__(self, db: Session):
        self.db = db

    def _categoria_valida(self, categoria: str) -> str:
        categoria = (categoria or "").strip().lower()
        validas = {"vendas", "financeiro", "consultoria", "diversos"}

        if categoria not in validas:
            raise HTTPException(status_code=400, detail="Categoria inválida")

        return categoria

    def _normalizar(self, valor: Optional[str]) -> str:
        return (valor or "").strip().upper()

    def _categorizar(self, pasta: Optional[str], pasta_pai: Optional[str]) -> str:
        texto = f"{self._normalizar(pasta)} {self._normalizar(pasta_pai)}"

        if any(x in texto for x in ["VEND", "PEDIDO", "COMERCIAL", "FATUR"]):
            return "vendas"

        if any(x in texto for x in ["FINANC", "CAIXA", "RECEBER", "PAGAR"]):
            return "financeiro"

        if any(x in texto for x in ["CONTAB", "CONSULT", "FISCAL", "TRIBUT"]):
            return "consultoria"

        return "diversos"

    def listar_relatorios(self, categoria: str) -> List[Dict[str, Any]]:
        categoria = self._categoria_valida(categoria)

        sql = text(
            """
            SELECT
                ra.cdarquivo,
                ra.cdpastamae,
                ra.nome,
                ra.descricao,
                ra.exportar,
                ra.periodo_app,
                ra.vendedor_app,
                ra.cliente_app,
                ra.empresa_app,
                ra.ultima_alteracao,
                p.nome AS pasta_nome,
                pm.nome AS pasta_pai_nome
            FROM RELATORIOARQUIVO ra
            LEFT JOIN RELATORIOPASTA p
                ON p.cdpasta = ra.cdpastamae
            LEFT JOIN RELATORIOPASTA pm
                ON pm.cdpasta = p.cdpastamae
            WHERE COALESCE(ra.exportar, 'N') = 'S'
            ORDER BY p.nome, ra.nome
            """
        )

        rows = self.db.execute(sql).mappings().all()

        resultado: List[Dict[str, Any]] = []

        for row in rows:
            pasta = row.get("pasta_nome")
            pasta_pai = row.get("pasta_pai_nome")
            categoria_item = self._categorizar(pasta, pasta_pai)

            if categoria_item != categoria:
                continue

            resultado.append(
                {
                    "cdarquivo": row.get("cdarquivo"),
                    "nome": row.get("nome"),
                    "descricao": row.get("descricao"),
                    "pasta": pasta,
                    "pasta_pai": pasta_pai,
                    "ultima_alteracao": str(row.get("ultima_alteracao"))
                    if row.get("ultima_alteracao")
                    else None,
                    "categoria": categoria_item,
                }
            )

        return resultado

    def _obter_relatorio_base(self, cdarquivo: int) -> Dict[str, Any]:
        sql = text(
            """
            SELECT
                ra.cdarquivo,
                ra.cdpastamae,
                ra.nome,
                ra.descricao,
                ra.arquivo,
                ra.exportar,
                ra.periodo_app,
                ra.vendedor_app,
                ra.cliente_app,
                ra.empresa_app,
                ra.ultima_alteracao,
                p.nome AS pasta_nome,
                pm.nome AS pasta_pai_nome
            FROM RELATORIOARQUIVO ra
            LEFT JOIN RELATORIOPASTA p
                ON p.cdpasta = ra.cdpastamae
            LEFT JOIN RELATORIOPASTA pm
                ON pm.cdpasta = p.cdpastamae
            WHERE ra.cdarquivo = :cdarquivo
            """
        )

        row = self.db.execute(sql, {"cdarquivo": cdarquivo}).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Relatório não encontrado")

        return dict(row)

    def _blob_para_texto(self, blob_data: Any) -> str:
        if blob_data is None:
            raise HTTPException(
                status_code=400,
                detail="Relatório sem conteúdo no campo ARQUIVO",
            )

        if hasattr(blob_data, "read"):
            blob_data = blob_data.read()

        if isinstance(blob_data, bytes):
            try:
                return blob_data.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    return blob_data.decode("latin-1")
                except UnicodeDecodeError:
                    return blob_data.decode("utf-8", errors="ignore")

        return str(blob_data)

    def _inferir_parametros_detectados(
        self, queries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        hoje = date.today()
        primeiro_dia = hoje.replace(day=1)

        unicos: Dict[str, Dict[str, Any]] = {}

        for query in queries:
            parametros = query.get("parametros", []) or []

            for param in parametros:
                original_name = str(param.get("name") or "").strip()
                datatype = str(param.get("datatype") or "").strip().lower()

                if not original_name:
                    continue

                chave = original_name.upper()

                if chave in unicos:
                    continue

                inferred_type = "str"
                semantic_key = chave.lower()
                default_value: Any = ""

                if "date" in datatype:
                    inferred_type = "date"

                    if "INICIAL" in chave or "INICIO" in chave:
                        semantic_key = "data_inicial"
                        default_value = primeiro_dia.isoformat()
                    elif "FINAL" in chave or "FIM" in chave:
                        semantic_key = "data_final"
                        default_value = hoje.isoformat()
                    else:
                        semantic_key = "data"
                        default_value = hoje.isoformat()

                elif any(
                    item in datatype
                    for item in ["integer", "smallint", "bigint", "int"]
                ):
                    inferred_type = "int"
                    default_value = 0

                    if "EMPRESA" in chave:
                        semantic_key = "empresa"
                        default_value = 1
                    elif "VENDEDOR" in chave:
                        semantic_key = "vendedor"
                    elif "CLIENTE" in chave:
                        semantic_key = "cliente"
                    elif "NATUREZA" in chave:
                        semantic_key = "natureza"
                    elif "GRUPO" in chave:
                        semantic_key = "grupo"
                    elif "MARCA" in chave:
                        semantic_key = "marca"
                    elif "CIDADE" in chave:
                        semantic_key = "cidade"
                    elif "REGIAO" in chave or "REGIÃO" in chave:
                        semantic_key = "regiao"
                    elif "FORNECEDOR" in chave:
                        semantic_key = "fornecedor"

                elif any(
                    item in datatype
                    for item in ["numeric", "float", "double", "decimal"]
                ):
                    inferred_type = "number"
                    default_value = 0

                if chave == "PANALISE":
                    semantic_key = "analise"
                    inferred_type = "str"
                    default_value = "GRUPO"

                if chave == "TIPODATA":
                    semantic_key = "tipo_data"
                    inferred_type = "str"
                    default_value = "EMISSAO"

                unicos[chave] = {
                    "original_name": original_name,
                    "inferred_type": inferred_type,
                    "semantic_key": semantic_key,
                    "default_value": default_value,
                }

        return list(unicos.values())

    def _parse_relatorio(self, cdarquivo: int) -> Dict[str, Any]:
        relatorio = self._obter_relatorio_base(cdarquivo)
        xml_text = self._blob_para_texto(relatorio.get("arquivo"))
        categoria = self._categorizar(
            relatorio.get("pasta_nome"),
            relatorio.get("pasta_pai_nome"),
        )

        try:
            parsed = parse_fastreport_xml(xml_text)
            xml_valido = True
        except Exception as exc:
            parsed = {
                "datasets": [],
                "variables": [],
                "queries": [],
                "layout_visual": None,
                "observacoes": [f"Falha ao interpretar XML FastReport: {str(exc)}"],
            }
            xml_valido = False

        queries = parsed.get("queries", []) or []
        parameters_detected = parsed.get("parameters_detected")

        if not isinstance(parameters_detected, list):
            parameters_detected = self._inferir_parametros_detectados(queries)

        return {
            "relatorio": relatorio,
            "categoria": categoria,
            "xml_valido": xml_valido,
            "parsed": {
                **parsed,
                "parameters_detected": parameters_detected,
            },
        }

    def inspecionar_relatorio(self, cdarquivo: int) -> Dict[str, Any]:
        info = self._parse_relatorio(cdarquivo)
        relatorio = info["relatorio"]
        parsed = info["parsed"]

        return {
            "cdarquivo": relatorio.get("cdarquivo"),
            "nome": relatorio.get("nome"),
            "descricao": relatorio.get("descricao"),
            "pasta_nome": relatorio.get("pasta_nome"),
            "pasta_pai_nome": relatorio.get("pasta_pai_nome"),
            "categoria": info["categoria"],
            "xml_valido": info["xml_valido"],
            "datasets": parsed.get("datasets", []),
            "variables": parsed.get("variables", []),
            "queries": parsed.get("queries", []),
            "parameters_detected": parsed.get("parameters_detected", []),
            "layout_visual": parsed.get("layout_visual"),
            "observacoes": parsed.get("observacoes", []),
        }

    def obter_xml_bruto(self, cdarquivo: int) -> str:
        relatorio = self._obter_relatorio_base(cdarquivo)
        return self._blob_para_texto(relatorio.get("arquivo"))

    def _escolher_query_principal(self, queries: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not queries:
            raise HTTPException(
                status_code=400,
                detail="Nenhuma query encontrada no relatório",
            )

        for query in queries:
            sql_text = str(query.get("sql_text") or "").strip().lower()
            if sql_text.startswith("select") or sql_text.startswith("/*"):
                return query

        principal = queries[0]
        if not principal.get("sql_text"):
            raise HTTPException(
                status_code=400,
                detail="A query principal não possui SQL utilizável",
            )

        return principal

    def _buscar_parametro_payload(self, payload: Dict[str, Any], nome_parametro: str) -> Any:
        if nome_parametro in payload:
            return payload[nome_parametro]

        nome_normalizado = str(nome_parametro).strip().upper()

        for chave, valor in payload.items():
            if str(chave).strip().upper() == nome_normalizado:
                return valor

        return None

    def _coerce_param_value(self, raw_value: Any, inferred_type: Optional[str]) -> Any:
        if raw_value == "":
            return None

        if raw_value is None:
            return None

        if inferred_type == "int":
            try:
                return int(raw_value)
            except (TypeError, ValueError):
                return raw_value

        if inferred_type == "number":
            try:
                return float(raw_value)
            except (TypeError, ValueError):
                return raw_value

        return raw_value

    def _gerar_aliases_parametro(self, nome: str, valor: Any) -> Dict[str, Any]:
        nome_limpo = str(nome or "").strip()
        if not nome_limpo:
            return {}

        return {
            nome_limpo: valor,
            nome_limpo.upper(): valor,
            nome_limpo.lower(): valor,
        }

    def _montar_parametros_execucao(
        self,
        query: Dict[str, Any],
        payload: Dict[str, Any],
        parameters_detected: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        detected_map = {
            str(item.get("original_name", "")).strip().upper(): item
            for item in parameters_detected
            if item.get("original_name")
        }

        params_execucao: Dict[str, Any] = {}
        faltando: List[str] = []

        for parametro in query.get("parametros", []):
            nome = parametro.get("name")
            if not nome:
                continue

            chave = str(nome).strip().upper()
            detected = detected_map.get(chave, {})

            raw_value = self._buscar_parametro_payload(payload, nome)

            if raw_value is None:
                raw_value = detected.get("default_value")

            valor = self._coerce_param_value(
                raw_value,
                detected.get("inferred_type"),
            )

            if valor is None:
                faltando.append(nome)
                continue

            params_execucao.update(self._gerar_aliases_parametro(nome, valor))

        if faltando:
            raise HTTPException(
                status_code=400,
                detail=f"Parâmetros obrigatórios ausentes: {', '.join(faltando)}",
            )

        return params_execucao

    def preview_relatorio(self, cdarquivo: int, parametros: Dict[str, Any]) -> Dict[str, Any]:
        info = self._parse_relatorio(cdarquivo)
        relatorio = info["relatorio"]
        parsed = info["parsed"]
        queries = parsed.get("queries", [])
        parameters_detected = parsed.get("parameters_detected", [])

        query_principal = self._escolher_query_principal(queries)
        sql_text = query_principal.get("sql_text")

        if not sql_text:
            raise HTTPException(
                status_code=400,
                detail="A query principal não possui SQL utilizável",
            )

        params = self._montar_parametros_execucao(
            query=query_principal,
            payload=parametros or {},
            parameters_detected=parameters_detected,
        )

        try:
            result = self.db.execute(text(sql_text), params)
            rows = result.mappings().all()
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao executar preview do relatório: {str(exc)}",
            )

        linhas = [dict(row) for row in rows]
        colunas = list(linhas[0].keys()) if linhas else []

        return {
            "cdarquivo": relatorio.get("cdarquivo"),
            "nome": relatorio.get("nome"),
            "colunas": colunas,
            "linhas": linhas,
            "total_registros": len(linhas),
            "parametros_utilizados": params,
        }

    def _classificar_opcao_query(self, query: Dict[str, Any]) -> str:
        texto = " ".join(
            [
                str(query.get("name") or ""),
                str(query.get("user_name") or ""),
                str(query.get("sql_text") or ""),
            ]
        ).upper()

        if "VENDED" in texto:
            return "vendedores"

        if "NATUREZA" in texto or "NOP_" in texto:
            return "naturezas"

        if "CLIENTE" in texto or "CLI_" in texto:
            return "clientes"

        if "GRUPO" in texto or "PGRU_" in texto:
            return "grupos"

        if "MARCA" in texto or "PMAR_" in texto:
            return "marcas"

        if "CIDADE" in texto or "CID_" in texto:
            return "cidades"

        if "REGIAO" in texto or "REGIÃO" in texto or "REG_" in texto:
            return "regioes"

        if "FORNECEDOR" in texto or "FORNEC" in texto:
            return "fornecedores"

        nome = str(query.get("name") or query.get("user_name") or "opcao").strip()
        nome = nome.lower() or "opcao"
        return f"query_{nome}"

    def _listar_empresas(self) -> List[Dict[str, Any]]:
        sql = text(
            """
            SELECT
                EMP_ID,
                EMP_FANTASIA,
                EMP_RAZAO_SOCIAL,
                EMP_CNPJ
            FROM TB_EMPRESA
            WHERE COALESCE(EMP_STATUS, 'A') = 'A'
            ORDER BY EMP_FANTASIA, EMP_RAZAO_SOCIAL, EMP_ID
            """
        )

        rows = self.db.execute(sql).mappings().all()

        empresas: List[Dict[str, Any]] = []

        for row in rows:
            row_dict = dict(row)

            emp_id = row_dict.get("EMP_ID")
            fantasia = row_dict.get("EMP_FANTASIA") or row_dict.get("emp_fantasia") or ""
            razao = row_dict.get("EMP_RAZAO_SOCIAL") or row_dict.get("emp_razao_social") or ""
            cnpj = row_dict.get("EMP_CNPJ") or row_dict.get("emp_cnpj") or ""

            if fantasia and razao and fantasia != razao:
                label = f"{fantasia} - {razao}"
            else:
                label = fantasia or razao or f"Empresa {emp_id}"

            if cnpj:
                label = f"{label} ({cnpj})"

            empresas.append(
                {
                    "VALUE": emp_id if emp_id is not None else row_dict.get("emp_id"),
                    "LABEL": label,
                    "EMP_ID": emp_id if emp_id is not None else row_dict.get("emp_id"),
                    "EMP_FANTASIA": fantasia,
                    "EMP_RAZAO_SOCIAL": razao,
                    "EMP_CNPJ": cnpj,
                }
            )

        return empresas

    def _normalizar_linhas_opcoes(self, linhas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalizadas: List[Dict[str, Any]] = []

        for idx, linha in enumerate(linhas):
            valores = list(linha.values())
            value = valores[0] if len(valores) > 0 else idx
            label = valores[1] if len(valores) > 1 else value

            normalizadas.append(
                {
                    "VALUE": value,
                    "LABEL": str(label),
                    **linha,
                }
            )

        return normalizadas

    def opcoes_relatorio(self, cdarquivo: int) -> Dict[str, Any]:
        info = self._parse_relatorio(cdarquivo)
        parsed = info["parsed"]
        queries = parsed.get("queries", [])

        principal = self._escolher_query_principal(queries) if queries else None

        opcoes: Dict[str, Any] = {
            "empresas": self._listar_empresas(),
            "vendedores": [],
            "naturezas": [],
            "clientes": [],
            "grupos": [],
            "marcas": [],
            "cidades": [],
            "regioes": [],
            "fornecedores": [],
        }

        for query in queries:
            if principal and query is principal:
                continue

            sql_text = query.get("sql_text")
            parametros = query.get("parametros", [])

            if not sql_text:
                continue

            if parametros:
                continue

            try:
                result = self.db.execute(text(sql_text)).mappings().all()
                linhas = [dict(row) for row in result]
            except Exception:
                continue

            chave = self._classificar_opcao_query(query)

            if chave in {
                "vendedores",
                "naturezas",
                "clientes",
                "grupos",
                "marcas",
                "cidades",
                "regioes",
                "fornecedores",
            }:
                opcoes[chave] = self._normalizar_linhas_opcoes(linhas)
            else:
                opcoes[chave] = linhas

        return opcoes