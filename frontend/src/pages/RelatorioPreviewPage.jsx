import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import {
  inspecionarRelatorio,
  obterOpcoesRelatorio,
  executarPreviewRelatorio,
} from "../services/relatoriosService";
import RelatorioPreviewTable from "../components/relatorios/RelatorioPreviewTable.jsx";
import "../styles/relatorios.css";
import "../styles/topbar.css";
import "../styles/relatorio-preview.css";
import "../styles/relatorio-table.css";

function extrairParametrosDoDetalhe(detalhe) {
  const queries = Array.isArray(detalhe?.queries) ? detalhe.queries : [];
  const unicos = new Map();

  for (const query of queries) {
    const parametros = Array.isArray(query?.parametros) ? query.parametros : [];

    for (const param of parametros) {
      const nomeOriginal = param?.name;
      const datatype = (param?.datatype || "").toLowerCase();

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
        } else if (datatype.includes("integer")) {
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

export default function RelatorioPreviewPage() {
  const [searchParams] = useSearchParams();

  const cdarquivo = searchParams.get("cdarquivo");
  const nome = searchParams.get("nome") || "Preview do relatório";

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [erro, setErro] = useState("");

  const [detalhe, setDetalhe] = useState(null);
  const [parametros, setParametros] = useState([]);
  const [opcoes, setOpcoes] = useState({});
  const [form, setForm] = useState({});
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    async function carregarMetadados() {
      try {
        setLoadingMeta(true);
        setErro("");

        if (!cdarquivo) {
          setErro("CDARQUIVO não informado.");
          return;
        }

        const detalheResp = await inspecionarRelatorio(cdarquivo);
        const opcoesResp = await obterOpcoesRelatorio(cdarquivo);

        const params =
          detalheResp.parameters_detected ||
          detalheResp.parametros_detectados ||
          extrairParametrosDoDetalhe(detalheResp);

        const valoresIniciais = {};
        for (const param of params) {
          valoresIniciais[param.original_name] = param.default_value ?? "";
        }

        setDetalhe(detalheResp);
        setParametros(params);
        setOpcoes(opcoesResp || {});
        setForm(valoresIniciais);
      } catch (error) {
        console.error(error);
        setErro(
          error?.response?.data?.detail ||
            "Erro ao carregar metadados do relatório."
        );
      } finally {
        setLoadingMeta(false);
      }
    }

    carregarMetadados();
  }, [cdarquivo]);

  const tituloPagina = useMemo(() => {
    return detalhe?.nome || nome;
  }, [detalhe, nome]);

  function atualizarCampo(nomeCampo, valor) {
    setForm((prev) => ({
      ...prev,
      [nomeCampo]: valor,
    }));
  }

  function renderSelect(lista = [], valor, onChange) {
    return (
      <select value={valor} onChange={onChange} className="preview-select">
        {lista.map((item, index) => {
          const value = item.VALUE ?? item.value;
          const label = item.LABEL ?? item.label;

          return (
            <option key={`${value}-${index}`} value={value}>
              {label}
            </option>
          );
        })}
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

    if (param.semantic_key === "empresa" && opcoes.empresas) {
      return renderSelect(opcoes.empresas, valor, (e) =>
        atualizarCampo(param.original_name, Number(e.target.value))
      );
    }

    if (param.semantic_key === "vendedor" && opcoes.vendedores) {
      return renderSelect(opcoes.vendedores, valor, (e) =>
        atualizarCampo(param.original_name, Number(e.target.value))
      );
    }

    if (param.semantic_key === "cliente" && opcoes.clientes) {
      return renderSelect(opcoes.clientes, valor, (e) =>
        atualizarCampo(param.original_name, Number(e.target.value))
      );
    }

    if (param.semantic_key === "natureza" && opcoes.naturezas) {
      return renderSelect(opcoes.naturezas, valor, (e) =>
        atualizarCampo(param.original_name, Number(e.target.value))
      );
    }

    if (param.inferred_type === "int") {
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

  async function handleGerarPreview() {
    try {
      setLoadingPreview(true);
      setErro("");
      const result = await executarPreviewRelatorio(cdarquivo, form);
      setPreviewData(result);
    } catch (error) {
      console.error(error);
      setErro(
        error?.response?.data?.detail ||
          "Erro ao executar preview do relatório."
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleImprimir() {
    window.print();
  }

  return (
    <div className="preview-page">
      <Topbar
        titulo="Relatórios"
        caminho={`Dashboard / Relatórios / ${tituloPagina}`}
      />

      <div className="preview-hero-card">
        <div className="preview-hero-content">
          <div>
            <h1 className="preview-page-title">{tituloPagina}</h1>
            <p className="preview-page-subtitle">
              Relatório {cdarquivo ? `#${cdarquivo}` : ""}
            </p>
          </div>

          <div className="preview-page-actions no-print">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.close()}
            >
              Fechar
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleImprimir}
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {loadingMeta && <div className="status-box">Carregando filtros...</div>}
      {erro && <div className="status-box erro">{erro}</div>}

      {!loadingMeta && (
        <>
          <div className="preview-filtros-card no-print">
            <div className="preview-filtros-header">
              <div>
                <h2>Filtros do relatório</h2>
                <p>Preencha os campos abaixo para gerar o preview.</p>
              </div>
            </div>

            {parametros.length === 0 ? (
              <div className="status-box">
                Nenhum parâmetro detectado para este relatório.
              </div>
            ) : (
              <div className="preview-fields-grid">
                {parametros.map((param) => (
                  <div key={param.original_name} className="preview-field">
                    <label className="preview-label">{param.original_name}</label>
                    {renderCampo(param)}
                    <div className="preview-hint">
                      {param.semantic_key} • {param.inferred_type}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="preview-actions-row">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGerarPreview}
                disabled={loadingPreview}
              >
                {loadingPreview ? "Gerando..." : "Gerar preview"}
              </button>
            </div>
          </div>

          {previewData && (
            <div className="preview-page-card">
              <div className="preview-header">
                <h2>{previewData.nome || tituloPagina}</h2>
              </div>

              <RelatorioPreviewTable
                colunas={previewData.colunas || []}
                linhas={previewData.linhas || []}
                totalRegistros={previewData.total_registros || 0}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}