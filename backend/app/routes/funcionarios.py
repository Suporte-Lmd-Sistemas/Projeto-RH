from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.erp_connection import get_erp_db
from app.database.session import get_db
from app.models.cargo import Cargo
from app.models.departamento import Departamento
from app.models.funcionario import Funcionario
from app.schemas.funcionario import FuncionarioCreate, FuncionarioUpdate

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])


def obter_dados_update(dados: FuncionarioUpdate) -> dict[str, Any]:
    if hasattr(dados, "model_dump"):
        return dados.model_dump(exclude_unset=True)
    return dados.dict(exclude_unset=True)


@router.get("/erp-disponiveis")
def listar_colaboradores_erp_disponiveis(
    search: str = Query(default=""),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db),
):
    col_pessoas_vinculados = {
        item.col_pessoa
        for item in db.query(Funcionario).all()
        if item.col_pessoa is not None
    }

    search_limpo = (search or "").strip().lower()

    query_erp = text(
        """
        SELECT
            c.COL_PESSOA,
            c.COL_FUNCAO,
            c.COL_STATUS,
            c.COL_DATA_ADMISSAO,
            COALESCE(NULLIF(TRIM(p.PES_FANTASIA_APELIDO), ''), p.PES_RSOCIAL_NOME),
            p.PES_CNPJ_CPF,
            p.PES_EMAIL,
            p.PES_TELEFONE,
            p.PES_CELULAR
        FROM TB_COLABORADOR c
        JOIN TB_PESSOA p
          ON p.PES_ID = c.COL_PESSOA
        ORDER BY p.PES_RSOCIAL_NOME
        """
    )

    colaboradores = erp_db.execute(query_erp).fetchall()

    resultado = []

    for colaborador in colaboradores:
        col_pessoa = colaborador[0]

        if col_pessoa in col_pessoas_vinculados:
            continue

        nome = str(colaborador[4]) if colaborador[4] is not None else ""
        cpf = str(colaborador[5]) if colaborador[5] is not None else ""
        cargo = str(colaborador[1]) if colaborador[1] is not None else ""
        status_erp = str(colaborador[2]) if colaborador[2] is not None else ""

        if search_limpo:
            busca_texto = f"{nome} {cpf} {cargo} {status_erp}".lower()
            if search_limpo not in busca_texto:
                continue

        resultado.append(
            {
                "col_pessoa": col_pessoa,
                "nome": nome,
                "cpf": cpf,
                "cargo_oficial": cargo,
                "status": status_erp,
                "data_admissao": str(colaborador[3]) if colaborador[3] else None,
                "email": colaborador[6],
                "telefone": colaborador[7],
                "celular": colaborador[8],
            }
        )

        if len(resultado) >= limit:
            break

    return resultado


@router.get("/")
def listar_funcionarios(
    nome: str = "",
    departamento_id: int | None = None,
    status_filtro: str = Query(default="", alias="status"),
    cargo: str = "",
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db),
):
    query_rh = db.query(Funcionario)

    if departamento_id is not None:
        query_rh = query_rh.filter(Funcionario.departamento_id == departamento_id)

    funcionarios = query_rh.all()

    resultado = []

    for funcionario in funcionarios:
        departamento = (
            db.query(Departamento)
            .filter(Departamento.id == funcionario.departamento_id)
            .first()
        )

        cargo_rh = None
        if funcionario.cargo_id is not None:
            cargo_rh = db.query(Cargo).filter(Cargo.id == funcionario.cargo_id).first()

        query_erp = text(
            """
            SELECT
                c.COL_PESSOA,
                c.COL_FUNCAO,
                c.COL_STATUS,
                c.COL_SALARIO_VALOR,
                c.COL_DATA_ADMISSAO,
                c.COL_DATA_AFASTAMENTO,
                p.PES_RSOCIAL_NOME,
                p.PES_CNPJ_CPF,
                p.PES_EMAIL,
                p.PES_TELEFONE,
                p.PES_CELULAR
            FROM TB_COLABORADOR c
            JOIN TB_PESSOA p
              ON p.PES_ID = c.COL_PESSOA
            WHERE c.COL_PESSOA = :col_pessoa
            """
        )

        colaborador = erp_db.execute(
            query_erp,
            {"col_pessoa": funcionario.col_pessoa}
        ).fetchone()

        if not colaborador:
            continue

        nome_erp = str(colaborador[6]) if colaborador[6] is not None else ""
        cargo_erp = str(colaborador[1]) if colaborador[1] is not None else ""
        status_erp = str(colaborador[2]) if colaborador[2] is not None else ""

        if nome and nome.lower() not in nome_erp.lower():
            continue

        if cargo and cargo.lower() not in cargo_erp.lower():
            continue

        if status_filtro and status_filtro.lower() not in status_erp.lower():
            continue

        resultado.append(
            {
                "rh_id": funcionario.id,
                "col_pessoa": funcionario.col_pessoa,
                "nome": nome_erp,
                "cpf": colaborador[7],
                "email": colaborador[8],
                "telefone": colaborador[9],
                "celular": colaborador[10],
                "cargo_oficial": cargo_erp,
                "cargo_rh_id": funcionario.cargo_id,
                "cargo_rh_nome": cargo_rh.nome if cargo_rh else None,
                "status": status_erp,
                "salario": float(colaborador[3]) if colaborador[3] is not None else None,
                "data_admissao": str(colaborador[4]) if colaborador[4] else None,
                "data_afastamento": str(colaborador[5]) if colaborador[5] else None,
                "departamento_id": funcionario.departamento_id,
                "departamento_nome": departamento.nome if departamento else None,
            }
        )

    return resultado


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_vinculo_funcionario(
    dados: FuncionarioCreate,
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db),
):
    col_pessoa = dados.col_pessoa
    departamento_id = dados.departamento_id
    cargo_id = dados.cargo_id

    existente = (
        db.query(Funcionario)
        .filter(Funcionario.col_pessoa == col_pessoa)
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este colaborador do ERP já está vinculado no RH.",
        )

    departamento = (
        db.query(Departamento)
        .filter(Departamento.id == departamento_id)
        .first()
    )

    if not departamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Departamento não encontrado.",
        )

    cargo = None
    if cargo_id is not None:
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cargo não encontrado.",
            )

    query_erp = text(
        """
        SELECT
            COL_PESSOA
        FROM TB_COLABORADOR
        WHERE COL_PESSOA = :col_pessoa
        """
    )

    colaborador_erp = erp_db.execute(
        query_erp,
        {"col_pessoa": col_pessoa}
    ).fetchone()

    if not colaborador_erp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colaborador não encontrado no ERP.",
        )

    novo = Funcionario(
        col_pessoa=col_pessoa,
        departamento_id=departamento_id,
        cargo_id=cargo_id,
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)

    return {
        "mensagem": "Vínculo criado com sucesso.",
        "funcionario": {
            "rh_id": novo.id,
            "col_pessoa": novo.col_pessoa,
            "departamento_id": novo.departamento_id,
            "departamento_nome": departamento.nome if departamento else None,
            "cargo_id": novo.cargo_id,
            "cargo_nome": cargo.nome if cargo else None,
        },
    }


@router.get("/{rh_id}/auditoria")
def listar_auditoria_funcionario(
    rh_id: int,
    tipo: str = Query(default=""),
    data_inicial: str = Query(default=""),
    data_final: str = Query(default=""),
    limit: int = Query(default=100, ge=1, le=5000),
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db),
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado no RH.")

    query_usuarios = text(
        """
        SELECT
            U.USU_ID,
            U.USU_NOME,
            U.USU_LOGIN
        FROM TB_COLABORADOR C
        INNER JOIN TB_PESSOA P
            ON P.PES_ID = C.COL_PESSOA
        INNER JOIN TB_USUARIO U
            ON U.USU_VENDEDOR = P.PES_ID
        WHERE C.COL_PESSOA = :col_pessoa
        """
    )

    usuarios = erp_db.execute(
        query_usuarios,
        {"col_pessoa": funcionario.col_pessoa}
    ).fetchall()

    usuario_ids = []
    for usuario in usuarios:
        usu_id = usuario[0]
        if usu_id is not None:
            usuario_ids.append(str(usu_id).strip())

    usuario_ids = list(dict.fromkeys(usuario_ids))

    limit = min(max(int(limit), 1), 5000)

    filtros = []
    params: dict[str, Any] = {
        "col_pessoa": funcionario.col_pessoa
    }

    bloco_principal = ["A.AUD_VENDEDOR = :col_pessoa"]

    for idx, usuario_id in enumerate(usuario_ids):
        chave = f"usuario_id_{idx}"
        bloco_principal.append(f"CAST(A.AUD_USUARIO AS VARCHAR(30)) = :{chave}")
        params[chave] = usuario_id

    filtros.append("(" + " OR ".join(bloco_principal) + ")")

    tipo_limpo = (tipo or "").strip()
    if tipo_limpo:
        filtros.append(
            """
            (
                UPPER(COALESCE(A.AUD_TABELA_DESC, '')) LIKE :tipo_like
                OR UPPER(COALESCE(AI.AUDI_CAMPO_DESC, '')) LIKE :tipo_like
                OR UPPER(COALESCE(A.AUD_DESC_REGISTRO, '')) LIKE :tipo_like
            )
            """
        )
        params["tipo_like"] = f"%{tipo_limpo.upper()}%"

    data_inicial_limpa = (data_inicial or "").strip()
    if data_inicial_limpa:
        filtros.append("CAST(A.AUD_DT_ACAO AS DATE) >= CAST(:data_inicial AS DATE)")
        params["data_inicial"] = data_inicial_limpa

    data_final_limpa = (data_final or "").strip()
    if data_final_limpa:
        filtros.append("CAST(A.AUD_DT_ACAO AS DATE) <= CAST(:data_final AS DATE)")
        params["data_final"] = data_final_limpa

    where_sql = " AND ".join(filtros)

    query_auditoria = text(
        f"""
        SELECT FIRST {limit}
            A.AUD_USUARIO,
            A.AUD_ACAO,
            A.AUD_TABELA_DESC,
            AI.AUDI_CAMPO_DESC,
            A.AUD_DESC_REGISTRO,
            A.AUD_DT_ACAO,
            A.AUD_DT_LANCAMENTO,
            A.AUD_SEQUENCIA,
            A.AUD_ID_REGISTRO,
            A.AUD_TABELA,
            A.AUD_VENDEDOR,
            AI.AUDI_VALOR_ANTIGO,
            AI.AUDI_VALOR_NOVO
        FROM TB_AUDITORIA A
        LEFT JOIN TB_AUDITORIA_ITEM AI
          ON AI.audi_id_registro = A.aud_id_registro
        WHERE {where_sql}
        ORDER BY
            SUBSTRING(A.AUD_DT_LANCAMENTO FROM 7 FOR 4) ||
            SUBSTRING(A.AUD_DT_LANCAMENTO FROM 4 FOR 2) ||
            SUBSTRING(A.AUD_DT_LANCAMENTO FROM 1 FOR 2) ||
            SUBSTRING(A.AUD_DT_LANCAMENTO FROM 12 FOR 5)
        DESC,
        A.AUD_SEQUENCIA DESC
        """
    )

    registros = erp_db.execute(query_auditoria, params).fetchall()

    def traduzir_acao(sigla: str | None) -> str:
        valor = str(sigla or "").strip().upper()
        mapa = {
            "I": "Inclusão",
            "A": "Alteração",
            "E": "Exclusão",
            "C": "Cancelamento",
        }
        return mapa.get(valor, valor or "Não informado")

    resultado = []

    for registro in registros:
        resultado.append(
            {
                "aud_usuario": registro[0],
                "acao_sigla": registro[1],
                "acao": traduzir_acao(registro[1]),
                "tabela_desc": registro[2],
                "campo_desc": registro[3],
                "descricao_registro": registro[4],
                "data_hora": str(registro[5]) if registro[5] else None,
                "data_lancamento": str(registro[6]) if registro[6] else None,
                "aud_sequencia": registro[7],
                "aud_id_registro": registro[8],
                "aud_tabela": registro[9],
                "aud_vendedor": registro[10],
                "valor_antigo": registro[11],
                "valor_novo": registro[12],
            }
        )

    return {
        "rh_id": funcionario.id,
        "col_pessoa": funcionario.col_pessoa,
        "usuario_ids_relacionados": usuario_ids,
        "tipo_filtro": tipo_limpo if tipo_limpo else None,
        "data_inicial": data_inicial_limpa if data_inicial_limpa else None,
        "data_final": data_final_limpa if data_final_limpa else None,
        "limit": limit,
        "total": len(resultado),
        "registros": resultado,
    }


@router.get("/{rh_id}")
def detalhar_funcionario(
    rh_id: int,
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado no RH.")

    departamento = db.query(Departamento).filter(
        Departamento.id == funcionario.departamento_id
    ).first()

    cargo_rh = None
    if funcionario.cargo_id is not None:
        cargo_rh = db.query(Cargo).filter(
            Cargo.id == funcionario.cargo_id
        ).first()

    query_erp = text(
        """
        SELECT
            c.COL_EMPRESA,
            c.COL_FUNCAO,
            c.COL_SALARIO,
            c.COL_STATUS,
            c.COL_PROFISSAO,
            c.COL_CPF,
            c.COL_RG,
            c.COL_ESTADO_CIVIL,
            c.COL_DT_CADASTRO,
            c.COL_EDITADO,
            c.COL_CARTEIRA_TRABALHO,
            c.COL_SERIE,
            c.COL_TITULO_ELEITOR,
            c.COL_TITULO_ZONA,
            c.COL_PIS,
            c.COL_DATA_ADMISSAO,
            c.COL_DATA_AFASTAMENTO,
            c.COL_HORARIO_ENTRADA,
            c.COL_INTERVALO_INCIAIL,
            c.COL_INTERVALO_FINAL,
            c.COL_HORARIO_SAIDA,
            c.COL_RAZAO_SOCIAL_REGISTRADA,
            c.COL_CARTAO_PONTO,
            c.COL_TITULO_SECAO,
            c.COL_SALARIO_VALOR,
            c.COL_PESSOA,

            p.PES_ID,
            p.PES_TIPO_PESSOA,
            p.PES_RSOCIAL_NOME,
            p.PES_FANTASIA_APELIDO,
            p.PES_CNPJ_CPF,
            p.PES_IE_RG,
            p.PES_ENDERECO,
            p.PES_COMPLEMENTO,
            p.PES_NUMERO,
            p.PES_BAIRRO,
            p.PES_CIDADE,
            p.PES_CEP,
            p.PES_TELEFONE,
            p.PES_FAX,
            p.PES_CELULAR,
            p.PES_EMAIL,
            p.PES_CONTATO,
            p.PES_OBSERVACAO,
            p.PES_DT_CADASTRO,
            p.PES_DT_NASCIMENTO,
            p.PES_STATUS,
            p.PES_CLIENTE,
            p.PES_FORNECEDOR,
            p.PES_VENDEDOR,
            p.PES_COLABORADOR,
            p.PES_TRANSPORTADOR,
            p.PES_SEXO,
            p.PES_PROFISSAO,
            p.PES_ULTIMA_ALTERACAO,
            p.PES_GUID
        FROM TB_COLABORADOR c
        JOIN TB_PESSOA p
          ON p.PES_ID = c.COL_PESSOA
        WHERE c.COL_PESSOA = :col_pessoa
        """
    )

    colaborador = erp_db.execute(
        query_erp,
        {"col_pessoa": funcionario.col_pessoa}
    ).fetchone()

    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador vinculado não encontrado no ERP.")

    return {
        "rh_id": funcionario.id,
        "col_pessoa": funcionario.col_pessoa,
        "departamento_id": funcionario.departamento_id,
        "departamento_nome": departamento.nome if departamento else None,
        "cargo_rh_id": funcionario.cargo_id,
        "cargo_rh_nome": cargo_rh.nome if cargo_rh else None,
        "cargo_oficial": colaborador[1],
        "data_admissao_oficial": str(colaborador[15]) if colaborador[15] else None,
        "salario_oficial": float(colaborador[24]) if colaborador[24] is not None else None,
        "status_oficial": colaborador[3],
        "erp_colaborador": {
            "COL_EMPRESA": colaborador[0],
            "COL_FUNCAO": colaborador[1],
            "COL_SALARIO": colaborador[2],
            "COL_STATUS": colaborador[3],
            "COL_PROFISSAO": colaborador[4],
            "COL_CPF": colaborador[5],
            "COL_RG": colaborador[6],
            "COL_ESTADO_CIVIL": colaborador[7],
            "COL_DT_CADASTRO": str(colaborador[8]) if colaborador[8] else None,
            "COL_EDITADO": colaborador[9],
            "COL_CARTEIRA_TRABALHO": colaborador[10],
            "COL_SERIE": colaborador[11],
            "COL_TITULO_ELEITOR": colaborador[12],
            "COL_TITULO_ZONA": colaborador[13],
            "COL_PIS": colaborador[14],
            "COL_DATA_ADMISSAO": str(colaborador[15]) if colaborador[15] else None,
            "COL_DATA_AFASTAMENTO": str(colaborador[16]) if colaborador[16] else None,
            "COL_HORARIO_ENTRADA": str(colaborador[17]) if colaborador[17] else None,
            "COL_INTERVALO_INCIAIL": str(colaborador[18]) if colaborador[18] else None,
            "COL_INTERVALO_FINAL": str(colaborador[19]) if colaborador[19] else None,
            "COL_HORARIO_SAIDA": str(colaborador[20]) if colaborador[20] else None,
            "COL_RAZAO_SOCIAL_REGISTRADA": colaborador[21],
            "COL_CARTAO_PONTO": colaborador[22],
            "COL_TITULO_SECAO": colaborador[23],
            "COL_SALARIO_VALOR": float(colaborador[24]) if colaborador[24] is not None else None,
            "COL_PESSOA": colaborador[25],
        },
        "erp_pessoa": {
            "PES_ID": colaborador[26],
            "PES_TIPO_PESSOA": colaborador[27],
            "PES_RSOCIAL_NOME": colaborador[28],
            "PES_FANTASIA_APELIDO": colaborador[29],
            "PES_CNPJ_CPF": colaborador[30],
            "PES_IE_RG": colaborador[31],
            "PES_ENDERECO": colaborador[32],
            "PES_COMPLEMENTO": colaborador[33],
            "PES_NUMERO": colaborador[34],
            "PES_BAIRRO": colaborador[35],
            "PES_CIDADE": colaborador[36],
            "PES_CEP": colaborador[37],
            "PES_TELEFONE": colaborador[38],
            "PES_FAX": colaborador[39],
            "PES_CELULAR": colaborador[40],
            "PES_EMAIL": colaborador[41],
            "PES_CONTATO": colaborador[42],
            "PES_OBSERVACAO": colaborador[43],
            "PES_DT_CADASTRO": str(colaborador[44]) if colaborador[44] else None,
            "PES_DT_NASCIMENTO": str(colaborador[45]) if colaborador[45] else None,
            "PES_STATUS": colaborador[46],
            "PES_CLIENTE": colaborador[47],
            "PES_FORNECEDOR": colaborador[48],
            "PES_VENDEDOR": colaborador[49],
            "PES_COLABORADOR": colaborador[50],
            "PES_TRANSPORTADOR": colaborador[51],
            "PES_SEXO": colaborador[52],
            "PES_PROFISSAO": colaborador[53],
            "PES_ULTIMA_ALTERACAO": str(colaborador[54]) if colaborador[54] else None,
            "PES_GUID": colaborador[55],
        },
    }


@router.put("/{rh_id}")
def atualizar_vinculo_funcionario(
    rh_id: int,
    dados: FuncionarioUpdate,
    db: Session = Depends(get_db)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado no RH.")

    dados_update = obter_dados_update(dados)

    if "departamento_id" in dados_update:
        departamento = db.query(Departamento).filter(
            Departamento.id == dados_update["departamento_id"]
        ).first()

        if not departamento:
            raise HTTPException(status_code=404, detail="Departamento não encontrado no RH.")

        funcionario.departamento_id = dados_update["departamento_id"]

    if "cargo_id" in dados_update:
        cargo_id = dados_update["cargo_id"]

        if cargo_id is None:
            funcionario.cargo_id = None
        else:
            cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()

            if not cargo:
                raise HTTPException(status_code=404, detail="Cargo não encontrado no RH.")

            funcionario.cargo_id = cargo_id

    db.commit()
    db.refresh(funcionario)

    departamento_atual = db.query(Departamento).filter(
        Departamento.id == funcionario.departamento_id
    ).first()

    cargo_atual = None
    if funcionario.cargo_id is not None:
        cargo_atual = db.query(Cargo).filter(
            Cargo.id == funcionario.cargo_id
        ).first()

    return {
        "mensagem": "Vínculo do funcionário atualizado com sucesso.",
        "funcionario": {
            "rh_id": funcionario.id,
            "col_pessoa": funcionario.col_pessoa,
            "departamento_id": funcionario.departamento_id,
            "departamento_nome": departamento_atual.nome if departamento_atual else None,
            "cargo_id": funcionario.cargo_id,
            "cargo_nome": cargo_atual.nome if cargo_atual else None,
        },
    }


@router.delete("/{rh_id}")
def remover_funcionario_rh(
    rh_id: int,
    db: Session = Depends(get_db)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado no RH.")

    db.delete(funcionario)
    db.commit()

    return {
        "mensagem": "Vínculo do funcionário removido do RH com sucesso."
    }