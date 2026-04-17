from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException

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

        sql = text("""
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
        """)

        rows = self.db.execute(sql).mappings().all()

        resultado: List[Dict[str, Any]] = []

        for row in rows:
            pasta = row.get("pasta_nome")
            pasta_pai = row.get("pasta_pai_nome")
            categoria_item = self._categorizar(pasta, pasta_pai)

            if categoria_item != categoria:
                continue

            resultado.append({
                "cdarquivo": row.get("cdarquivo"),
                "nome": row.get("nome"),
                "descricao": row.get("descricao"),
                "pasta": pasta,
                "pasta_pai": pasta_pai,
                "ultima_alteracao": str(row.get("ultima_alteracao")) if row.get("ultima_alteracao") else None,
                "categoria": categoria_item
            })

        return resultado

    def _obter_relatorio_base(self, cdarquivo: int) -> Dict[str, Any]:
        sql = text("""
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
        """)

        row = self.db.execute(sql, {"cdarquivo": cdarquivo}).mappings().first()

        if not row:
            raise HTTPException(status_code=404, detail="Relatório não encontrado")

        return dict(row)

    def _blob_para_texto(self, blob_data: Any) -> str:
        if blob_data is None:
            raise HTTPException(status_code=400, detail="Relatório sem conteúdo no campo ARQUIVO")

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

    def inspecionar_relatorio(self, cdarquivo: int) -> Dict[str, Any]:
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
                "observacoes": [f"Falha ao interpretar XML FastReport: {str(exc)}"],
            }
            xml_valido = False

        return {
            "cdarquivo": relatorio.get("cdarquivo"),
            "nome": relatorio.get("nome"),
            "descricao": relatorio.get("descricao"),
            "pasta_nome": relatorio.get("pasta_nome"),
            "pasta_pai_nome": relatorio.get("pasta_pai_nome"),
            "categoria": categoria,
            "xml_valido": xml_valido,
            "datasets": parsed["datasets"],
            "variables": parsed["variables"],
            "queries": parsed["queries"],
            "observacoes": parsed["observacoes"],
        }

    def obter_xml_bruto(self, cdarquivo: int) -> str:
        relatorio = self._obter_relatorio_base(cdarquivo)
        return self._blob_para_texto(relatorio.get("arquivo"))

    def _obter_query_principal(self, cdarquivo: int) -> Dict[str, Any]:
        inspecao = self.inspecionar_relatorio(cdarquivo)
        queries = inspecao.get("queries", [])

        if not queries:
            raise HTTPException(status_code=400, detail="Nenhuma query encontrada no relatório")

        principal = queries[0]

        sql_text = principal.get("sql_text")
        if not sql_text:
            raise HTTPException(status_code=400, detail="A query principal não possui SQL utilizável")

        return principal

    def preview_relatorio(self, cdarquivo: int, parametros: Dict[str, Any]) -> Dict[str, Any]:
        relatorio = self._obter_relatorio_base(cdarquivo)
        query_principal = self._obter_query_principal(cdarquivo)
        sql_text = query_principal["sql_text"]

        params = {
            "EMPRESA": parametros.get("EMPRESA"),
            "DATAINICIAL": parametros.get("DATAINICIAL"),
            "DATAFINAL": parametros.get("DATAFINAL"),
            "PNATUREZA": parametros.get("PNATUREZA", 0),
            "PVENDEDOR": parametros.get("PVENDEDOR", 0),
        }

        faltando = [chave for chave in ["EMPRESA", "DATAINICIAL", "DATAFINAL"] if not params.get(chave)]
        if faltando:
            raise HTTPException(
                status_code=400,
                detail=f"Parâmetros obrigatórios ausentes: {', '.join(faltando)}"
            )

        result = self.db.execute(text(sql_text), params)
        rows = result.mappings().all()

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

    def opcoes_relatorio(self, cdarquivo: int) -> Dict[str, Any]:
        inspecao = self.inspecionar_relatorio(cdarquivo)
        queries = inspecao.get("queries", [])

        vendedores = []
        naturezas = []

        if len(queries) >= 2 and queries[1].get("sql_text"):
            result_vendedores = self.db.execute(text(queries[1]["sql_text"])).mappings().all()
            vendedores = [dict(row) for row in result_vendedores]

        if len(queries) >= 3 and queries[2].get("sql_text"):
            result_naturezas = self.db.execute(text(queries[2]["sql_text"])).mappings().all()
            naturezas = [dict(row) for row in result_naturezas]

        return {
            "vendedores": vendedores,
            "naturezas": naturezas,
        }