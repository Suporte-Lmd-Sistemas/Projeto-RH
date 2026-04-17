import { useEffect, useMemo, useState } from "react";
import {
  listarRelatorios,
  inspecionarRelatorio,
  obterOpcoesRelatorio,
  executarPreviewRelatorio,
} from "../services/relatoriosService";
import FastReportRenderer from "./relatorios/FastReportRenderer.jsx";
import "../styles/relatorios-lista.css";
import "../styles/relatorio-preview.css";
import "../styles/relatorio-table.css";

function extrairParametrosDoDetalhe(detalhe) {
  const queries = Array.isArray(detalhe?.queries) ? detalhe.queries : [];
  const unicos = new Map();

  for (const query of queries) {
    const parametros = Array.isArray(query?.parametros) ? query.parametros : [];

    for (const param of parametros) {
      const nomeOriginal = param?.name;
      const datatype = String(param?.datatype || "").toLowerCase();

      if (!nomeOriginal) continue;

      const chave = String(nomeOriginal).toUpperCase();

      if (!unicos.has(chave)) {
        let inferredType = "str";
        let semanticKey = chave.toLowerCase();
        let defaultValue = "";

        if (datatype.includes("date")) {
          inferredType = "date";

          const hoje = new Date();
          const yyyy = hoje.getFullYear();
          const mm = String(hoje.getMonth() + 1).padStart(2, "0");
          const dd = String(hoje.getDate()).padStart(2, "0");

          const primeiroDia = `${yyyy}-${mm}-01`;
          const hojeIso = `${yyyy}-${mm}-${dd}`;

          if (chave.includes("INICIAL") || chave.includes("INICIO")) {
            semanticKey = "data_inicial";
            defaultValue = primeiroDia;
          } else if (chave.includes("FINAL") || chave.includes("FIM")) {
            semanticKey = "data_final";
            defaultValue = hojeIso;
          } else {
            semanticKey = "data";
            defaultValue = hojeIso;
          }
        } else if (
          datatype.includes("integer") ||
          datatype.includes("smallint") ||
          datatype.includes("bigint") ||
          datatype.includes("int")
        ) {
          inferredType = "int";
          defaultValue = 0;

          if (chave.includes("EMPRESA")) {
            semanticKey = "empresa";
            defaultValue = 1;
          } else if (chave.includes("VENDEDOR")) {
            semanticKey = "vendedor";
            defaultValue = 0;
          } else if (chave.includes("CLIENTE")) {
            semanticKey = "cliente";
            defaultValue = 0;
          } else if (chave.includes("NATUREZA")) {
            semanticKey = "natureza";
            defaultValue = 0;
          }
        } else if (
          datatype.includes("numeric") ||
          datatype.includes("float") ||
          datatype.includes("double") ||
          datatype.includes("decimal")
        ) {
          inferredType = "number";
          defaultValue = 0;
        }

        unicos.set(chave, {
          original_name: nomeOriginal,
          inferred_type: inferredType,
          semantic_key: semanticKey,
          default_value: defaultValue,
        });
      }
    }
  }

  return Array.from(unicos.values());
}

function formatarDataParaExibicao(valor) {
  if (!valor) return "Não informado";

  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return String(valor);
}

function isTextoUtil(valor) {
  if (valor === null || valor === undefined) return false;
  const texto = String(valor).trim();
  if (!texto) return false;
  return true;
}

function escolherCampoValue(item = {}) {
  const chaves = Object.keys(item);

  const candidatasFortes = [
    "VALUE",
    "value",
    "ID",
    "id",
    "EMP_ID",
    "emp_id",
    "CLI_ID",
    "cli_id",
    "PES_ID",
    "pes_id",
    "VEN_ID",
    "ven_id",
    "FUN_ID",
    "fun_id",
    "NOP_ID",
    "nop_id",
    "CODIGO",
    "codigo",
    "COD",
    "cod",
  ];

  for (const chave of candidatasFortes) {
    if (chave in item) return item[chave];
  }

  const chaveComId = chaves.find((chave) => /(^|_)(id|codigo|cod)$/i.test(chave));
  if (chaveComId) return item[chaveComId];

  return Object.values(item)[0];
}

function escolherCampoLabel(item = {}, semanticKey = "") {
  const chaves = Object.keys(item);

  const candidatasPorTipo = {
    empresa: [
      "LABEL",
      "label",
      "EMP_FANTASIA",
      "emp_fantasia",
      "EMP_RAZAO_SOCIAL",
      "emp_razao_social",
      "NOME",
      "nome",
      "DESCRICAO",
      "descricao",
    ],
    cliente: [
      "LABEL",
      "label",
      "CLI_NOME",
      "cli_nome",
      "CLI_RAZAO_SOCIAL",
      "cli_razao_social",
      "CLI_FANTASIA",
      "cli_fantasia",
      "PES_NOME",
      "pes_nome",
      "PES_RAZAO_SOCIAL",
      "pes_razao_social",
      "PES_FANTASIA_APELIDO",
      "pes_fantasia_apelido",
      "NOME",
      "nome",
      "DESCRICAO",
      "descricao",
    ],
    vendedor: [
      "LABEL",
      "label",
      "VEN_NOME",
      "ven_nome",
      "FUN_NOME",
      "fun_nome",
      "PES_NOME",
      "pes_nome",
      "NOME",
      "nome",
      "DESCRICAO",
      "descricao",
    ],
    natureza: [
      "LABEL",
      "label",
      "NOP_DESCRICAO",
      "nop_descricao",
      "DESCRICAO",
      "descricao",
      "NOME",
      "nome",
    ],
    default: [
      "LABEL",
      "label",
      "NOME",
      "nome",
      "DESCRICAO",
      "descricao",
      "RAZAO_SOCIAL",
      "razao_social",
      "FANTASIA",
      "fantasia",
    ],
  };

  const candidatas = candidatasPorTipo[semanticKey] || candidatasPorTipo.default;

  for (const chave of candidatas) {
    if (chave in item && isTextoUtil(item[chave])) {
      return item[chave];
    }
  }

  const chaveNome = chaves.find((chave) =>
    /(nome|descricao|razao|fantasia|apelido)/i.test(chave)
  );
  if (chaveNome && isTextoUtil(item[chaveNome])) {
    return item[chaveNome];
  }

  const valoresTextuais = Object.values(item).filter((valor) => {
    const texto = String(valor ?? "").trim();
    return texto.length > 1 && /[A-Za-zÀ-ÿ]/.test(texto);
  });

  if (valoresTextuais.length > 0) {
    return valoresTextuais[0];
  }

  const segundo = Object.values(item)[1];
  if (isTextoUtil(segundo)) {
    return segundo;
  }

  const primeiro = Object.values(item)[0];
  return isTextoUtil(primeiro) ? primeiro : "Opção";
}

function normalizarListaOpcoes(lista = [], semanticKey = "") {
  if (!Array.isArray(lista)) return [];

  return lista.map((item, index) => {
    if (item && typeof item === "object") {
      const value = escolherCampoValue(item);
      const label = escolherCampoLabel(item, semanticKey);

      return {
        ...item,
        VALUE: value,
        LABEL: String(label),
      };
    }

    return {
      VALUE: item,
      LABEL: String(item),
    };
  });
}

function adicionarOpcaoTodos(lista = [], semanticKey = "") {
  const listaNormalizada = normalizarListaOpcoes(lista, semanticKey);

  if (!["vendedor", "cliente", "natureza"].includes(semanticKey)) {
    return listaNormalizada;
  }

  const labelPadrao = semanticKey === "natureza" ? "Todas" : "Todos";

  const jaExisteZero = listaNormalizada.some(
    (item) => String(item.VALUE) === "0"
  );

  if (jaExisteZero) {
    return listaNormalizada;
  }

  return [
    {
      VALUE: 0,
      LABEL: labelPadrao,
    },
    ...listaNormalizada,
  ];
}

function formatarFiltroParaExibicao(chave, valor, opcoes) {
  if (valor === null || valor === undefined || valor === "") {
    return "Não informado";
  }

  const chaveNormalizada = String(chave).toUpperCase();

  if (chaveNormalizada.includes("DATA")) {
    return formatarDataParaExibicao(valor);
  }

  if (chaveNormalizada.includes("EMPRESA")) {
    const lista = normalizarListaOpcoes(opcoes?.empresas, "empresa");
    const encontrado = lista.find((item) => String(item.VALUE) === String(valor));
    return encontrado?.LABEL ?? String(valor);
  }

  if (chaveNormalizada.includes("VENDEDOR")) {
    if (Number(valor) === 0) return "Todos";
    const lista = adicionarOpcaoTodos(opcoes?.vendedores, "vendedor");
    const encontrado = lista.find((item) => String(item.VALUE) === String(valor));
    return encontrado?.LABEL ?? String(valor);
  }

  if (chaveNormalizada.includes("CLIENTE")) {
    if (Number(valor) === 0) return "Todos";
    const lista = adicionarOpcaoTodos(opcoes?.clientes, "cliente");
    const encontrado = lista.find((item) => String(item.VALUE) === String(valor));
    return encontrado?.LABEL ?? String(valor);
  }

  if (chaveNormalizada.includes("NATUREZA")) {
    if (Number(valor) === 0) return "Todas";
    const lista = adicionarOpcaoTodos(opcoes?.naturezas, "natureza");
    const encontrado = lista.find((item) => String(item.VALUE) === String(valor));
    return encontrado?.LABEL ?? String(valor);
  }

  return String(valor);
}

function formatarDataHora(valor) {
  if (!valor) return "Não informado";
  return String(valor);
}

function Modal({ aberto, titulo, subtitulo, onFechar, children, largura = "920px" }) {
  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div
        className="modal-card"
        style={{ maxWidth: largura }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header no-print">
          <div>
            <h2>{titulo}</h2>
            {subtitulo ? <p>{subtitulo}</p> : null}
          </div>

          <button type="button" className="modal-close-btn" onClick={onFechar}>
            ×
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function ListaRelatorios({ categoria, titulo }) {
  const [loadingLista, setLoadingLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [busca, setBusca] = useState("");
  const [relatorios, setRelatorios] = useState([]);

  const [modalParametrosAberto, setModalParametrosAberto] = useState(false);
  const [modalPreviewAberto, setModalPreviewAberto] = useState(false);

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [erroModal, setErroModal] = useState("");

  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [parametros, setParametros] = useState([]);
  const [opcoes, setOpcoes] = useState({
    empresas: [],
    vendedores: [],
    naturezas: [],
    clientes: [],
  });
  const [form, setForm] = useState({});
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    async function carregarRelatorios() {
      try {
        setLoadingLista(true);
        setErroLista("");

        const data = await listarRelatorios(categoria);
        setRelatorios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setErroLista(
          error?.response?.data?.detail ||
            error?.message ||
            "Erro ao carregar relatórios."
        );
      } finally {
        setLoadingLista(false);
      }
    }

    carregarRelatorios();
  }, [categoria]);

  const relatoriosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return relatorios;

    return relatorios.filter((relatorio) => {
      const campos = [
        relatorio?.nome,
        relatorio?.descricao,
        relatorio?.pasta,
        relatorio?.pasta_pai,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return campos.includes(termo);
    });
  }, [relatorios, busca]);

  const filtrosAplicados = useMemo(() => {
    return parametros.map((param) => ({
      nome: param.original_name,
      semanticKey: param.semantic_key,
      valor: formatarFiltroParaExibicao(
        param.original_name,
        form[param.original_name],
        opcoes
      ),
    }));
  }, [parametros, form, opcoes]);

  function atualizarCampo(nomeCampo, valor) {
    setForm((prev) => ({
      ...prev,
      [nomeCampo]: valor,
    }));
  }

  function fecharModalParametros() {
    setModalParametrosAberto(false);
    setErroModal("");
  }

  function fecharModalPreview() {
    setModalPreviewAberto(false);
  }

  function limparEstadoModal() {
    setDetalhe(null);
    setParametros([]);
    setOpcoes({
      empresas: [],
      vendedores: [],
      naturezas: [],
      clientes: [],
    });
    setForm({});
    setPreviewData(null);
    setErroModal("");
  }

  async function abrirModalParametros(relatorio) {
    try {
      setLoadingMeta(true);
      setErroModal("");
      setRelatorioSelecionado(relatorio);
      setPreviewData(null);
      setModalPreviewAberto(false);

      const [detalheResp, opcoesResp] = await Promise.all([
        inspecionarRelatorio(relatorio.cdarquivo),
        obterOpcoesRelatorio(relatorio.cdarquivo),
      ]);

      const params =
        detalheResp?.parameters_detected ||
        detalheResp?.parametros_detectados ||
        extrairParametrosDoDetalhe(detalheResp);

      const opcoesNormalizadas = {
        empresas: normalizarListaOpcoes(opcoesResp?.empresas, "empresa"),
        vendedores: adicionarOpcaoTodos(opcoesResp?.vendedores, "vendedor"),
        naturezas: adicionarOpcaoTodos(opcoesResp?.naturezas, "natureza"),
        clientes: adicionarOpcaoTodos(opcoesResp?.clientes, "cliente"),
        ...opcoesResp,
      };

      const valoresIniciais = {};

      for (const param of params) {
        const chave = param.original_name;
        let valorInicial = param.default_value ?? "";

        if (param.semantic_key === "empresa") {
          const primeiraEmpresa = opcoesNormalizadas.empresas?.[0];

          if (
            valorInicial === "" ||
            valorInicial === null ||
            valorInicial === undefined
          ) {
            valorInicial = primeiraEmpresa?.VALUE ?? "";
          }
        }

        if (
          ["vendedor", "cliente", "natureza"].includes(param.semantic_key) &&
          (valorInicial === "" || valorInicial === null || valorInicial === undefined)
        ) {
          valorInicial = 0;
        }

        valoresIniciais[chave] = valorInicial;
      }

      setDetalhe(detalheResp);
      setParametros(params);
      setOpcoes(opcoesNormalizadas);
      setForm(valoresIniciais);
      setModalParametrosAberto(true);
    } catch (error) {
      console.error(error);
      setErroModal(
        error?.response?.data?.detail ||
          error?.message ||
          "Erro ao carregar parâmetros do relatório."
      );
      setModalParametrosAberto(true);
    } finally {
      setLoadingMeta(false);
    }
  }

  async function gerarPreview() {
    if (!relatorioSelecionado?.cdarquivo) return;

    try {
      setLoadingPreview(true);
      setErroModal("");

      const payload = {};

      for (const param of parametros) {
        let valor = form[param.original_name];

        if (
          ["vendedor", "cliente", "natureza"].includes(param.semantic_key) &&
          (valor === "" || valor === null || valor === undefined)
        ) {
          valor = 0;
        }

        payload[param.original_name] = valor;
      }

      const resposta = await executarPreviewRelatorio(
        relatorioSelecionado.cdarquivo,
        payload
      );

      setPreviewData(resposta);
      setModalParametrosAberto(false);
      setModalPreviewAberto(true);
    } catch (error) {
      console.error(error);
      setErroModal(
        error?.response?.data?.detail ||
          error?.message ||
          "Erro ao gerar preview do relatório."
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  function imprimirPreview() {
    window.print();
  }

  function renderSelect(
    lista = [],
    valor,
    onChange,
    placeholder = "Selecione",
    semanticKey = ""
  ) {
    const listaNormalizada = adicionarOpcaoTodos(lista, semanticKey);

    return (
      <select value={valor} onChange={onChange} className="preview-select">
        {semanticKey === "empresa" && listaNormalizada.length === 0 ? (
          <option value="">{placeholder}</option>
        ) : null}

        {listaNormalizada.map((item, index) => (
          <option key={`${item.VALUE}-${index}`} value={item.VALUE}>
            {item.LABEL}
          </option>
        ))}
      </select>
    );
  }

  function renderCampo(param) {
    const valor = form[param.original_name] ?? "";

    if (param.inferred_type === "date") {
      return (
        <input
          type="date"
          className="preview-input"
          value={valor}
          onChange={(e) => atualizarCampo(param.original_name, e.target.value)}
        />
      );
    }

    if (param.semantic_key === "empresa") {
      return renderSelect(
        opcoes.empresas,
        valor,
        (e) => atualizarCampo(param.original_name, Number(e.target.value)),
        "Selecione a empresa",
        "empresa"
      );
    }

    if (param.semantic_key === "vendedor") {
      return renderSelect(
        opcoes.vendedores,
        valor,
        (e) => atualizarCampo(param.original_name, Number(e.target.value)),
        "Todos",
        "vendedor"
      );
    }

    if (param.semantic_key === "cliente") {
      return renderSelect(
        opcoes.clientes,
        valor,
        (e) => atualizarCampo(param.original_name, Number(e.target.value)),
        "Todos",
        "cliente"
      );
    }

    if (param.semantic_key === "natureza") {
      return renderSelect(
        opcoes.naturezas,
        valor,
        (e) => atualizarCampo(param.original_name, Number(e.target.value)),
        "Todas",
        "natureza"
      );
    }

    if (param.inferred_type === "int" || param.inferred_type === "number") {
      return (
        <input
          type="number"
          className="preview-input"
          value={valor}
          onChange={(e) =>
            atualizarCampo(
              param.original_name,
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />
      );
    }

    return (
      <input
        type="text"
        className="preview-input"
        value={valor}
        onChange={(e) => atualizarCampo(param.original_name, e.target.value)}
      />
    );
  }

  const totalRelatorios = relatoriosFiltrados.length;

  return (
    <div className="relatorios-lista-page">
      <div className="relatorios-lista-hero">
        <div className="relatorios-lista-hero-texto">
          <h1>{titulo}</h1>
          <p>
            Consulte os relatórios disponíveis, filtre pelo nome e abra o preview
            sem sair da tela.
          </p>
        </div>

        <div className="relatorios-lista-busca-box">
          <input
            type="text"
            className="relatorios-lista-busca"
            placeholder="Buscar relatório por nome, descrição ou pasta..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="relatorios-lista-resultado">
        {loadingLista
          ? "Carregando relatórios..."
          : `${totalRelatorios} relatório(s) encontrado(s)`}
      </div>

      {erroLista ? <div className="status-box erro">{erroLista}</div> : null}

      {!loadingLista && !erroLista && relatoriosFiltrados.length === 0 ? (
        <div className="status-box">Nenhum relatório encontrado.</div>
      ) : null}

      <div className="relatorios-lista-grid">
        {relatoriosFiltrados.map((relatorio) => (
          <div className="relatorio-lista-card" key={relatorio.cdarquivo}>
            <div className="relatorio-lista-card-topo">
              <div className="relatorio-lista-card-titulo-box">
                <h3>{relatorio.nome}</h3>

                <div className="relatorio-lista-tags">
                  {relatorio.pasta ? (
                    <span className="relatorio-lista-tag">
                      Pasta: {relatorio.pasta}
                    </span>
                  ) : null}

                  {relatorio.pasta_pai ? (
                    <span className="relatorio-lista-tag">
                      Grupo: {relatorio.pasta_pai}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relatorio-lista-acoes">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => abrirModalParametros(relatorio)}
                >
                  Visualizar
                </button>
              </div>
            </div>

            <div className="relatorio-lista-card-corpo">
              <div className="relatorio-lista-info-grid">
                <div className="relatorio-lista-info-item">
                  <span className="relatorio-lista-info-label">Código</span>
                  <strong>{relatorio.cdarquivo}</strong>
                </div>

                <div className="relatorio-lista-info-item">
                  <span className="relatorio-lista-info-label">
                    Última alteração
                  </span>
                  <strong>{formatarDataHora(relatorio.ultima_alteracao)}</strong>
                </div>
              </div>

              {relatorio.descricao ? (
                <p className="relatorio-lista-descricao">{relatorio.descricao}</p>
              ) : (
                <p className="relatorio-lista-descricao relatorio-lista-descricao-vazia">
                  Relatório sem descrição cadastrada.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        aberto={modalParametrosAberto}
        onFechar={() => {
          fecharModalParametros();
          limparEstadoModal();
        }}
        titulo={relatorioSelecionado?.nome || "Parâmetros do relatório"}
        subtitulo="Preencha os parâmetros para gerar o preview."
        largura="920px"
      >
        {loadingMeta ? (
          <div className="preview-hint">Carregando parâmetros...</div>
        ) : (
          <>
            <div className="preview-fields-grid">
              {parametros.map((param) => (
                <div className="preview-field" key={param.original_name}>
                  <label className="preview-label">{param.original_name}</label>
                  {renderCampo(param)}
                  <span className="preview-hint">
                    {param.semantic_key || param.inferred_type}
                  </span>
                </div>
              ))}
            </div>

            {erroModal ? (
              <div className="modal-error-box">{erroModal}</div>
            ) : null}

            <div className="modal-actions no-print">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  fecharModalParametros();
                  limparEstadoModal();
                }}
              >
                Fechar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={gerarPreview}
                disabled={loadingPreview}
              >
                {loadingPreview ? "Gerando preview..." : "Gerar preview"}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        aberto={modalPreviewAberto}
        onFechar={() => {
          fecharModalPreview();
          limparEstadoModal();
        }}
        titulo={relatorioSelecionado?.nome || "Preview do relatório"}
        subtitulo="Visualização do relatório pronta para conferência e impressão."
        largura="1280px"
      >
        {erroModal ? <div className="modal-error-box">{erroModal}</div> : null}

        <div className="modal-preview-toolbar no-print">
          <button type="button" className="btn-secondary" onClick={imprimirPreview}>
            Imprimir
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setModalPreviewAberto(false);
              setModalParametrosAberto(true);
            }}
          >
            Alterar parâmetros
          </button>
        </div>

        {previewData ? (
          <FastReportRenderer
            layout={detalhe?.layout_visual}
            linhas={previewData?.linhas || []}
            filtrosAplicados={filtrosAplicados}
            tituloRelatorio={relatorioSelecionado?.nome || "Preview do relatório"}
            totalRegistros={previewData?.total_registros || 0}
            detalhe={detalhe}
          />
        ) : (
          <div className="preview-hint">Nenhum preview gerado.</div>
        )}
      </Modal>
    </div>
  );
}