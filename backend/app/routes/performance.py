from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db
from app.database.erp_connection import get_erp_db
from app.models.funcionario import Funcionario
from app.models.departamento import Departamento

router = APIRouter(prefix="/performance", tags=["Performance"])


def obter_data_hoje_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def obter_primeiro_dia_mes_atual_iso() -> str:
    hoje = datetime.now()
    return hoje.replace(day=1).strftime("%Y-%m-%d")


def formatar_dia_iso_para_br(data_iso: str) -> str:
    try:
        data_obj = datetime.strptime(data_iso, "%Y-%m-%d")
        return data_obj.strftime("%d/%m")
    except Exception:
        return data_iso


def normalizar_periodo(data_inicial: str, data_final: str) -> tuple[str, str]:
    data_inicial_limpa = (data_inicial or "").strip()
    data_final_limpa = (data_final or "").strip()

    if not data_inicial_limpa and not data_final_limpa:
        return obter_primeiro_dia_mes_atual_iso(), obter_data_hoje_iso()

    if data_inicial_limpa and not data_final_limpa:
        return data_inicial_limpa, obter_data_hoje_iso()

    if not data_inicial_limpa and data_final_limpa:
        ano_mes = data_final_limpa[:7]
        return f"{ano_mes}-01", data_final_limpa

    return data_inicial_limpa, data_final_limpa


def montar_filtro_base(
    col_pessoas: list[int],
    acao: str,
    data_inicial: str,
    data_final: str,
) -> tuple[str, dict]:
    params: dict = {}

    placeholders_col = []
    for index, col_pessoa in enumerate(col_pessoas):
        chave = f"col_pessoa_{index}"
        placeholders_col.append(f":{chave}")
        params[chave] = col_pessoa

    filtros = [
        f"v.VDR_PESSOA IN ({', '.join(placeholders_col)})"
    ]

    acao_limpa = (acao or "").strip().upper()
    if acao_limpa:
        filtros.append("UPPER(COALESCE(a.AUD_ACAO, '')) = :acao")
        params["acao"] = acao_limpa

    if data_inicial:
        filtros.append(
            "CAST(a.AUD_DT_LANCAMENTO AS DATE) >= CAST(:data_inicial AS DATE)"
        )
        params["data_inicial"] = data_inicial

    if data_final:
        filtros.append(
            "CAST(a.AUD_DT_LANCAMENTO AS DATE) <= CAST(:data_final AS DATE)"
        )
        params["data_final"] = data_final

    return " AND ".join(filtros), params


@router.get("/visao-geral")
def obter_visao_geral_performance(
    acao: str = Query(default=""),
    departamento_id: int | None = Query(default=None),
    data_inicial: str = Query(default=""),
    data_final: str = Query(default=""),
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db),
):
    data_inicial_normalizada, data_final_normalizada = normalizar_periodo(
        data_inicial,
        data_final,
    )

    query_funcionarios = db.query(Funcionario)

    if departamento_id is not None:
        query_funcionarios = query_funcionarios.filter(
            Funcionario.departamento_id == departamento_id
        )

    funcionarios_rh = query_funcionarios.all()

    if not funcionarios_rh:
        return {
            "filtros": {
                "acao": acao.strip().upper() if acao else None,
                "departamento_id": departamento_id,
                "data_inicial": data_inicial_normalizada,
                "data_final": data_final_normalizada,
            },
            "resumo": {
                "total": 0,
                "inclusoes": 0,
                "alteracoes": 0,
                "exclusoes": 0,
                "cancelamentos": 0,
            },
            "produtividade": {
                "dias_com_atividade": 0,
                "media_por_dia": 0,
                "hora_mais_ativa": "-",
                "tabela_mais_movimentada": "-",
            },
            "acoes_por_dia": [],
            "acoes_por_horario": [],
            "ranking_funcionarios": [],
            "tabela_resumo": [],
            "registros": [],
        }

    departamentos_map = {
        dep.id: dep.nome
        for dep in db.query(Departamento).all()
    }

    funcionarios_map = {
        item.col_pessoa: {
            "rh_id": item.id,
            "col_pessoa": item.col_pessoa,
            "departamento_id": item.departamento_id,
            "departamento": departamentos_map.get(item.departamento_id),
        }
        for item in funcionarios_rh
        if item.col_pessoa is not None
    }

    col_pessoas = list(funcionarios_map.keys())

    if not col_pessoas:
        return {
            "filtros": {
                "acao": acao.strip().upper() if acao else None,
                "departamento_id": departamento_id,
                "data_inicial": data_inicial_normalizada,
                "data_final": data_final_normalizada,
            },
            "resumo": {
                "total": 0,
                "inclusoes": 0,
                "alteracoes": 0,
                "exclusoes": 0,
                "cancelamentos": 0,
            },
            "produtividade": {
                "dias_com_atividade": 0,
                "media_por_dia": 0,
                "hora_mais_ativa": "-",
                "tabela_mais_movimentada": "-",
            },
            "acoes_por_dia": [],
            "acoes_por_horario": [],
            "ranking_funcionarios": [],
            "tabela_resumo": [],
            "registros": [],
        }

    where_sql, params = montar_filtro_base(
        col_pessoas=col_pessoas,
        acao=acao,
        data_inicial=data_inicial_normalizada,
        data_final=data_final_normalizada,
    )

    # Resumo geral
    query_resumo = text(f"""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN a.AUD_ACAO = 'I' THEN 1 ELSE 0 END) AS inclusoes,
            SUM(CASE WHEN a.AUD_ACAO = 'A' THEN 1 ELSE 0 END) AS alteracoes,
            SUM(CASE WHEN a.AUD_ACAO = 'E' THEN 1 ELSE 0 END) AS exclusoes,
            SUM(CASE WHEN a.AUD_ACAO = 'C' THEN 1 ELSE 0 END) AS cancelamentos
        FROM TB_AUDITORIA a
        JOIN TB_USUARIO u
          ON u.USU_ID = a.AUD_USUARIO
        JOIN TB_VENDEDOR v
          ON v.VDR_PESSOA = u.USU_VENDEDOR
        WHERE {where_sql}
    """)

    resumo_row = erp_db.execute(query_resumo, params).fetchone()

    total = int(resumo_row[0] or 0) if resumo_row else 0
    inclusoes = int(resumo_row[1] or 0) if resumo_row else 0
    alteracoes = int(resumo_row[2] or 0) if resumo_row else 0
    exclusoes = int(resumo_row[3] or 0) if resumo_row else 0
    cancelamentos = int(resumo_row[4] or 0) if resumo_row else 0

    # Ações por dia
    query_dias = text(f"""
        SELECT
            CAST(a.AUD_DT_LANCAMENTO AS DATE) AS data_ref,
            COUNT(*) AS total
        FROM TB_AUDITORIA a
        JOIN TB_USUARIO u
          ON u.USU_ID = a.AUD_USUARIO
        JOIN TB_VENDEDOR v
          ON v.VDR_PESSOA = u.USU_VENDEDOR
        WHERE {where_sql}
        GROUP BY CAST(a.AUD_DT_LANCAMENTO AS DATE)
        ORDER BY CAST(a.AUD_DT_LANCAMENTO AS DATE)
    """)

    rows_dias = erp_db.execute(query_dias, params).fetchall()

    acoes_por_dia = []
    for row in rows_dias:
        data_ref = str(row[0]) if row[0] else ""
        acoes_por_dia.append({
            "dia": formatar_dia_iso_para_br(data_ref),
            "data_iso": data_ref,
            "total": int(row[1] or 0),
        })

    dias_com_atividade = len(acoes_por_dia)
    media_por_dia = round(total / dias_com_atividade, 1) if dias_com_atividade > 0 else 0

    # Ações por horário
    query_horas = text(f"""
        SELECT
            EXTRACT(HOUR FROM CAST(a.AUD_DT_LANCAMENTO AS TIMESTAMP)) AS hora_ref,
            COUNT(*) AS total
        FROM TB_AUDITORIA a
        JOIN TB_USUARIO u
          ON u.USU_ID = a.AUD_USUARIO
        JOIN TB_VENDEDOR v
          ON v.VDR_PESSOA = u.USU_VENDEDOR
        WHERE {where_sql}
        GROUP BY EXTRACT(HOUR FROM CAST(a.AUD_DT_LANCAMENTO AS TIMESTAMP))
        ORDER BY EXTRACT(HOUR FROM CAST(a.AUD_DT_LANCAMENTO AS TIMESTAMP))
    """)

    rows_horas = erp_db.execute(query_horas, params).fetchall()

    acoes_por_horario = []
    hora_mais_ativa = "-"
    maior_total_hora = -1

    for row in rows_horas:
        hora_num = int(row[0]) if row[0] is not None else None
        total_hora = int(row[1] or 0)

        if hora_num is None:
            continue

        hora_texto = f"{hora_num:02d}h"
        acoes_por_horario.append({
            "hora": hora_texto,
            "total": total_hora,
        })

        if total_hora > maior_total_hora:
            maior_total_hora = total_hora
            hora_mais_ativa = hora_texto

    # Tabela mais movimentada
    query_tabela_mais = text(f"""
        SELECT FIRST 1
            COALESCE(a.AUD_TABELA_DESC, '-') AS tabela_desc,
            COUNT(*) AS total
        FROM TB_AUDITORIA a
        JOIN TB_USUARIO u
          ON u.USU_ID = a.AUD_USUARIO
        JOIN TB_VENDEDOR v
          ON v.VDR_PESSOA = u.USU_VENDEDOR
        WHERE {where_sql}
        GROUP BY COALESCE(a.AUD_TABELA_DESC, '-')
        ORDER BY COUNT(*) DESC
    """)

    row_tabela_mais = erp_db.execute(query_tabela_mais, params).fetchone()
    tabela_mais_movimentada = str(row_tabela_mais[0]).strip() if row_tabela_mais and row_tabela_mais[0] else "-"

    # Ranking e tabela resumo por colaborador
    query_funcionarios_resumo = text(f"""
        SELECT
            v.VDR_PESSOA AS col_pessoa,
            p.PES_RSOCIAL_NOME AS funcionario,
            COUNT(*) AS total,
            SUM(CASE WHEN a.AUD_ACAO = 'I' THEN 1 ELSE 0 END) AS inclusoes,
            SUM(CASE WHEN a.AUD_ACAO = 'A' THEN 1 ELSE 0 END) AS alteracoes,
            SUM(CASE WHEN a.AUD_ACAO = 'E' THEN 1 ELSE 0 END) AS exclusoes,
            SUM(CASE WHEN a.AUD_ACAO = 'C' THEN 1 ELSE 0 END) AS cancelamentos
        FROM TB_AUDITORIA a
        JOIN TB_USUARIO u
          ON u.USU_ID = a.AUD_USUARIO
        JOIN TB_VENDEDOR v
          ON v.VDR_PESSOA = u.USU_VENDEDOR
        JOIN TB_PESSOA p
          ON p.PES_ID = v.VDR_PESSOA
        WHERE {where_sql}
        GROUP BY v.VDR_PESSOA, p.PES_RSOCIAL_NOME
        ORDER BY COUNT(*) DESC
    """)

    rows_funcionarios = erp_db.execute(query_funcionarios_resumo, params).fetchall()

    ranking_funcionarios = []
    tabela_resumo = []

    for row in rows_funcionarios:
        col_pessoa = row[0]
        funcionario_nome = str(row[1]).strip() if row[1] else f"COL_PESSOA {col_pessoa}"
        total_func = int(row[2] or 0)
        inclusoes_func = int(row[3] or 0)
        alteracoes_func = int(row[4] or 0)
        exclusoes_func = int(row[5] or 0)
        cancelamentos_func = int(row[6] or 0)

        dados_rh = funcionarios_map.get(col_pessoa, {})
        departamento_nome = dados_rh.get("departamento")

        ranking_funcionarios.append({
            "nome": funcionario_nome,
            "departamento": departamento_nome,
            "total": total_func,
            "inclusoes": inclusoes_func,
            "alteracoes": alteracoes_func,
            "exclusoes": exclusoes_func,
            "cancelamentos": cancelamentos_func,
        })

        tabela_resumo.append({
            "funcionario": funcionario_nome,
            "departamento": departamento_nome,
            "acoes": total_func,
            "inclusoes": inclusoes_func,
            "alteracoes": alteracoes_func,
            "exclusoes": exclusoes_func,
            "cancelamentos": cancelamentos_func,
        })

    return {
        "filtros": {
            "acao": (acao or "").strip().upper() or None,
            "departamento_id": departamento_id,
            "data_inicial": data_inicial_normalizada,
            "data_final": data_final_normalizada,
        },
        "resumo": {
            "total": total,
            "inclusoes": inclusoes,
            "alteracoes": alteracoes,
            "exclusoes": exclusoes,
            "cancelamentos": cancelamentos,
        },
        "produtividade": {
            "dias_com_atividade": dias_com_atividade,
            "media_por_dia": media_por_dia,
            "hora_mais_ativa": hora_mais_ativa,
            "tabela_mais_movimentada": tabela_mais_movimentada,
        },
        "acoes_por_dia": acoes_por_dia,
        "acoes_por_horario": acoes_por_horario,
        "ranking_funcionarios": ranking_funcionarios,
        "tabela_resumo": tabela_resumo,
        "registros": [],
    }