from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET
import html
import re


def _get_attr(element: ET.Element, key: str) -> Optional[str]:
    value = element.attrib.get(key)
    if isinstance(value, str):
        return value.strip()
    return value


def _decode_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return value

    decoded = html.unescape(value)
    decoded = decoded.replace("\r\n", "\n").replace("\r", "\n")
    decoded = decoded.replace("#13;", "\n").replace("#10;", "\n")
    decoded = re.sub(r"\n{3,}", "\n\n", decoded)

    return decoded.strip()


def _limpar_sql_fastreport(sql_text: Optional[str]) -> Optional[str]:
    if not sql_text:
        return sql_text

    texto = sql_text.strip()

    # corta lixo serializado que às vezes aparece depois do SQL
    lixo_match = re.search(r"\n[eE][A-Za-z0-9+/=]{40,}\s*$", texto)
    if lixo_match:
        texto = texto[:lixo_match.start()].rstrip()

    # se houver algum bloco base64 grudado sem quebra
    texto = re.sub(r"[ \t]*[eE][A-Za-z0-9+/=]{80,}\s*$", "", texto).rstrip()

    return texto


def parse_fastreport_xml(xml_text: str) -> Dict[str, Any]:
    root = ET.fromstring(xml_text)

    datasets: List[Dict[str, Any]] = []
    variables: List[Dict[str, Any]] = []
    queries: List[Dict[str, Any]] = []
    observacoes: List[str] = []

    for item in root.findall(".//Datasets/item"):
        datasets.append({
            "dataset": _get_attr(item, "DataSet"),
            "dataset_name": _get_attr(item, "DataSetName"),
        })

    for item in root.findall(".//Variables/item"):
        variables.append({
            "name": _get_attr(item, "Name"),
            "value": _get_attr(item, "Value"),
        })

    fd_queries = root.findall(".//TfrxFDQuery")
    if fd_queries:
        observacoes.append("Foram encontradas queries TfrxFDQuery no relatório.")

    for query in fd_queries:
        parametros: List[Dict[str, Any]] = []
        sql_text: Optional[str] = None

        for p in query.findall("./Parameters/item"):
            parametros.append({
                "name": _get_attr(p, "Name"),
                "datatype": _get_attr(p, "DataType"),
            })

        sql_candidates = []

        for attr_name, attr_value in query.attrib.items():
            upper_name = attr_name.upper()
            if "SQL" in upper_name or "COMMAND" in upper_name:
                sql_candidates.append(attr_value)

        if sql_candidates:
            sql_text = "\n".join([item for item in sql_candidates if item])

        if not sql_text:
            text_content = "".join(query.itertext()).strip()
            if text_content:
                sql_text = text_content

        sql_text = _decode_text(sql_text)
        sql_text = _limpar_sql_fastreport(sql_text)

        queries.append({
            "name": _get_attr(query, "Name"),
            "user_name": _get_attr(query, "UserName"),
            "sql_text": sql_text,
            "parametros": parametros,
        })

    return {
        "datasets": datasets,
        "variables": variables,
        "queries": queries,
        "observacoes": observacoes,
    }