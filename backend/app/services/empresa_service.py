from sqlalchemy import text
from sqlalchemy.orm import Session


def limpar(valor):
    if valor is None:
        return ""
    return str(valor).strip()


def listar_empresas_erp(db: Session):

    sql = text("""
        SELECT
            e.EMP_ID,
            e.EMP_FANTASIA,
            e.EMP_RAZAO_SOCIAL,
            e.EMP_CNPJ,
            e.EMP_CIDADE,
            e.EMP_STATUS
        FROM TB_EMPRESA e
        ORDER BY e.EMP_ID
    """)

    rows = db.execute(sql).mappings().all()

    empresas = []

    for row in rows:

        empresa_id = row.get("emp_id") or row.get("EMP_ID")
        fantasia = row.get("emp_fantasia") or row.get("EMP_FANTASIA")
        razao = row.get("emp_razao_social") or row.get("EMP_RAZAO_SOCIAL")
        cnpj = row.get("emp_cnpj") or row.get("EMP_CNPJ")
        cidade = row.get("emp_cidade") or row.get("EMP_CIDADE")
        status = row.get("emp_status") or row.get("EMP_STATUS")

        empresa = {
            "id": empresa_id,
            "fantasia": limpar(fantasia),
            "razao_social": limpar(razao),
            "cnpj": limpar(cnpj),
            "cidade": limpar(cidade),
            "status": limpar(status),
        }

        empresa["nome_exibicao"] = (
            empresa["fantasia"]
            or empresa["razao_social"]
            or f"Empresa {empresa_id}"
        )

        empresas.append(empresa)

    return empresas