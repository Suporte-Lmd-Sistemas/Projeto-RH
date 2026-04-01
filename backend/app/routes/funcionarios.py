from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.session import get_db
from app.database.erp_connection import get_erp_db
from app.models.funcionario import Funcionario
from app.models.departamento import Departamento

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])


@router.get("/")
def listar_funcionarios(db: Session = Depends(get_db), erp_db: Session = Depends(get_erp_db)):
    funcionarios = db.query(Funcionario).all()

    resultado = []

    for funcionario in funcionarios:
        departamento = db.query(Departamento).filter(
            Departamento.id == funcionario.departamento_id
        ).first()

        query = text("""
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
        """)

        colaborador = erp_db.execute(
            query,
            {"col_pessoa": funcionario.col_pessoa}
        ).fetchone()

        if colaborador:
            resultado.append({
                "rh_id": funcionario.id,
                "col_pessoa": funcionario.col_pessoa,
                "nome": colaborador[6],
                "cpf": colaborador[7],
                "email": colaborador[8],
                "telefone": colaborador[9],
                "celular": colaborador[10],
                "cargo_oficial": colaborador[1],
                "status": colaborador[2],
                "salario": float(colaborador[3]) if colaborador[3] is not None else None,
                "data_admissao": str(colaborador[4]) if colaborador[4] else None,
                "data_afastamento": str(colaborador[5]) if colaborador[5] else None,
                "departamento_id": funcionario.departamento_id,
                "departamento_nome": departamento.nome if departamento else None
            })

    return resultado


@router.get("/{rh_id}")
def detalhar_funcionario(
    rh_id: int,
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        return {"erro": "Funcionário não encontrado no RH."}

    departamento = db.query(Departamento).filter(
        Departamento.id == funcionario.departamento_id
    ).first()

    query = text("""
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
    """)

    colaborador = erp_db.execute(
        query,
        {"col_pessoa": funcionario.col_pessoa}
    ).fetchone()

    if not colaborador:
        return {"erro": "Colaborador vinculado não encontrado no ERP."}

    return {
        "rh_id": funcionario.id,
        "col_pessoa": funcionario.col_pessoa,
        "departamento_id": funcionario.departamento_id,
        "departamento_nome": departamento.nome if departamento else None,
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
            "COL_PESSOA": colaborador[25]
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
            "PES_GUID": colaborador[55]
        }
    }


@router.get("/")
def listar_funcionarios(
    nome: str = "",
    departamento_id: int | None = None,
    status: str = "",
    cargo: str = "",
    db: Session = Depends(get_db),
    erp_db: Session = Depends(get_erp_db)
):
    query_rh = db.query(Funcionario)

    if departamento_id is not None:
        query_rh = query_rh.filter(Funcionario.departamento_id == departamento_id)

    funcionarios = query_rh.all()

    resultado = []

    for funcionario in funcionarios:
        departamento = db.query(Departamento).filter(
            Departamento.id == funcionario.departamento_id
        ).first()

        query = text("""
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
        """)

        colaborador = erp_db.execute(
            query,
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

        if status and status.lower() not in status_erp.lower():
            continue

        resultado.append({
            "rh_id": funcionario.id,
            "col_pessoa": funcionario.col_pessoa,
            "nome": nome_erp,
            "cpf": colaborador[7],
            "email": colaborador[8],
            "telefone": colaborador[9],
            "celular": colaborador[10],
            "cargo_oficial": cargo_erp,
            "status": status_erp,
            "salario": float(colaborador[3]) if colaborador[3] is not None else None,
            "data_admissao": str(colaborador[4]) if colaborador[4] else None,
            "data_afastamento": str(colaborador[5]) if colaborador[5] else None,
            "departamento_id": funcionario.departamento_id,
            "departamento_nome": departamento.nome if departamento else None
        })

    return resultado


@router.delete("/{rh_id}")
def remover_funcionario_rh(
    rh_id: int,
    db: Session = Depends(get_db)
):
    funcionario = db.query(Funcionario).filter(Funcionario.id == rh_id).first()

    if not funcionario:
        return {"erro": "Funcionário não encontrado no RH."}

    db.delete(funcionario)
    db.commit()

    return {
        "mensagem": "Vínculo do funcionário removido do RH com sucesso."
    }