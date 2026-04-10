from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db
from app.database.erp_connection import get_erp_db
from app.models.funcionario import Funcionario
from app.models.departamento import Departamento

router = APIRouter(prefix="/performance", tags=["Performance"])


def traduzir_acao(sigla):
    mapa = {
        "A": "Alteração",
        "I": "Inclusão",
        "E": "Exclusão",
        "C": "Cancelamento",
    }
    return mapa.get(str(sigla).strip().upper(), str(sigla) if sigla is not None else "")


def formatar_dia_iso_para_br(data_iso):
    """
    Recebe '2026-04-07' e devolve '07/04'
    """
    try:
        data_obj = datetime.strptime(data_iso, "%Y-%m-%d")
        return data_obj.strftime("%d/%m")
    except Exception:
        return data_iso


@router.get("/visao-geral")
def obter_visao_geral_performance(
    acao: str = Query(default=""),
    departamento_id: int | None = Query(default=None),
    data_inicial: str = Query(default=""),
    data_final: str = Query(default=""),
    limit_por_funcionario: int = Query(default=300, ge=1, le=1000),
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db)
):
    """
    Consolida a auditoria de todos os funcionários vinculados no RH e devolve
    uma visão geral pronta para o frontend.
    """

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
                "data_inicial": data_inicial.strip() if data_inicial else None,
                "data_final": data_final.strip() if data_final else None,
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

    registros_consolidados = []

    for funcionario in funcionarios_rh:
        departamento_nome = departamentos_map.get(funcionario.departamento_id)

        query_nome_erp = text("""
            SELECT
                p.PES_RSOCIAL_NOME
            FROM TB_COLABORADOR c
            JOIN TB_PESSOA p
              ON p.PES_ID = c.COL_PESSOA
            WHERE c.COL_PESSOA = :col_pessoa
        """)

        nome_resultado = erp_db.execute(
            query_nome_erp,
            {"col_pessoa": funcionario.col_pessoa}
        ).fetchone()

        nome_funcionario = (
            str(nome_resultado[0]).strip()
            if nome_resultado and nome_resultado[0] is not None
            else f"COL_PESSOA {funcionario.col_pessoa}"
        )

        filtros_sql = ["v.VDR_PESSOA = :col_pessoa"]
        params = {
            "col_pessoa": funcionario.col_pessoa
        }

        acao_limpa = (acao or "").strip().upper()
        if acao_limpa:
            filtros_sql.append("UPPER(COALESCE(a.AUD_ACAO, '')) = :acao")
            params["acao"] = acao_limpa

        data_inicial_limpa = (data_inicial or "").strip()
        if data_inicial_limpa:
            filtros_sql.append(
                "CAST(a.AUD_DT_LANCAMENTO AS DATE) >= CAST(:data_inicial AS DATE)"
            )
            params["data_inicial"] = data_inicial_limpa

        data_final_limpa = (data_final or "").strip()
        if data_final_limpa:
            filtros_sql.append(
                "CAST(a.AUD_DT_LANCAMENTO AS DATE) <= CAST(:data_final AS DATE)"
            )
            params["data_final"] = data_final_limpa

        where_sql = " AND ".join(filtros_sql)

        query_auditoria = text(f"""
            SELECT FIRST {limit_por_funcionario}
                a.AUD_USUARIO,
                a.AUD_ACAO,
                a.AUD_TABELA_DESC,
                ai.AUDI_CAMPO_DESC,
                a.AUD_DESC_REGISTRO,
                a.AUD_DT_LANCAMENTO,
                a.AUD_SEQUENCIA,
                a.AUD_ID_REGISTRO,
                a.AUD_TABELA,
                u.USU_ID,
                u.USU_NOME,
                u.USU_VENDEDOR,
                v.VDR_PESSOA
            FROM TB_AUDITORIA a
            JOIN TB_AUDITORIA_ITEM ai
              ON ai.AUDI_AUDITORIA = a.AUD_SEQUENCIA
            JOIN TB_USUARIO u
              ON u.USU_ID = a.AUD_USUARIO
            JOIN TB_VENDEDOR v
              ON v.VDR_PESSOA = u.USU_VENDEDOR
            WHERE {where_sql}
            ORDER BY a.AUD_DT_ACAO DESC, a.AUD_SEQUENCIA DESC
        """)

        registros_erp = erp_db.execute(query_auditoria, params).fetchall()

        for registro in registros_erp:
            data_hora = str(registro[5]) if registro[5] else None
            data_iso = data_hora[:10] if data_hora else None
            hora_ref = data_hora[11:13] if data_hora and len(data_hora) >= 13 else None

            registros_consolidados.append({
                "rh_id": funcionario.id,
                "col_pessoa": funcionario.col_pessoa,
                "funcionario": nome_funcionario,
                "departamento_id": funcionario.departamento_id,
                "departamento": departamento_nome,
                "aud_usuario": registro[0],
                "acao_sigla": registro[1],
                "acao": traduzir_acao(registro[1]),
                "tabela_desc": registro[2],
                "campo_desc": registro[3],
                "descricao_registro": registro[4],
                "data_hora": data_hora,
                "data_iso": data_iso,
                "hora_ref": f"{hora_ref}h" if hora_ref is not None else None,
                "aud_sequencia": registro[6],
                "aud_id_registro": registro[7],
                "aud_tabela": registro[8],
                "usuario_id": registro[9],
                "usuario_nome": registro[10],
                "usuario_vendedor": registro[11],
                "vendedor_pessoa": registro[12],
            })

    total = len(registros_consolidados)
    inclusoes = sum(1 for item in registros_consolidados if item["acao_sigla"] == "I")
    alteracoes = sum(1 for item in registros_consolidados if item["acao_sigla"] == "A")
    exclusoes = sum(1 for item in registros_consolidados if item["acao_sigla"] == "E")
    cancelamentos = sum(1 for item in registros_consolidados if item["acao_sigla"] == "C")

    dias_set = set()
    agrupado_horas = defaultdict(int)
    agrupado_tabelas = defaultdict(int)
    agrupado_dias = defaultdict(int)
    agrupado_funcionarios = {}

    for item in registros_consolidados:
        if item["data_iso"]:
            dias_set.add(item["data_iso"])
            agrupado_dias[item["data_iso"]] += 1

        if item["hora_ref"]:
            agrupado_horas[item["hora_ref"]] += 1

        tabela_desc = item["tabela_desc"] if item["tabela_desc"] else "-"
        agrupado_tabelas[tabela_desc] += 1

        chave_func = item["funcionario"]

        if chave_func not in agrupado_funcionarios:
            agrupado_funcionarios[chave_func] = {
                "funcionario": item["funcionario"],
                "departamento": item["departamento"],
                "total": 0,
                "inclusoes": 0,
                "alteracoes": 0,
                "exclusoes": 0,
                "cancelamentos": 0,
            }

        agrupado_funcionarios[chave_func]["total"] += 1

        if item["acao_sigla"] == "I":
            agrupado_funcionarios[chave_func]["inclusoes"] += 1
        elif item["acao_sigla"] == "A":
            agrupado_funcionarios[chave_func]["alteracoes"] += 1
        elif item["acao_sigla"] == "E":
            agrupado_funcionarios[chave_func]["exclusoes"] += 1
        elif item["acao_sigla"] == "C":
            agrupado_funcionarios[chave_func]["cancelamentos"] += 1

    dias_com_atividade = len(dias_set)

    if dias_com_atividade > 0:
        media_por_dia = round(total / dias_com_atividade, 1)
    else:
        media_por_dia = 0

    if agrupado_horas:
        hora_mais_ativa = max(agrupado_horas.items(), key=lambda x: x[1])[0]
    else:
        hora_mais_ativa = "-"

    if agrupado_tabelas:
        tabela_mais_movimentada = max(agrupado_tabelas.items(), key=lambda x: x[1])[0]
    else:
        tabela_mais_movimentada = "-"

    acoes_por_dia = [
        {
            "dia": formatar_dia_iso_para_br(data_iso),
            "data_iso": data_iso,
            "total": total_dia,
        }
        for data_iso, total_dia in sorted(agrupado_dias.items(), key=lambda x: x[0])
    ]

    def ordenar_hora_texto(hora_texto):
        try:
            return int(hora_texto.replace("h", ""))
        except Exception:
            return 999

    acoes_por_horario = [
        {
            "hora": hora,
            "total": total_hora,
        }
        for hora, total_hora in sorted(
            agrupado_horas.items(),
            key=lambda x: ordenar_hora_texto(x[0])
        )
    ]

    ranking_funcionarios = sorted(
        [
            {
                "nome": item["funcionario"],
                "departamento": item["departamento"],
                "total": item["total"],
            }
            for item in agrupado_funcionarios.values()
        ],
        key=lambda x: x["total"],
        reverse=True
    )

    tabela_resumo = sorted(
        [
            {
                "funcionario": item["funcionario"],
                "departamento": item["departamento"],
                "acoes": item["total"],
                "inclusoes": item["inclusoes"],
                "alteracoes": item["alteracoes"],
                "exclusoes": item["exclusoes"],
                "cancelamentos": item["cancelamentos"],
            }
            for item in agrupado_funcionarios.values()
        ],
        key=lambda x: x["acoes"],
        reverse=True
    )

    registros_consolidados = sorted(
        registros_consolidados,
        key=lambda x: x["data_hora"] if x["data_hora"] else "",
        reverse=True
    )

    return {
        "filtros": {
            "acao": acao.strip().upper() if acao else None,
            "departamento_id": departamento_id,
            "data_inicial": data_inicial.strip() if data_inicial else None,
            "data_final": data_final.strip() if data_final else None,
            "limit_por_funcionario": limit_por_funcionario,
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
        "registros": registros_consolidados,
    }