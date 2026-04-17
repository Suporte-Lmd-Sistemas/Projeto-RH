# app/api/relatorios.py

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.fastreport_parser import parse_fastreport
from app.services.report_executor import ReportExecutorService

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


def carregar_relatorio_row(db: Session, cdarquivo: int):
    """
    Busca os dados do relatório no banco.
    Ajuste se quiser retornar mais campos.
    """
    sql = text("""
        SELECT
            ra.CDARQUIVO,
            ra.CDPASTAMAE,
            ra.NOME,
            ra.DESCRICAO,
            ra.ARQUIVO,
            ra.EXPORTAR,
            ra.PERIODO_APP,
            ra.VENDEDOR_APP,
            ra.CLIENTE_APP,
            ra.EMPRESA_APP,
            ra.ULTIMA_ALTERACAO
        FROM RELATORIOARQUIVO ra
        WHERE ra.CDARQUIVO = :cdarquivo
    """)

    row = db.execute(sql, {"cdarquivo": cdarquivo}).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"Relatório {cdarquivo} não encontrado.")

    return row


def ler_blob_relatorio(blob_value: Any) -> str:
    """
    Converte o BLOB do Firebird para texto XML.
    """
    if blob_value is None:
        raise ValueError("Campo ARQUIVO está vazio.")

    # Caso já venha como bytes
    if isinstance(blob_value, bytes):
        return blob_value.decode("utf-8", errors="ignore")

    # Caso seja stream/file-like
    if hasattr(blob_value, "read"):
        content = blob_value.read()
        if isinstance(content, bytes):
            return content.decode("utf-8", errors="ignore")
        return str(content)

    return str(blob_value)


def build_user_context(payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """
    Contexto padrão para resolução automática dos parâmetros.
    Depois você pode trocar isso por dados do usuário logado.
    """
    payload = payload or {}

    return {
        "empresa_padrao": payload.get("EMPRESA_PADRAO", 1),
        "vendedor_padrao": payload.get("VENDEDOR_PADRAO", 0),
        "cliente_padrao": payload.get("CLIENTE_PADRAO", 0),
        "natureza_padrao": payload.get("NATUREZA_PADRAO", 0),
        "filial_padrao": payload.get("FILIAL_PADRAO", 0),
        "usuario_id": payload.get("USUARIO_ID", 0),
        "rota_padrao": payload.get("ROTA_PADRAO", 0),
        "produto_padrao": payload.get("PRODUTO_PADRAO", 0),
        "grupo_padrao": payload.get("GRUPO_PADRAO", 0),
        "marca_padrao": payload.get("MARCA_PADRAO", 0),
        "tipo_padrao": payload.get("TIPO_PADRAO", 0),
    }


def carregar_xml_e_parsear(db: Session, cdarquivo: int):
    row = carregar_relatorio_row(db, cdarquivo)
    xml_text = ler_blob_relatorio(row["ARQUIVO"])
    parsed = parse_fastreport(xml_text)
    return row, xml_text, parsed


@router.get("/{categoria}")
def listar_relatorios_por_categoria(categoria: str, db: Session = Depends(get_db)):
    """
    Exemplo de listagem. Se você já tem esse endpoint pronto, pode manter o seu.
    """
    categoria = (categoria or "").strip().lower()

    sql = text("""
        SELECT
            ra.CDARQUIVO,
            ra.CDPASTAMAE,
            ra.NOME,
            ra.DESCRICAO,
            ra.EXPORTAR,
            ra.PERIODO_APP,
            ra.VENDEDOR_APP,
            ra.CLIENTE_APP,
            ra.EMPRESA_APP,
            ra.ULTIMA_ALTERACAO,
            rp.NOME AS PASTA_NOME,
            rp.CDPASTAMAE AS PASTA_MAE
        FROM RELATORIOARQUIVO ra
        LEFT JOIN RELATORIOPASTA rp
            ON rp.CDPASTA = ra.CDPASTAMAE
        WHERE COALESCE(ra.EXPORTAR, 'N') = 'S'
        ORDER BY rp.NOME, ra.NOME
    """)

    rows = db.execute(sql).mappings().all()

    def categorizar(row) -> str:
        pasta_nome = (row["PASTA_NOME"] or "").lower()
        # aqui você pode melhorar usando PASTA_PAI_NOME também, se já tiver em outro join

        if "vend" in pasta_nome:
            return "vendas"
        if "finan" in pasta_nome:
            return "financeiro"
        if "consult" in pasta_nome or "contab" in pasta_nome:
            return "consultoria"
        return "diversos"

    result = []
    for row in rows:
        cat = categorizar(row)
        if cat == categoria:
            result.append(dict(row))

    return result


@router.get("/{cdarquivo}/xml")
def obter_xml_relatorio(cdarquivo: int, db: Session = Depends(get_db)):
    try:
        _, xml_text, _ = carregar_xml_e_parsear(db, cdarquivo)
        return {
            "cdarquivo": cdarquivo,
            "xml": xml_text
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{cdarquivo}/inspecionar")
def inspecionar_relatorio(cdarquivo: int, db: Session = Depends(get_db)):
    """
    Mostra XML parseado e parâmetros detectados automaticamente.
    """
    try:
        row, _, parsed = carregar_xml_e_parsear(db, cdarquivo)
        user_context = build_user_context()

        executor = ReportExecutorService(db)
        bundle = executor.build_parameter_bundle(parsed, user_context=user_context)

        return {
            "cdarquivo": row["CDARQUIVO"],
            "nome": row["NOME"],
            "descricao": row["DESCRICAO"],
            "flags_app": {
                "PERIODO_APP": row["PERIODO_APP"],
                "VENDEDOR_APP": row["VENDEDOR_APP"],
                "CLIENTE_APP": row["CLIENTE_APP"],
                "EMPRESA_APP": row["EMPRESA_APP"],
            },
            "datasets": parsed.get("datasets", []),
            "queries": parsed.get("queries", []),
            "variables": parsed.get("variables", []),
            "parameters_detected": bundle["parameters"],
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{cdarquivo}/opcoes")
def obter_opcoes_relatorio(cdarquivo: int, db: Session = Depends(get_db)):
    """
    Carrega combos de apoio conforme os parâmetros detectados.
    Você pode expandir depois.
    """
    try:
        _, _, parsed = carregar_xml_e_parsear(db, cdarquivo)

        user_context = build_user_context()
        executor = ReportExecutorService(db)
        bundle = executor.build_parameter_bundle(parsed, user_context=user_context)

        semantic_keys = {p["semantic_key"] for p in bundle["parameters"]}

        response = {}

        if "empresa" in semantic_keys:
            empresas_sql = text("""
                SELECT 0 AS VALUE, 'Todas' AS LABEL
                FROM RDB$DATABASE
                UNION ALL
                SELECT e.CDEMPRESA AS VALUE, e.NOME AS LABEL
                FROM EMPRESA e
                ORDER BY 1
            """)
            response["empresas"] = [dict(row) for row in db.execute(empresas_sql).mappings().all()]

        if "vendedor" in semantic_keys:
            vendedores_sql = text("""
                SELECT 0 AS VALUE, 'Todos' AS LABEL
                FROM RDB$DATABASE
                UNION ALL
                SELECT v.CDVENDEDOR AS VALUE, v.NOME AS LABEL
                FROM VENDEDOR v
                ORDER BY 1
            """)
            response["vendedores"] = [dict(row) for row in db.execute(vendedores_sql).mappings().all()]

        if "cliente" in semantic_keys:
            clientes_sql = text("""
                SELECT 0 AS VALUE, 'Todos' AS LABEL
                FROM RDB$DATABASE
                UNION ALL
                SELECT c.CDCLIENTE AS VALUE, c.NOME AS LABEL
                FROM CLIENTE c
                ORDER BY 1
            """)
            response["clientes"] = [dict(row) for row in db.execute(clientes_sql).mappings().all()]

        return response

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{cdarquivo}/preview")
def executar_preview_relatorio(cdarquivo: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Preview universal.
    Aceita payload com nomes exatos OU aliases.
    """
    try:
        row, _, parsed = carregar_xml_e_parsear(db, cdarquivo)
        user_context = build_user_context(payload)

        executor = ReportExecutorService(db)
        result = executor.execute_preview(
            parsed_report=parsed,
            payload=payload,
            user_context=user_context,
            limit=None
        )

        return {
            "cdarquivo": row["CDARQUIVO"],
            "nome": row["NOME"],
            **result
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))