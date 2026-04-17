from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class RelatorioListItem(BaseModel):
    cdarquivo: int
    nome: str
    descricao: Optional[str] = None
    cdpastamae: Optional[int] = None
    pasta_nome: Optional[str] = None
    pasta_descricao: Optional[str] = None
    ultima_alteracao: Optional[str] = None
    exportar: Optional[str] = None
    periodo_app: Optional[str] = None
    vendedor_app: Optional[str] = None
    cliente_app: Optional[str] = None
    empresa_app: Optional[str] = None
    categoria: str


class RelatorioDatasetInfo(BaseModel):
    dataset: Optional[str] = None
    dataset_name: Optional[str] = None


class RelatorioVariableInfo(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None


class RelatorioParametroInfo(BaseModel):
    name: Optional[str] = None
    datatype: Optional[str] = None


class RelatorioQueryInfo(BaseModel):
    name: Optional[str] = None
    user_name: Optional[str] = None
    sql_text: Optional[str] = None
    parametros: List[RelatorioParametroInfo] = []


class RelatorioInspecaoResponse(BaseModel):
    cdarquivo: int
    nome: str
    descricao: Optional[str] = None
    pasta_nome: Optional[str] = None
    categoria: str
    xml_valido: bool
    datasets: List[RelatorioDatasetInfo]
    variables: List[RelatorioVariableInfo]
    queries: List[RelatorioQueryInfo]
    observacoes: List[str] = []