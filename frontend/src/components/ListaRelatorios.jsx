import { useEffect, useMemo, useState } from "react";
import { listarRelatorios } from "../services/relatoriosService";
import "../styles/relatorios-lista.css";

export default function ListaRelatorios({ categoria, titulo }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    carregar();
  }, [categoria]);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const data = await listarRelatorios(categoria);

      if (Array.isArray(data)) {
        setRelatorios(data);
      } else if (Array.isArray(data?.relatorios)) {
        setRelatorios(data.relatorios);
      } else if (Array.isArray(data?.items)) {
        setRelatorios(data.items);
      } else if (Array.isArray(data?.data)) {
        setRelatorios(data.data);
      } else {
        setRelatorios([]);
      }
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar relatórios.");
      setRelatorios([]);
    } finally {
      setLoading(false);
    }
  }

  function abrirPreview(relatorio) {
    try {
      const cdarquivo = relatorio.cdarquivo || relatorio.CDARQUIVO;
      const nome = relatorio.nome || relatorio.NOME || "Preview";

      const url = `/relatorios/preview?cdarquivo=${encodeURIComponent(
        cdarquivo
      )}&nome=${encodeURIComponent(nome)}`;

      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      setErro("Erro ao abrir página do preview.");
    }
  }

  const listaSegura = useMemo(() => {
    return Array.isArray(relatorios) ? relatorios : [];
  }, [relatorios]);

  const relatoriosFiltrados = useMemo(() => {
    const texto = filtro.toLowerCase().trim();

    return listaSegura.filter((item) => {
      const nome = String(item.nome || item.NOME || "").toLowerCase();
      const descricao = String(item.descricao || item.DESCRICAO || "").toLowerCase();
      const pasta = String(item.pasta || item.PASTA_NOME || "").toLowerCase();
      const pastaPai = String(item.pasta_pai || item.PASTA_PAI_NOME || "").toLowerCase();

      return (
        nome.includes(texto) ||
        descricao.includes(texto) ||
        pasta.includes(texto) ||
        pastaPai.includes(texto)
      );
    });
  }, [listaSegura, filtro]);

  return (
    <div className="relatorios-lista-page">
      <div className="relatorios-lista-hero">
        <div className="relatorios-lista-hero-texto">
          <h1>{titulo}</h1>
          <p>
            Selecione um relatório para visualizar os filtros e gerar o preview.
          </p>
        </div>

        <div className="relatorios-lista-busca-box">
          <input
            type="text"
            className="relatorios-lista-busca"
            placeholder="Buscar por nome, descrição ou pasta..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {!loading && !erro && (
        <div className="relatorios-lista-resultado">
          {relatoriosFiltrados.length} relatório(s) encontrado(s)
        </div>
      )}

      {loading && <div className="status-box">Carregando relatórios...</div>}
      {erro && <div className="status-box erro">{erro}</div>}

      {!loading && !erro && (
        <div className="relatorios-lista-grid">
          {relatoriosFiltrados.length === 0 ? (
            <div className="status-box">Nenhum relatório encontrado.</div>
          ) : (
            relatoriosFiltrados.map((relatorio) => {
              const chave = relatorio.cdarquivo || relatorio.CDARQUIVO;
              const nomeRelatorio = relatorio.nome || relatorio.NOME;
              const descricao = relatorio.descricao || relatorio.DESCRICAO;
              const pasta = relatorio.pasta || relatorio.PASTA_NOME || "-";
              const pastaPai = relatorio.pasta_pai || relatorio.PASTA_PAI_NOME || "-";
              const ultimaAlteracao =
                relatorio.ultima_alteracao || relatorio.ULTIMA_ALTERACAO || "-";

              return (
                <div className="relatorio-lista-card" key={chave}>
                  <div className="relatorio-lista-card-topo">
                    <div className="relatorio-lista-card-titulo-box">
                      <h3>{nomeRelatorio}</h3>

                      <div className="relatorio-lista-tags">
                        <span className="relatorio-lista-tag">Código: {chave}</span>
                        <span className="relatorio-lista-tag">Pasta: {pasta}</span>
                        <span className="relatorio-lista-tag">Pasta pai: {pastaPai}</span>
                      </div>
                    </div>

                    <div className="relatorio-lista-acoes">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => abrirPreview(relatorio)}
                      >
                        Visualizar
                      </button>
                    </div>
                  </div>

                  <div className="relatorio-lista-card-corpo">
                    <div className="relatorio-lista-info-grid">
                      <div className="relatorio-lista-info-item">
                        <span className="relatorio-lista-info-label">Última alteração</span>
                        <strong>{ultimaAlteracao}</strong>
                      </div>
                    </div>

                    {descricao ? (
                      <p className="relatorio-lista-descricao">{descricao}</p>
                    ) : (
                      <p className="relatorio-lista-descricao relatorio-lista-descricao-vazia">
                        Este relatório não possui descrição cadastrada.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}