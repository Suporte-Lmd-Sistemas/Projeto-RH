from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.database.base import Base


class Funcionario(Base):
    __tablename__ = "rh_funcionarios"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(200))
    cpf = Column(String(20))

    data_admissao = Column(Date)

    cargo_id = Column(Integer, ForeignKey("rh_cargos.id"))
    departamento_id = Column(Integer, ForeignKey("rh_departamentos.id"))