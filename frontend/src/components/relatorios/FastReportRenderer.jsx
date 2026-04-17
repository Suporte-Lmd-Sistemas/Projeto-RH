import React, { Fragment } from "react";

function limparValorVariavel(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/^'+|'+$/g, "").trim();
}

function obterVariavel(variables = [], nome) {
  const item = variables.find(
    (variavel) =>
      String(variavel?.name || "").trim().toLowerCase() ===
      String(nome).trim().toLowerCase()
  );

  return limparValorVariavel(item?.value);
}

function formatarData(valor) {
  if (!valor) return "";

  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return String(valor);
}

function formatarMoeda(valor) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return valor === null || valor === undefined ? "" : String(valor);
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarValor(campo, valor) {
  if (valor === null || valor === undefined) return "";

  const campoNormalizado = String(campo || "").toLowerCase();

  if (
    campoNormalizado.includes("data") ||
    campoNormalizado.includes("dt_") ||
    campoNormalizado.endsWith("_dt") ||
    campoNormalizado.endsWith("date")
  ) {
    return formatarData(valor);
  }

  if (
    campoNormalizado.includes("valor") ||
    campoNormalizado.includes("total") ||
    campoNormalizado.includes("desconto") ||
    campoNormalizado.includes("acrescimo") ||
    campoNormalizado.includes("preco") ||
    campoNormalizado.includes("vlr")
  ) {
    return formatarMoeda(valor);
  }

  return String(valor);
}

function normalizarNumeroFastReport(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;

  const texto = String(valor).trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);

  return Number.isNaN(numero) ? fallback : numero;
}

function fastReportColorToCss(color) {
  if (!color) return null;

  const mapa = {
    clBlack: "#000000",
    clWhite: "#ffffff",
    clRed: "#ff0000",
    clBlue: "#0000ff",
    clGreen: "#008000",
    clYellow: "#ffff00",
    clGray: "#808080",
    clSilver: "#c0c0c0",
    clMaroon: "#800000",
    clNavy: "#000080",
    clOlive: "#808000",
    clPurple: "#800080",
    clTeal: "#008080",
    clLime: "#00ff00",
    clAqua: "#00ffff",
    clFuchsia: "#ff00ff",
  };

  if (mapa[color]) {
    return mapa[color];
  }

  if (/^\$[0-9a-fA-F]{6,8}$/.test(color)) {
    const hex = color.replace("$", "");
    const semAlpha = hex.length === 8 ? hex.slice(2) : hex;

    if (semAlpha.length === 6) {
      const bb = semAlpha.slice(0, 2);
      const gg = semAlpha.slice(2, 4);
      const rr = semAlpha.slice(4, 6);
      return `#${rr}${gg}${bb}`;
    }
  }

  return null;
}

function buildMemoStyle(memo, options = {}) {
  const {
    absolute = true,
    leftOverride = null,
    topOverride = null,
  } = options;

  const height = normalizarNumeroFastReport(memo?.height, 12);
  const fontSize = normalizarNumeroFastReport(memo?.font_size, 0);

  const style = {
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    lineHeight: 1.15,
    padding: "0",
    overflow: "visible",
    fontSize: fontSize > 0 ? `${fontSize}px` : "11px",
    minHeight: `${height}px`,
  };

  if (absolute) {
    style.position = "absolute";
    style.left = `${leftOverride ?? normalizarNumeroFastReport(memo?.left)}px`;
    style.top = `${topOverride ?? normalizarNumeroFastReport(memo?.top)}px`;
    style.width = `${normalizarNumeroFastReport(memo?.width)}px`;
  }

  if (memo?.h_align === "haRight") {
    style.textAlign = "right";
  } else if (memo?.h_align === "haCenter") {
    style.textAlign = "center";
  } else if (memo?.h_align === "haBlock") {
    style.textAlign = "justify";
  } else {
    style.textAlign = "left";
  }

  if (memo?.v_align === "vaCenter") {
    style.display = "flex";
    style.alignItems = "center";
  } else if (memo?.v_align === "vaBottom") {
    style.display = "flex";
    style.alignItems = "flex-end";
  }

  style.fontFamily = memo?.font_name || "Arial, sans-serif";

  const fontStyle = String(memo?.font_style || "");

  if (fontStyle.includes("fsBold")) {
    style.fontWeight = 700;
  }

  if (fontStyle.includes("fsItalic")) {
    style.fontStyle = "italic";
  }

  if (fontStyle.includes("fsUnderline")) {
    style.textDecoration = "underline";
  }

  const color = fastReportColorToCss(memo?.color);
  if (color) {
    style.color = color;
  }

  const fillColor = fastReportColorToCss(memo?.fill_color);
  if (fillColor) {
    style.backgroundColor = fillColor;
  }

  const borderColor = fastReportColorToCss(memo?.border_color);
  const borderWidth = normalizarNumeroFastReport(memo?.border_width);
  if (borderColor && borderWidth > 0) {
    style.border = `${Math.max(borderWidth, 1)}px solid ${borderColor}`;
  }

  return style;
}

function ordenarPorPosicao(items = []) {
  return [...items].sort((a, b) => {
    const topA = normalizarNumeroFastReport(a?.top, 0);
    const topB = normalizarNumeroFastReport(b?.top, 0);

    if (topA !== topB) {
      return topA - topB;
    }

    const leftA = normalizarNumeroFastReport(a?.left, 0);
    const leftB = normalizarNumeroFastReport(b?.left, 0);

    return leftA - leftB;
  });
}

function calcularAlturaBloco(memos = [], minimo = 48) {
  if (!memos.length) return minimo;

  const maiorBottom = Math.max(
    ...memos.map((memo) => {
      const top = normalizarNumeroFastReport(memo?.top, 0);
      const height = normalizarNumeroFastReport(memo?.height, 12);
      return top + height;
    })
  );

  return Math.max(maiorBottom + 12, minimo);
}

function obterMemosDaBanda(layout, bandName) {
  const memos = Array.isArray(layout?.memos) ? layout.memos : [];
  return memos.filter((memo) => memo?.band_name === bandName);
}

function obterBandasPorTipo(layout, bandType) {
  const bands = Array.isArray(layout?.bands) ? layout.bands : [];
  return ordenarPorPosicao(bands.filter((band) => band?.type === bandType));
}

function limparTexto(texto) {
  return String(texto || "").trim();
}

function memoTemExpressaoDeCampo(memo) {
  const texto = limparTexto(memo?.text);
  if (!texto) return false;

  return (
    /\[[A-Za-z0-9_]+\."[^"]+"\]/.test(texto) ||
    /<\s*[A-Za-z0-9_]+\."[^"]+"\s*>/.test(texto) ||
    /\[[A-Za-z0-9_]+\]/.test(texto)
  );
}

function extrairReferenciaCampo(texto) {
  const valor = limparTexto(texto);

  let match = valor.match(/\[([A-Za-z0-9_]+)\."([^"]+)"\]/);
  if (match) {
    return {
      dataset: match[1],
      field: match[2],
    };
  }

  match = valor.match(/<\s*([A-Za-z0-9_]+)\."([^"]+)"\s*>/);
  if (match) {
    return {
      dataset: match[1],
      field: match[2],
    };
  }

  match = valor.match(/\[([A-Za-z0-9_]+)\]/);
  if (match) {
    const token = match[1];

    if (
      [
        "Date",
        "Time",
        "Page",
        "Page#",
        "TotalPages",
        "TotalPages#",
        "Line",
      ].includes(token)
    ) {
      return null;
    }

    return {
      dataset: null,
      field: token,
    };
  }

  return null;
}

function extrairAgregacao(texto) {
  const valor = limparTexto(texto);

  const match = valor.match(
    /(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:<|\[)?(?:([A-Za-z0-9_]+)\.)?"?([A-Za-z0-9_]+)"?(?:>|\])?\s*\)/i
  );

  if (!match) return null;

  return {
    func: String(match[1]).toUpperCase(),
    dataset: match[2] || null,
    field: match[3] || null,
  };
}

function normalizarNomeCampo(nome) {
  return String(nome || "").trim().toLowerCase();
}

function obterValorCampo(row, fieldName) {
  if (!row || !fieldName) return undefined;

  const alvo = normalizarNomeCampo(fieldName);

  for (const [chave, valor] of Object.entries(row)) {
    if (normalizarNomeCampo(chave) === alvo) {
      return valor;
    }
  }

  return undefined;
}

function calcularAgregacao(rows = [], agg) {
  if (!agg) return "";

  const linhas = Array.isArray(rows) ? rows : [];
  const campo = agg.field;

  if (agg.func === "COUNT") {
    return String(linhas.length);
  }

  const valores = linhas
    .map((row) => Number(obterValorCampo(row, campo)))
    .filter((numero) => !Number.isNaN(numero));

  if (!valores.length) {
    return "";
  }

  if (agg.func === "SUM") {
    return formatarMoeda(valores.reduce((acc, valor) => acc + valor, 0));
  }

  if (agg.func === "AVG") {
    return formatarMoeda(
      valores.reduce((acc, valor) => acc + valor, 0) / valores.length
    );
  }

  if (agg.func === "MIN") {
    return formatarValor(campo, Math.min(...valores));
  }

  if (agg.func === "MAX") {
    return formatarValor(campo, Math.max(...valores));
  }

  return "";
}

function obterFiltroPorNome(filtrosAplicados = [], nomesAceitos = []) {
  return filtrosAplicados.find((item) =>
    nomesAceitos.includes(String(item?.nome || "").trim().toUpperCase())
  );
}

function deveOcultarMemoDoTopo(memo) {
  const texto = limparTexto(memo?.text).toUpperCase();

  if (!texto) return true;

  if (texto.includes("RELATORIOS GO UP SISTEMAS")) return true;
  if (texto === "[(&lt;DATE&gt;)]" || texto === "[(<DATE>)]") return true;
  if (texto === "[(&lt;TIME&gt;)]" || texto === "[(<TIME>)]") return true;

  return false;
}

function resolverTextoMemo(
  textoOriginal,
  context = {}
) {
  if (!textoOriginal) return "";

  const {
    row = null,
    variables = [],
    filtrosAplicados = [],
    rowsForTotals = [],
    pageNumber = 1,
    totalPages = 1,
    tituloRelatorio = "",
  } = context;

  let texto = String(textoOriginal);

  const agregacao = extrairAgregacao(texto);
  if (agregacao) {
    const valorAgg = calcularAgregacao(rowsForTotals, agregacao);
    texto = texto.replace(
      /(SUM|COUNT|AVG|MIN|MAX)\s*\(\s*(?:<|\[)?(?:([A-Za-z0-9_]+)\.)?"?([A-Za-z0-9_]+)"?(?:>|\])?\s*\)/i,
      valorAgg
    );
  }

  texto = texto.replace(/\[([A-Za-z0-9_]+)\."([^"]+)"\]/g, (_, dataset, campo) => {
    const valor = obterValorCampo(row, campo);
    return formatarValor(campo, valor);
  });

  texto = texto.replace(/<\s*([A-Za-z0-9_]+)\."([^"]+)"\s*>/g, (_, dataset, campo) => {
    const valor = obterValorCampo(row, campo);
    return formatarValor(campo, valor);
  });

  texto = texto.replace(/\[DateEdit1\.date\]/gi, () => {
    const inicial = obterFiltroPorNome(filtrosAplicados, [
      "DATAINICIAL",
      "DTINICIAL",
      "INICIAL",
    ]);
    return inicial?.valor || "";
  });

  texto = texto.replace(/\[DateEdit2\.date\]/gi, () => {
    const final = obterFiltroPorNome(filtrosAplicados, [
      "DATAFINAL",
      "DTFINAL",
      "FINAL",
    ]);
    return final?.valor || "";
  });

  texto = texto.replace(/\[\(<Date>\)\]/gi, () => {
    return new Date().toLocaleDateString("pt-BR");
  });

  texto = texto.replace(/\[\(<Time>\)\]/gi, () => {
    return new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  texto = texto.replace(/\[Page#\]/gi, () => String(pageNumber));
  texto = texto.replace(/\[TotalPages#\]/gi, () => String(totalPages));
  texto = texto.replace(/\[Page\]/gi, () => String(pageNumber));
  texto = texto.replace(/\[TotalPages\]/gi, () => String(totalPages));

  texto = texto.replace(/\[([A-Za-z0-9_]+)\]/g, (_, token) => {
    const tokenUpper = String(token).toUpperCase();

    if (tokenUpper === "TITULORELATORIO") {
      return tituloRelatorio;
    }

    const valorVariavel = obterVariavel(variables, token);
    if (valorVariavel) {
      return valorVariavel;
    }

    const valorLinha = obterValorCampo(row, token);
    if (valorLinha !== undefined) {
      return formatarValor(token, valorLinha);
    }

    return "";
  });

  return texto.replace(/\s+-\s+-\s*$/g, "").trim();
}

function construirColunasDetalhe(masterMemos = [], headerMemos = []) {
  const colunas = ordenarPorPosicao(
    masterMemos.filter((memo) => memoTemExpressaoDeCampo(memo))
  );

  return colunas.map((memo, index) => {
    const ref = extrairReferenciaCampo(memo?.text) || {
      dataset: memo?.data_set || null,
      field: memo?.data_field || memo?.name || `coluna_${index + 1}`,
    };

    const headerMemo = headerMemos[index];
    const titulo =
      limparTexto(headerMemo?.text) ||
      limparTexto(ref.field) ||
      limparTexto(memo?.name) ||
      `Coluna ${index + 1}`;

    return {
      key: `${ref.dataset || "row"}:${ref.field || memo?.name || index}`,
      field: ref.field || memo?.name || `coluna_${index + 1}`,
      dataset: ref.dataset,
      memo,
      headerMemo,
      title: titulo,
    };
  });
}

function extrairCampoAgrupamento(groupBand, groupMemos = []) {
  const conditionRef = extrairReferenciaCampo(groupBand?.condition);
  if (conditionRef?.field) {
    return conditionRef;
  }

  const memoComCampo = groupMemos.find((memo) => memoTemExpressaoDeCampo(memo));
  if (memoComCampo) {
    return extrairReferenciaCampo(memoComCampo?.text);
  }

  return null;
}

function agruparLinhas(linhas = [], groupRef = null) {
  if (!groupRef?.field) {
    return [
      {
        key: "default-group",
        label: "",
        rows: Array.isArray(linhas) ? linhas : [],
      },
    ];
  }

  const mapa = new Map();

  for (const row of linhas) {
    const valor = obterValorCampo(row, groupRef.field);
    const chave = valor === null || valor === undefined || valor === ""
      ? "__vazio__"
      : String(valor);

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        key: chave,
        label: valor,
        rows: [],
      });
    }

    mapa.get(chave).rows.push(row);
  }

  return Array.from(mapa.values());
}

function larguraRelatorio(layout) {
  const memos = Array.isArray(layout?.memos) ? layout.memos : [];
  const bands = Array.isArray(layout?.bands) ? layout.bands : [];
  const pages = Array.isArray(layout?.pages) ? layout.pages : [];

  const larguraMemos = memos.map((memo) => {
    const left = normalizarNumeroFastReport(memo?.left, 0);
    const width = normalizarNumeroFastReport(memo?.width, 0);
    return left + width;
  });

  const larguraBandas = bands.map((band) => {
    const left = normalizarNumeroFastReport(band?.left, 0);
    const width = normalizarNumeroFastReport(band?.width, 0);
    return left + width;
  });

  const larguraPaginas = pages.map((page) =>
    normalizarNumeroFastReport(page?.width, 0)
  );

  return Math.max(1100, ...larguraMemos, ...larguraBandas, ...larguraPaginas);
}

function renderizarBandaAbsoluta({
  band,
  memos,
  context,
  largura,
  className = "",
}) {
  if (!band || !memos.length) return null;

  const altura = Math.max(
    calcularAlturaBloco(memos, normalizarNumeroFastReport(band?.height, 24)),
    normalizarNumeroFastReport(band?.height, 24)
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: `${largura}px`,
        minHeight: `${altura}px`,
        margin: "0 auto",
      }}
    >
      {memos.map((memo) => (
        <div key={`${band?.name}-${memo?.name}-${memo?.left}-${memo?.top}`} style={buildMemoStyle(memo)}>
          {resolverTextoMemo(memo?.text, context)}
        </div>
      ))}
    </div>
  );
}

function renderizarBandasAbsolutasMultiplas({
  bands = [],
  layout,
  context,
  largura,
  className = "",
  filterFn = null,
}) {
  return bands.map((band) => {
    let memos = obterMemosDaBanda(layout, band?.name);
    memos = ordenarPorPosicao(memos);

    if (filterFn) {
      memos = memos.filter(filterFn);
    }

    if (!memos.length) return null;

    return (
      <div key={band?.name} style={{ marginBottom: "8px" }}>
        {renderizarBandaAbsoluta({
          band,
          memos,
          context,
          largura,
          className,
        })}
      </div>
    );
  });
}

export default function FastReportRenderer({
  layout,
  linhas = [],
  filtrosAplicados = [],
  tituloRelatorio = "Preview do relatório",
  totalRegistros = 0,
  detalhe = null,
}) {
  const linhasSeguras = Array.isArray(linhas) ? linhas : [];
  const variables = Array.isArray(detalhe?.variables) ? detalhe.variables : [];

  const memos = Array.isArray(layout?.memos) ? layout.memos : [];
  const bands = Array.isArray(layout?.bands) ? layout.bands : [];

  if (!layout || !memos.length || !bands.length) {
    return (
      <div className="preview-empty">
        Layout visual não disponível para este relatório.
      </div>
    );
  }

  const largura = larguraRelatorio(layout);

  const reportTitleBands = obterBandasPorTipo(layout, "TfrxReportTitle");
  const pageHeaderBands = obterBandasPorTipo(layout, "TfrxPageHeader");
  const groupHeaderBands = obterBandasPorTipo(layout, "TfrxGroupHeader");
  const masterBands = obterBandasPorTipo(layout, "TfrxMasterData");
  const groupFooterBands = obterBandasPorTipo(layout, "TfrxGroupFooter");
  const reportSummaryBands = obterBandasPorTipo(layout, "TfrxReportSummary");
  const pageFooterBands = obterBandasPorTipo(layout, "TfrxPageFooter");

  const mainMasterBand = masterBands[0] || null;
  const mainGroupHeaderBand = groupHeaderBands[0] || null;
  const mainGroupFooterBand = groupFooterBands[0] || null;

  const titleMemos = reportTitleBands.flatMap((band) =>
    obterMemosDaBanda(layout, band?.name)
  );
  const titleMemosVisiveis = ordenarPorPosicao(titleMemos).filter(
    (memo) => !deveOcultarMemoDoTopo(memo)
  );

  const pageHeaderMemos = pageHeaderBands.flatMap((band) =>
    obterMemosDaBanda(layout, band?.name)
  );

  const groupHeaderMemos = mainGroupHeaderBand
    ? ordenarPorPosicao(obterMemosDaBanda(layout, mainGroupHeaderBand?.name))
    : [];

  const masterMemos = mainMasterBand
    ? ordenarPorPosicao(obterMemosDaBanda(layout, mainMasterBand?.name))
    : [];

  const headerMemosBase =
    pageHeaderMemos.length > 0
      ? ordenarPorPosicao(pageHeaderMemos).filter((memo) => !memoTemExpressaoDeCampo(memo))
      : groupHeaderMemos.filter((memo) => !memoTemExpressaoDeCampo(memo));

  const groupLabelMemos = groupHeaderMemos.filter((memo) => memoTemExpressaoDeCampo(memo));

  const colunas = construirColunasDetalhe(masterMemos, headerMemosBase);

  const groupRef = extrairCampoAgrupamento(mainGroupHeaderBand, groupHeaderMemos);
  const grupos = agruparLinhas(linhasSeguras, groupRef);

  const summaryContext = {
    row: null,
    variables,
    filtrosAplicados,
    rowsForTotals: linhasSeguras,
    pageNumber: 1,
    totalPages: 1,
    tituloRelatorio,
  };

  return (
    <div className="report-preview">
      <div className="report-sheet">
        {titleMemosVisiveis.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {renderizarBandaAbsoluta({
              band: reportTitleBands[0] || { name: "report-title" },
              memos: titleMemosVisiveis,
              context: summaryContext,
              largura,
            })}
          </div>
        )}

        {pageHeaderBands.length > 0 &&
          renderizarBandasAbsolutasMultiplas({
            bands: pageHeaderBands,
            layout,
            context: summaryContext,
            largura,
            filterFn: (memo) => limparTexto(memo?.text) !== "",
          })}

        {colunas.length > 0 ? (
          <div className="preview-table-wrap">
            <table
              className="preview-table report-table"
              style={{ minWidth: `${largura}px` }}
            >
              <thead>
                <tr>
                  {colunas.map((coluna) => (
                    <th
                      key={coluna.key}
                      style={{
                        textAlign:
                          coluna.memo?.h_align === "haRight" ? "right" : "left",
                        backgroundColor:
                          fastReportColorToCss(coluna.headerMemo?.fill_color) ||
                          fastReportColorToCss(coluna.memo?.fill_color) ||
                          undefined,
                        color:
                          fastReportColorToCss(coluna.headerMemo?.color) ||
                          fastReportColorToCss(coluna.memo?.color) ||
                          undefined,
                        fontWeight:
                          String(
                            coluna.headerMemo?.font_style ||
                              coluna.memo?.font_style ||
                              ""
                          ).includes("fsBold")
                            ? 700
                            : undefined,
                        width: coluna.memo?.width
                          ? `${normalizarNumeroFastReport(coluna.memo?.width)}px`
                          : undefined,
                        fontSize: coluna.memo?.font_size
                          ? `${normalizarNumeroFastReport(
                              coluna.memo?.font_size,
                              11
                            )}px`
                          : "11px",
                      }}
                    >
                      {coluna.title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {grupos.map((grupo, grupoIndex) => {
                  const contextoGrupo = {
                    ...summaryContext,
                    rowsForTotals: grupo.rows,
                  };

                  return (
                    <Fragment key={grupo.key || grupoIndex}>
                      {groupRef?.field && groupLabelMemos.length > 0 && (
                        <tr className="report-group-row">
                          <td colSpan={Math.max(colunas.length, 1)}>
                            <div style={{ padding: "6px 2px", fontWeight: 700 }}>
                              {groupLabelMemos
                                .map((memo) =>
                                  resolverTextoMemo(memo?.text, {
                                    ...contextoGrupo,
                                    row: grupo.rows[0] || null,
                                  })
                                )
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                          </td>
                        </tr>
                      )}

                      {groupRef?.field && groupLabelMemos.length === 0 && (
                        <tr className="report-group-row">
                          <td colSpan={Math.max(colunas.length, 1)}>
                            <div style={{ padding: "6px 2px", fontWeight: 700 }}>
                              {String(grupo.label ?? "")}
                            </div>
                          </td>
                        </tr>
                      )}

                      {grupo.rows.map((linha, indexLinha) => (
                        <tr key={`${grupo.key}-${indexLinha}`}>
                          {colunas.map((coluna) => (
                            <td
                              key={`${grupo.key}-${indexLinha}-${coluna.key}`}
                              className={
                                coluna.memo?.h_align === "haRight"
                                  ? "is-number"
                                  : ""
                              }
                              style={{
                                textAlign:
                                  coluna.memo?.h_align === "haRight"
                                    ? "right"
                                    : "left",
                                backgroundColor:
                                  fastReportColorToCss(coluna.memo?.fill_color) ||
                                  undefined,
                                color:
                                  fastReportColorToCss(coluna.memo?.color) ||
                                  undefined,
                                fontWeight: String(
                                  coluna.memo?.font_style || ""
                                ).includes("fsBold")
                                  ? 700
                                  : undefined,
                                fontStyle: String(
                                  coluna.memo?.font_style || ""
                                ).includes("fsItalic")
                                  ? "italic"
                                  : undefined,
                                width: coluna.memo?.width
                                  ? `${normalizarNumeroFastReport(
                                      coluna.memo?.width
                                    )}px`
                                  : undefined,
                                fontSize: coluna.memo?.font_size
                                  ? `${normalizarNumeroFastReport(
                                      coluna.memo?.font_size,
                                      11
                                    )}px`
                                  : "11px",
                              }}
                            >
                              {resolverTextoMemo(coluna.memo?.text, {
                                ...summaryContext,
                                row: linha,
                                rowsForTotals: grupo.rows,
                              })}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {mainGroupFooterBand &&
                        (() => {
                          const footerMemos = ordenarPorPosicao(
                            obterMemosDaBanda(layout, mainGroupFooterBand?.name)
                          );

                          if (!footerMemos.length) return null;

                          return (
                            <tr className="report-group-total-row">
                              <td colSpan={Math.max(colunas.length, 1)}>
                                <div
                                  style={{
                                    position: "relative",
                                    minHeight: `${calcularAlturaBloco(
                                      footerMemos,
                                      28
                                    )}px`,
                                  }}
                                >
                                  {footerMemos.map((memo) => (
                                    <div
                                      key={`${grupo.key}-${memo?.name}`}
                                      style={buildMemoStyle(memo)}
                                    >
                                      {resolverTextoMemo(memo?.text, {
                                        ...summaryContext,
                                        row: grupo.rows[0] || null,
                                        rowsForTotals: grupo.rows,
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                    </Fragment>
                  );
                })}
              </tbody>

              <tfoot>
                {reportSummaryBands.length > 0 ? (
                  <tr>
                    <td colSpan={Math.max(colunas.length, 1)}>
                      {reportSummaryBands.map((band) => {
                        const summaryMemos = ordenarPorPosicao(
                          obterMemosDaBanda(layout, band?.name)
                        );

                        if (!summaryMemos.length) return null;

                        return (
                          <div
                            key={band?.name}
                            style={{
                              position: "relative",
                              minHeight: `${calcularAlturaBloco(summaryMemos, 32)}px`,
                            }}
                          >
                            {summaryMemos.map((memo) => (
                              <div key={`${band?.name}-${memo?.name}`} style={buildMemoStyle(memo)}>
                                {resolverTextoMemo(memo?.text, summaryContext)}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                ) : null}
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="preview-empty">
            Nenhuma banda MasterData com colunas reconhecíveis foi encontrada.
          </div>
        )}

        {pageFooterBands.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            {renderizarBandasAbsolutasMultiplas({
              bands: pageFooterBands,
              layout,
              context: summaryContext,
              largura,
              filterFn: (memo) => !deveOcultarMemoDoTopo(memo),
            })}
          </div>
        )}

        <div className="preview-summary">
          Total de registros: <strong>{totalRegistros}</strong>
        </div>
      </div>
    </div>
  );
}