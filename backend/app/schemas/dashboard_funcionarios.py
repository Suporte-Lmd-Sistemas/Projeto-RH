from pydantic import BaseModel
from typing import List


class FuncionariosResumo(BaseModel):
    totalFuncionarios: int
    ativos: int
    afastados: int
    vendedores: int
    mediaSalarial: float


class FuncionarioCardItem(BaseModel):
    pessoaId: int
    nome: str
    funcao: str | None
    status: str | None
    dataAdmissao: str | None
    salario: float
    vendedor: bool
    usuarioId: int | None
    usuarioNome: str | None


class FuncaoDistribuicaoItem(BaseModel):
    funcao: str
    quantidade: int


class DashboardFuncionariosResponse(BaseModel):
    resumo: FuncionariosResumo
    funcionarios: List[FuncionarioCardItem]
    distribuicaoFuncoes: List[FuncaoDistribuicaoItem]