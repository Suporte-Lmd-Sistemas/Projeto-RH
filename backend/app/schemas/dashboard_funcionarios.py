from pydantic import BaseModel
from typing import List


class FuncionariosResumo(BaseModel):
    total: int
    ativos: int
    afastados: int
    vendedores: int
    mediaSalarial: float


class DistribuicaoFuncaoItem(BaseModel):
    funcao: str
    quantidade: int


class FuncionarioItem(BaseModel):
    rhId: int | None = None
    colPessoa: int
    nome: str
    cargoOficial: str | None = None
    cargoRhId: int | None = None
    cargoRhNome: str | None = None
    departamentoId: int | None = None
    departamentoNome: str | None = None
    status: str | None = None
    salario: float | None = None
    dataAdmissao: str | None = None
    dataAfastamento: str | None = None
    email: str | None = None
    telefone: str | None = None
    celular: str | None = None
    vendedor: bool = False


class DashboardFuncionariosResponse(BaseModel):
    resumo: FuncionariosResumo
    distribuicaoFuncoes: List[DistribuicaoFuncaoItem]
    funcionarios: List[FuncionarioItem]