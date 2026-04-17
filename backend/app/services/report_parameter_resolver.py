# app/services/report_parameter_resolver.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional
import re


@dataclass
class ReportParameter:
    original_name: str
    normalized_name: str
    semantic_key: str
    inferred_type: str
    required: bool = True
    default_value: Any = None
    aliases: List[str] = field(default_factory=list)


class ParameterResolver:
    """
    Resolve parâmetros detectados no SQL para:
    - nome semântico
    - tipo inferido
    - valor padrão
    - bind final usando o nome ORIGINAL do SQL
    """

    DATE_START_KEYS = {
        "DATAINICIAL", "DATAINICIO", "DTINICIAL", "DTINICIO",
        "DTINI", "DINI", "INICIO", "DATAINI"
    }

    DATE_END_KEYS = {
        "DATAFINAL", "DATAFIM", "DTFINAL", "DTFIM",
        "DTF", "DFIM", "FIM", "DATAFIM"
    }

    # Prefixos comuns em ERP legado / FastReport
    PREFIXES = (
        "P_", "PAR_", "PARAM_", "REC_", "CD_", "ID_", "NR_",
        "P", "PAR", "PARAM"
    )

    def __init__(self, user_context: Optional[Dict[str, Any]] = None):
        self.user_context = user_context or {}

    def normalize_name(self, name: str) -> str:
        """
        Normaliza o nome removendo prefixos comuns.
        Ex.: REC_EMPRESA -> EMPRESA
             CD_CLIENTE -> CLIENTE
        """
        name = (name or "").strip().upper()
        name = re.sub(r'[^A-Z0-9_]', '', name)

        changed = True
        while changed:
            changed = False

            for prefix in self.PREFIXES:
                if name.startswith(prefix) and len(name) > len(prefix):
                    rest = name[len(prefix):]

                    # Evita estragar nomes como PRODUTO -> removing P = RODUTO
                    if prefix in ("P", "PAR", "PARAM") and not name.startswith(prefix + "_"):
                        continue

                    # Remove underscore inicial remanescente
                    rest = rest.lstrip("_")

                    if rest:
                        name = rest
                        changed = True

        return name

    def semantic_key_for(self, original_name: str) -> str:
        """
        Descobre a intenção semântica do parâmetro.
        """
        raw = (original_name or "").upper().strip()
        norm = self.normalize_name(raw)

        if raw in self.DATE_START_KEYS or norm in self.DATE_START_KEYS:
            return "data_inicial"

        if raw in self.DATE_END_KEYS or norm in self.DATE_END_KEYS:
            return "data_final"

        if "EMPRESA" in raw or norm == "EMPRESA":
            return "empresa"

        if "VENDEDOR" in raw or norm == "VENDEDOR":
            return "vendedor"

        if "CLIENTE" in raw or norm == "CLIENTE":
            return "cliente"

        if "NATUREZA" in raw or norm == "NATUREZA":
            return "natureza"

        if "FILIAL" in raw or norm == "FILIAL":
            return "filial"

        if "USUARIO" in raw or norm == "USUARIO" or raw == "USER":
            return "usuario"

        if "ROTA" in raw or norm == "ROTA":
            return "rota"

        if "PRODUTO" in raw or norm == "PRODUTO":
            return "produto"

        if "GRUPO" in raw or norm == "GRUPO":
            return "grupo"

        if "MARCA" in raw or norm == "MARCA":
            return "marca"

        if "TIPO" in raw or norm == "TIPO":
            return "tipo"

        return norm.lower()

    def infer_type(self, original_name: str) -> str:
        """
        Inferência simples de tipo.
        """
        raw = (original_name or "").upper().strip()

        if "DATA" in raw or raw in self.DATE_START_KEYS or raw in self.DATE_END_KEYS:
            return "date"

        if any(token in raw for token in [
            "EMPRESA", "VENDEDOR", "CLIENTE", "FILIAL",
            "COD", "CD_", "ID_", "NR_", "ROTA", "PRODUTO", "GRUPO", "MARCA"
        ]):
            return "int"

        if raw.startswith("P") and raw not in ("P",):
            # Heurística comum de parâmetros numéricos em relatórios ERP
            return "int"

        return "str"

    def default_for(self, semantic_key: str, inferred_type: str) -> Any:
        today = date.today()
        first_day = today.replace(day=1)

        semantic_defaults = {
            "empresa": self.user_context.get("empresa_padrao", 1),
            "vendedor": self.user_context.get("vendedor_padrao", 0),
            "cliente": self.user_context.get("cliente_padrao", 0),
            "natureza": self.user_context.get("natureza_padrao", 0),
            "filial": self.user_context.get("filial_padrao", 0),
            "usuario": self.user_context.get("usuario_id", 0),
            "rota": self.user_context.get("rota_padrao", 0),
            "produto": self.user_context.get("produto_padrao", 0),
            "grupo": self.user_context.get("grupo_padrao", 0),
            "marca": self.user_context.get("marca_padrao", 0),
            "tipo": self.user_context.get("tipo_padrao", 0),
            "data_inicial": first_day.isoformat(),
            "data_final": today.isoformat(),
        }

        if semantic_key in semantic_defaults:
            return semantic_defaults[semantic_key]

        if inferred_type == "int":
            return 0

        if inferred_type == "date":
            return today.isoformat()

        return ""

    def build_aliases(self, original_name: str, normalized_name: str, semantic_key: str) -> List[str]:
        """
        Gera aliases aceitos para localizar o valor no payload.
        """
        aliases = {
            original_name.upper(),
            normalized_name.upper(),
            semantic_key.upper(),
            semantic_key.lower(),
        }

        alias_map = {
            "empresa": {"EMPRESA", "REC_EMPRESA", "CD_EMPRESA", "ID_EMPRESA"},
            "data_inicial": {"DATAINICIAL", "DATAINICIO", "DTINICIAL", "DTINICIO", "DTINI"},
            "data_final": {"DATAFINAL", "DATAFIM", "DTFINAL", "DTFIM", "DTFIM"},
            "vendedor": {"VENDEDOR", "PVENDEDOR", "CD_VENDEDOR", "ID_VENDEDOR"},
            "cliente": {"CLIENTE", "PCLIENTE", "CD_CLIENTE", "ID_CLIENTE"},
            "natureza": {"NATUREZA", "PNATUREZA"},
            "filial": {"FILIAL", "CD_FILIAL", "ID_FILIAL"},
            "usuario": {"USUARIO", "ID_USUARIO", "USER"},
            "rota": {"ROTA", "CD_ROTA", "ID_ROTA", "PROTA"},
            "produto": {"PRODUTO", "CD_PRODUTO", "ID_PRODUTO", "PPRODUTO"},
            "grupo": {"GRUPO", "CD_GRUPO", "ID_GRUPO", "PGRUPO"},
            "marca": {"MARCA", "CD_MARCA", "ID_MARCA", "PMARCA"},
            "tipo": {"TIPO", "PTIPO"},
        }

        aliases.update(alias_map.get(semantic_key, set()))
        return sorted(aliases)

    def describe(self, param_names: List[str]) -> List[ReportParameter]:
        """
        Monta a descrição completa dos parâmetros detectados.
        """
        items: List[ReportParameter] = []

        for original_name in param_names:
            normalized_name = self.normalize_name(original_name)
            semantic_key = self.semantic_key_for(original_name)
            inferred_type = self.infer_type(original_name)
            default_value = self.default_for(semantic_key, inferred_type)
            aliases = self.build_aliases(original_name, normalized_name, semantic_key)

            items.append(
                ReportParameter(
                    original_name=original_name,
                    normalized_name=normalized_name,
                    semantic_key=semantic_key,
                    inferred_type=inferred_type,
                    required=True,
                    default_value=default_value,
                    aliases=aliases,
                )
            )

        return items

    def coerce_value(self, inferred_type: str, value: Any) -> Any:
        """
        Converte o valor para o tipo esperado.
        """
        if value is None or value == "":
            return value

        if inferred_type == "date":
            if isinstance(value, date):
                return value
            if isinstance(value, str):
                return datetime.strptime(value, "%Y-%m-%d").date()

        if inferred_type == "int":
            if isinstance(value, bool):
                return int(value)
            return int(value)

        return value

    def resolve(
        self,
        report_params: List[ReportParameter],
        incoming_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Recebe payload do frontend e devolve bind params finais com os NOMES ORIGINAIS do SQL.
        Exemplo:
            payload = {"EMPRESA": 1}
            SQL usa :REC_EMPRESA
            retorno = {"REC_EMPRESA": 1}
        """
        incoming_payload = incoming_payload or {}
        indexed_payload: Dict[str, Any] = {}

        for key, value in incoming_payload.items():
            if key is None:
                continue

            indexed_payload[key] = value
            indexed_payload[str(key).upper()] = value
            indexed_payload[str(key).lower()] = value
            indexed_payload[self.normalize_name(str(key))] = value

        final_params: Dict[str, Any] = {}

        for param in report_params:
            value_found = None

            for alias in param.aliases:
                if alias in indexed_payload:
                    value_found = indexed_payload[alias]
                    break
                if alias.upper() in indexed_payload:
                    value_found = indexed_payload[alias.upper()]
                    break
                if alias.lower() in indexed_payload:
                    value_found = indexed_payload[alias.lower()]
                    break

            if value_found is None:
                value_found = param.default_value

            value_found = self.coerce_value(param.inferred_type, value_found)
            final_params[param.original_name] = value_found

        return final_params