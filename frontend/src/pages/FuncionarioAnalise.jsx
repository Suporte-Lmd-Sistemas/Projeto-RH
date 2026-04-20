import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import "../styles/dashboard.css";
import "../styles/topbar.css";
import "../styles/funcionario-analise.css";

const REGISTROS_POR_PAGINA = 500;

function FuncionarioAnalise() {
  const { id } = useParams();

  function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataHora(valor) {
    if (!valor) return "-";

    const texto = String(valor).trim();

    const match = texto.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/
    );

    if (!match) return texto;

    const [, ano, mes, dia, hora, minuto, segundo] = match;

    if (hora) {
      return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
    }

    return `${dia}/${mes}/${ano}`;
  }

  const hoje = obterDataHoje();

  const [funcionario, setFuncionario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [ordemSelecionada, setOrdemSelecionada] = useState("Horário");

  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [limitSelecionado, setLimitSelecionado] = useState("100");

  const [filtroTabelaSelecionada, setFiltroTabelaSelecionada] = useState("");
  const [filtroCardSelecionado, setFiltroCardSelecionado] = useState("TOTAL");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    dataInicial: hoje,
    dataFinal: hoje,
    limit: "100",
  });

  const [auditoria, setAuditoria] = useState([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);
  const [erroAuditoria, setErroAuditoria] = useState("");

  const limitesAuditoria = [
    { label: "100 registros", value: "100" },
    { label: "200 registros", value: "200" },
    { label: "500 registros", value: "500" },
    { label: "1000 registros", value: "1000" },
    { label: "2000 registros", value: "2000" },
    { label: "3000 registros", value: "3000" },
    { label: "5000 registros", value: "5000" },
  ];

  useEffect(() => {
    async function carregarFuncionario() {
      try {
        setLoading(true);

        const response = await api.get(`/funcionarios/${id}`);
        setFuncionario(response.data);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar o funcionário.");
      } finally {
        setLoading(false);
      }
    }

    if (id) carregarFuncionario();
  }, [id]);

  useEffect(() => {
    async function carregarAuditoria() {
      try {
        setLoadingAuditoria(true);

        const params = {
          limit: Number(filtrosAplicados.limit),
          data_inicial: filtrosAplicados.dataInicial,
          data_final: filtrosAplicados.dataFinal,
        };

        const response = await api.get(`/funcionarios/${id}/auditoria`, {
          params,
        });

        const registros = Array.isArray(response.data?.registros)
          ? response.data.registros
          : [];

        setAuditoria(registros);
        setPaginaAtual(1);
      } catch (error) {
        console.error(error);
        setErroAuditoria("Erro ao carregar auditoria.");
      } finally {
        setLoadingAuditoria(false);
      }
    }

    if (id) carregarAuditoria();
  }, [id, filtrosAplicados]);

  const resumoAuditoria = useMemo(() => {
    return {
      total: auditoria.length,
      inclusoes: auditoria.filter((i) => i.acao === "Inclusão").length,
      alteracoes: auditoria.filter((i) => i.acao === "Alteração").length,
      exclusoes: auditoria.filter((i) => i.acao === "Exclusão").length,
      cancelamentos: auditoria.filter((i) => i.acao === "Cancelamento").length,
    };
  }, [auditoria]);

  function pesquisarAuditoria() {
    setFiltrosAplicados({
      dataInicial,
      dataFinal,
      limit: limitSelecionado,
    });
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />
        <div className="analise-box">Carregando funcionário...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="dashboard-page">
        <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />
        <div className="analise-box analise-erro">{erro}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Topbar titulo="Análise de Produtividade" caminho="Dashboard / Auditoria" />

      {/* filtros */}

      <div className="analise-box analise-box-filtros">
        <div className="analise-filtros-data-inline">
          <div className="analise-filtro-data-item">
            <label>Data inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>

          <div className="analise-filtro-data-item">
            <label>Data final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>

          <div className="analise-filtro-data-item">
            <label>Quantidade</label>
            <select
              value={limitSelecionado}
              onChange={(e) => setLimitSelecionado(e.target.value)}
            >
              {limitesAuditoria.map((limite) => (
                <option key={limite.value} value={limite.value}>
                  {limite.label}
                </option>
              ))}
            </select>
          </div>

          <button className="analise-salvar-btn" onClick={pesquisarAuditoria}>
            Pesquisar
          </button>
        </div>
      </div>

      {/* cards */}

      <div className="auditoria-cards-grid">
        <div className="auditoria-card">
          <span>Total</span>
          <strong>{resumoAuditoria.total}</strong>
        </div>

        <div className="auditoria-card">
          <span>Inclusões</span>
          <strong>{resumoAuditoria.inclusoes}</strong>
        </div>

        <div className="auditoria-card">
          <span>Alterações</span>
          <strong>{resumoAuditoria.alteracoes}</strong>
        </div>

        <div className="auditoria-card">
          <span>Exclusões</span>
          <strong>{resumoAuditoria.exclusoes}</strong>
        </div>

        <div className="auditoria-card">
          <span>Cancelamentos</span>
          <strong>{resumoAuditoria.cancelamentos}</strong>
        </div>
      </div>

      {/* tabela */}

      <div className="analise-box">
        {loadingAuditoria && <div>Carregando auditoria...</div>}

        {!loadingAuditoria && auditoria.length === 0 && (
          <div>Nenhum registro encontrado.</div>
        )}

        {!loadingAuditoria && auditoria.length > 0 && (
          <table className="analise-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Tabela</th>
                <th>Campo</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((item, index) => (
                <tr key={index}>
                  <td>{formatarDataHora(item.data_lancamento)}</td>
                  <td>{item.acao}</td>
                  <td>{item.tabela_desc}</td>
                  <td>{item.campo_desc}</td>
                  <td>{item.descricao_registro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FuncionarioAnalise;