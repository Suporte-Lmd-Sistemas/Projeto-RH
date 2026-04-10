import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import api from "../services/api";
import "../styles/dashboard.css";
import "../styles/topbar.css";

function Performance() {
  const [filtroAcao, setFiltroAcao] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [departamentos, setDepartamentos] = useState([]);
  const [dadosPerformance, setDadosPerformance] = useState({
    resumo: {
      total: 0,
      inclusoes: 0,
      alteracoes: 0,
      exclusoes: 0,
      cancelamentos: 0,
    },
    produtividade: {
      dias_com_atividade: 0,
      media_por_dia: 0,
      hora_mais_ativa: "-",
      tabela_mais_movimentada: "-",
    },
    acoes_por_dia: [],
    acoes_por_horario: [],
    ranking_funcionarios: [],
    tabela_resumo: [],
    registros: [],
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const maiorDia = useMemo(() => {
    if (!dadosPerformance.acoes_por_dia.length) return 1;
    return Math.max(...dadosPerformance.acoes_por_dia.map((item) => item.total));
  }, [dadosPerformance.acoes_por_dia]);

  const maiorHora = useMemo(() => {
    if (!dadosPerformance.acoes_por_horario.length) return 1;
    return Math.max(...dadosPerformance.acoes_por_horario.map((item) => item.total));
  }, [dadosPerformance.acoes_por_horario]);

  const maiorRanking = useMemo(() => {
    if (!dadosPerformance.ranking_funcionarios.length) return 1;
    return Math.max(...dadosPerformance.ranking_funcionarios.map((item) => item.total));
  }, [dadosPerformance.ranking_funcionarios]);

  const distribuicaoAcoes = useMemo(() => {
    const total = dadosPerformance.resumo.total || 0;

    if (total === 0) {
      return [
        { label: "Inclusões", valor: 0, percentual: 0, classe: "dist-green" },
        { label: "Alterações", valor: 0, percentual: 0, classe: "dist-yellow" },
        { label: "Exclusões", valor: 0, percentual: 0, classe: "dist-red" },
        { label: "Cancelamentos", valor: 0, percentual: 0, classe: "dist-purple" },
      ];
    }

    return [
      {
        label: "Inclusões",
        valor: dadosPerformance.resumo.inclusoes,
        percentual: ((dadosPerformance.resumo.inclusoes / total) * 100).toFixed(1),
        classe: "dist-green",
      },
      {
        label: "Alterações",
        valor: dadosPerformance.resumo.alteracoes,
        percentual: ((dadosPerformance.resumo.alteracoes / total) * 100).toFixed(1),
        classe: "dist-yellow",
      },
      {
        label: "Exclusões",
        valor: dadosPerformance.resumo.exclusoes,
        percentual: ((dadosPerformance.resumo.exclusoes / total) * 100).toFixed(1),
        classe: "dist-red",
      },
      {
        label: "Cancelamentos",
        valor: dadosPerformance.resumo.cancelamentos,
        percentual: ((dadosPerformance.resumo.cancelamentos / total) * 100).toFixed(1),
        classe: "dist-purple",
      },
    ];
  }, [dadosPerformance.resumo]);

  const leituraExecutiva = useMemo(() => {
    const resumo = dadosPerformance.resumo;
    const produtividade = dadosPerformance.produtividade;

    let tipoPredominante = "sem predominância";
    const mapa = [
      { nome: "Inclusões", valor: resumo.inclusoes },
      { nome: "Alterações", valor: resumo.alteracoes },
      { nome: "Exclusões", valor: resumo.exclusoes },
      { nome: "Cancelamentos", valor: resumo.cancelamentos },
    ].sort((a, b) => b.valor - a.valor);

    if (mapa[0] && mapa[0].valor > 0) {
      tipoPredominante = mapa[0].nome;
    }

    const topFuncionario =
      dadosPerformance.ranking_funcionarios.length > 0
        ? dadosPerformance.ranking_funcionarios[0]
        : null;

    return {
      tipoPredominante,
      topFuncionario,
      mensagemVolume:
        resumo.total > 0
          ? `Foram identificadas ${resumo.total} ações no recorte analisado.`
          : "Nenhuma ação foi encontrada no recorte analisado.",
      mensagemProdutividade:
        produtividade.dias_com_atividade > 0
          ? `A operação apresentou atividade em ${produtividade.dias_com_atividade} dias, com média de ${produtividade.media_por_dia} ações por dia.`
          : "Não houve dias com atividade no período filtrado.",
    };
  }, [dadosPerformance]);

  async function carregarDepartamentos() {
    try {
      const response = await api.get("/departamentos/");
      setDepartamentos(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar departamentos:", error);
    }
  }

  async function carregarPerformance() {
    try {
      setCarregando(true);
      setErro("");

      const params = {};

      if (filtroAcao) {
        params.acao = filtroAcao;
      }

      if (filtroDepartamento) {
        params.departamento_id = filtroDepartamento;
      }

      if (dataInicial) {
        params.data_inicial = dataInicial;
      }

      if (dataFinal) {
        params.data_final = dataFinal;
      }

      const response = await api.get("/performance/visao-geral", { params });

      setDadosPerformance({
        resumo: response.data?.resumo || {
          total: 0,
          inclusoes: 0,
          alteracoes: 0,
          exclusoes: 0,
          cancelamentos: 0,
        },
        produtividade: response.data?.produtividade || {
          dias_com_atividade: 0,
          media_por_dia: 0,
          hora_mais_ativa: "-",
          tabela_mais_movimentada: "-",
        },
        acoes_por_dia: response.data?.acoes_por_dia || [],
        acoes_por_horario: response.data?.acoes_por_horario || [],
        ranking_funcionarios: response.data?.ranking_funcionarios || [],
        tabela_resumo: response.data?.tabela_resumo || [],
        registros: response.data?.registros || [],
      });
    } catch (error) {
      console.error("Erro ao carregar performance:", error);
      setErro("Não foi possível carregar os dados de performance.");
      setDadosPerformance({
        resumo: {
          total: 0,
          inclusoes: 0,
          alteracoes: 0,
          exclusoes: 0,
          cancelamentos: 0,
        },
        produtividade: {
          dias_com_atividade: 0,
          media_por_dia: 0,
          hora_mais_ativa: "-",
          tabela_mais_movimentada: "-",
        },
        acoes_por_dia: [],
        acoes_por_horario: [],
        ranking_funcionarios: [],
        tabela_resumo: [],
        registros: [],
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDepartamentos();
  }, []);

  useEffect(() => {
    carregarPerformance();
  }, [filtroAcao, filtroDepartamento, dataInicial, dataFinal]);

  function limparFiltros() {
    setFiltroAcao("");
    setFiltroDepartamento("");
    setDataInicial("");
    setDataFinal("");
  }

  return (
    <div className="dashboard-page performance-page">
      <Topbar titulo="Performance" caminho="Performance" />

      <div className="performance-header-clean">
        <div className="performance-header-text">
        
          <p>
            Acompanhe volume, produtividade, distribuição das ações e leitura
            gerencial da operação em um painel analítico mais visual.
          </p>
        </div>

        <div className="performance-header-stats">
          <div className="mini-stat-card">
            <span>Total monitorado</span>
            <strong>{dadosPerformance.resumo.total}</strong>
          </div>

          <div className="mini-stat-card">
            <span>Dias com atividade</span>
            <strong>{dadosPerformance.produtividade.dias_com_atividade}</strong>
          </div>

          <div className="mini-stat-card">
            <span>Hora mais ativa</span>
            <strong>{dadosPerformance.produtividade.hora_mais_ativa}</strong>
          </div>
        </div>
      </div>

      <div className="chart-box filter-panel">
        <div className="box-header-with-action">
          <h3>Filtros de análise</h3>

          <button className="btn-refresh" onClick={carregarPerformance} type="button">
            Atualizar painel
          </button>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Tipo de ação</label>
            <select value={filtroAcao} onChange={(e) => setFiltroAcao(e.target.value)}>
              <option value="">Todas</option>
              <option value="I">Inclusão</option>
              <option value="A">Alteração</option>
              <option value="E">Exclusão</option>
              <option value="C">Cancelamento</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Departamento</label>
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
            >
              <option value="">Todos</option>

              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Data inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Data final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="btn-clear" onClick={limparFiltros} type="button">
              Limpar filtros
            </button>
          </div>
        </div>

        {carregando && (
          <div className="status-message info-message">
            Carregando dados de performance...
          </div>
        )}

        {erro && !carregando && (
          <div className="status-message error-message">{erro}</div>
        )}
      </div>

      <div className="cards-grid cards-grid-5">
        <div className="card-kpi card-kpi-premium">
          <h3>Total de ações</h3>
          <p>{dadosPerformance.resumo.total}</p>
          <span>Indicador principal do painel</span>
        </div>

        <div className="card-kpi card-kpi-success">
          <h3>Inclusões</h3>
          <p>{dadosPerformance.resumo.inclusoes}</p>
          <span>Registros incluídos</span>
        </div>

        <div className="card-kpi card-kpi-warning">
          <h3>Alterações</h3>
          <p>{dadosPerformance.resumo.alteracoes}</p>
          <span>Atualizações realizadas</span>
        </div>

        <div className="card-kpi card-kpi-danger">
          <h3>Exclusões</h3>
          <p>{dadosPerformance.resumo.exclusoes}</p>
          <span>Registros excluídos</span>
        </div>

        <div className="card-kpi card-kpi-purple">
          <h3>Cancelamentos</h3>
          <p>{dadosPerformance.resumo.cancelamentos}</p>
          <span>Ações canceladas</span>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card-kpi card-kpi-soft">
          <h3>Dias com atividade</h3>
          <p>{dadosPerformance.produtividade.dias_com_atividade}</p>
          <span>Quantidade de dias com movimentação</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Média por dia</h3>
          <p>{dadosPerformance.produtividade.media_por_dia}</p>
          <span>Média de ações por dia com atividade</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Hora mais ativa</h3>
          <p>{dadosPerformance.produtividade.hora_mais_ativa}</p>
          <span>Faixa com maior concentração</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Tabela mais movimentada</h3>
          <p className="card-kpi-text">
            {dadosPerformance.produtividade.tabela_mais_movimentada}
          </p>
          <span>Maior incidência operacional</span>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-box large premium-box">
          <div className="section-title-row">
            <div>
              <h3>Evolução das ações por dia</h3>
              <p>Tendência diária da movimentação operacional</p>
            </div>
          </div>

          {dadosPerformance.acoes_por_dia.length === 0 ? (
            <div className="empty-state">
              Nenhum dado encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="simple-chart chart-tall">
              {dadosPerformance.acoes_por_dia.map((item) => (
                <div className="simple-bar-item" key={item.data_iso || item.dia}>
                  <div
                    className="simple-bar premium-bar"
                    style={{ height: `${(item.total / maiorDia) * 220}px` }}
                    title={`${item.dia} - ${item.total} ações`}
                  ></div>
                  <span>{item.dia}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-box premium-box">
          <div className="section-title-row">
            <div>
              <h3>Distribuição por tipo de ação</h3>
              <p>Participação percentual dentro do volume total</p>
            </div>
          </div>

          <div className="distribution-list">
            {distribuicaoAcoes.map((item) => (
              <div className="distribution-item" key={item.label}>
                <div className="distribution-header">
                  <span>{item.label}</span>
                  <strong>{item.percentual}%</strong>
                </div>

                <div className="distribution-bar-track">
                  <div
                    className={`distribution-bar-fill ${item.classe}`}
                    style={{ width: `${item.percentual}%` }}
                  ></div>
                </div>

                <small>{item.valor} registros</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-columns">
        <div className="chart-box premium-box">
          <div className="section-title-row">
            <div>
              <h3>Concentração por horário</h3>
              <p>Distribuição das ações ao longo do expediente</p>
            </div>
          </div>

          {dadosPerformance.acoes_por_horario.length === 0 ? (
            <div className="empty-state">
              Nenhum dado encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="simple-chart">
              {dadosPerformance.acoes_por_horario.map((item) => (
                <div className="simple-bar-item" key={item.hora}>
                  <div
                    className="simple-bar premium-bar"
                    style={{ height: `${(item.total / maiorHora) * 180}px` }}
                    title={`${item.hora} - ${item.total} ações`}
                  ></div>
                  <span>{item.hora}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-box premium-box">
          <div className="section-title-row">
            <div>
              <h3>Leitura executiva</h3>
              <p>Resumo analítico para leitura gerencial rápida</p>
            </div>
          </div>

          <div className="executive-insights">
            <div className="executive-insight-card">
              <span>Volume operacional</span>
              <strong>{leituraExecutiva.mensagemVolume}</strong>
            </div>

            <div className="executive-insight-card">
              <span>Produtividade</span>
              <strong>{leituraExecutiva.mensagemProdutividade}</strong>
            </div>

            <div className="executive-insight-card">
              <span>Tipo predominante</span>
              <strong>{leituraExecutiva.tipoPredominante}</strong>
            </div>

            <div className="executive-insight-card">
              <span>Destaque do período</span>
              <strong>
                {leituraExecutiva.topFuncionario
                  ? `${leituraExecutiva.topFuncionario.nome} lidera com ${leituraExecutiva.topFuncionario.total} ações.`
                  : "Sem colaborador de destaque no recorte atual."}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="two-columns">
        <div className="chart-box premium-box">
          <div className="section-title-row">
            <div>
              <h3>Ranking de colaboradores</h3>
              <p>Comparativo visual de volume por colaborador</p>
            </div>
          </div>

          {dadosPerformance.ranking_funcionarios.length === 0 ? (
            <div className="empty-state">
              Nenhum funcionário encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="ranking-visual-list">
              {dadosPerformance.ranking_funcionarios.map((item, index) => (
                <div className="ranking-visual-item" key={`${item.nome}-${index}`}>
                  <div className="ranking-visual-top">
                    <div>
                      <strong>{item.nome}</strong>
                      <span>{item.departamento || "-"}</span>
                    </div>
                    <div className="ranking-value">{item.total} ações</div>
                  </div>

                  <div className="ranking-bar-track">
                    <div
                      className="ranking-bar-fill"
                      style={{ width: `${(item.total / maiorRanking) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-box premium-box">
          <div className="section-title-row">
            <div>
              <h3>Resumo consolidado por colaborador</h3>
              <p>Visão executiva dos indicadores individuais</p>
            </div>
          </div>

          {dadosPerformance.tabela_resumo.length === 0 ? (
            <div className="empty-state">
              Nenhum dado encontrado para montar a tabela.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table premium-table">
                <thead>
                  <tr>
                    <th>Funcionário</th>
                    <th>Departamento</th>
                    <th>Total</th>
                    <th>Inclusões</th>
                    <th>Alterações</th>
                    <th>Exclusões</th>
                    <th>Cancelamentos</th>
                  </tr>
                </thead>

                <tbody>
                  {dadosPerformance.tabela_resumo.map((item) => (
                    <tr key={item.funcionario}>
                      <td>{item.funcionario}</td>
                      <td>{item.departamento || "-"}</td>
                      <td>{item.acoes}</td>
                      <td>{item.inclusoes}</td>
                      <td>{item.alteracoes}</td>
                      <td>{item.exclusoes}</td>
                      <td>{item.cancelamentos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Performance;