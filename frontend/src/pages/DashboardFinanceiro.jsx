import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import "../styles/dashboard.css";
import "../styles/topbar.css";
import "../styles/financeiro-dashboard.css";

const PERIOD_OPTIONS = [
  {
    key: "today",
    label: "Hoje",
    description: "Leitura rapida do fechamento diario",
  },
  {
    key: "yesterday",
    label: "Ontem",
    description: "Comparativo do ultimo dia util",
  },
  {
    key: "week",
    label: "Esta Semana",
    description: "Visao consolidada da semana corrente",
  },
  {
    key: "month",
    label: "Este Mes",
    description: "Acompanhamento do mes em andamento",
  },
  {
    key: "previousMonth",
    label: "Mes Anterior",
    description: "Referencia fechada do ultimo mes",
  },
  {
    key: "year",
    label: "Este Ano",
    description: "Panorama acumulado do exercicio",
  },
  {
    key: "custom",
    label: "Personalizado",
    description: "Faixa livre para analise gerencial",
  },
];

const MAP_CONNECTIONS = [
  { x1: 312, y1: 202, x2: 338, y2: 214 },
  { x1: 312, y1: 202, x2: 318, y2: 182 },
  { x1: 312, y1: 202, x2: 290, y2: 248 },
  { x1: 312, y1: 202, x2: 270, y2: 176 },
  { x1: 290, y1: 248, x2: 268, y2: 286 },
];

const EMPTY_DATA = {
  contasPagar: {
    total: 0,
    variation: "-",
    subtitle: "Sem dados",
    highlight: "Sem dados",
    history: [],
  },
  contasReceber: {
    total: 0,
    variation: "-",
    subtitle: "Sem dados",
    highlight: "Sem dados",
    history: [],
  },
  inadimplencia: {
    taxa: 0,
    totalVencido: 0,
    totalReceber: 0,
    recuperadoMes: 0,
  },
  receitasDespesas: [],
  aging: [],
  melhoresClientes: [],
  melhoresFornecedores: [],
  estoqueCritico: [],
  cidadesClientes: [],
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}%`;
}

function getHeight(value, maxValue, maxHeight) {
  if (!maxValue) {
    return 0;
  }

  return Math.max((value / maxValue) * maxHeight, 18);
}

function DashboardFinanceiro() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("faturamento");
  const [empresaId, setEmpresaId] = useState("");
  const [customRange, setCustomRange] = useState({
    start: "2026-04-01",
    end: "2026-04-10",
  });

  const [financialData, setFinancialData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedPeriodData = useMemo(
    () => PERIOD_OPTIONS.find((option) => option.key === selectedPeriod) || PERIOD_OPTIONS[3],
    [selectedPeriod]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          period: selectedPeriod,
          type: selectedType,
        });

        if (selectedPeriod === "custom") {
          if (customRange.start) {
            params.append("start", customRange.start);
          }
          if (customRange.end) {
            params.append("end", customRange.end);
          }
        }

        if (empresaId) {
          params.append("empresa_id", empresaId);
        }

        const response = await fetch(
          `http://localhost:8000/api/dashboard/financeiro?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar o dashboard financeiro");
        }

        const data = await response.json();
        console.log("DADOS BACKEND:", data);

        if (!cancelled) {
          setFinancialData({
            ...EMPTY_DATA,
            ...data,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);

        if (!cancelled) {
          setError(err.message || "Falha ao carregar dados");
          setFinancialData(EMPTY_DATA);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedPeriod, selectedType, customRange.start, customRange.end, empresaId]);

  const totalReceitas = useMemo(
    () =>
      financialData.receitasDespesas.reduce((accumulator, item) => {
        return accumulator + Number(item.receitas || 0);
      }, 0),
    [financialData.receitasDespesas]
  );

  const totalDespesas = useMemo(
    () =>
      financialData.receitasDespesas.reduce((accumulator, item) => {
        return accumulator + Number(item.despesas || 0);
      }, 0),
    [financialData.receitasDespesas]
  );

  const saldoPeriodo = totalReceitas - totalDespesas;

  const maxReceitasDespesas = useMemo(() => {
    if (!financialData.receitasDespesas.length) {
      return 0;
    }

    return Math.max(
      ...financialData.receitasDespesas.flatMap((item) => [
        Number(item.receitas || 0),
        Number(item.despesas || 0),
      ])
    );
  }, [financialData.receitasDespesas]);

  const maxAging = useMemo(() => {
    if (!financialData.aging.length) {
      return 0;
    }

    return Math.max(...financialData.aging.map((item) => Number(item.valor || 0)));
  }, [financialData.aging]);

  const maxCliente = useMemo(() => {
    if (!financialData.melhoresClientes.length) {
      return 0;
    }

    return Math.max(
      ...financialData.melhoresClientes.map((item) => Number(item.valor || 0))
    );
  }, [financialData.melhoresClientes]);

  const maxFornecedor = useMemo(() => {
    if (!financialData.melhoresFornecedores.length) {
      return 0;
    }

    return Math.max(
      ...financialData.melhoresFornecedores.map((item) => Number(item.quantidade || 0))
    );
  }, [financialData.melhoresFornecedores]);

  const totalClientesCidades = useMemo(
    () =>
      financialData.cidadesClientes.reduce((accumulator, item) => {
        return accumulator + Number(item.quantidade || 0);
      }, 0),
    [financialData.cidadesClientes]
  );

  const percentualInadimplencia = useMemo(() => {
    if (!financialData.inadimplencia.totalReceber) {
      return 0;
    }

    return (
      (Number(financialData.inadimplencia.totalVencido || 0) /
        Number(financialData.inadimplencia.totalReceber || 0)) *
      100
    );
  }, [financialData.inadimplencia]);

  const customPeriodLabel =
    customRange.start && customRange.end
      ? `${customRange.start} a ${customRange.end}`
      : "Selecione a faixa";

  return (
    <div className="dashboard-page financial-dashboard-page">
      <Topbar titulo="Dashboard" caminho="Dashboard / Financeiro" />

      <section className="chart-box financial-filter-panel">
        <div className="financial-filter-top">
          <div>
            <span className="financial-section-kicker">Painel financeiro</span>
            <h3>Fluxo, inadimplencia e concentracao por carteira</h3>
            <p>
              Dashboard analitico com foco em faturamento, aging, carteira aberta e
              leitura gerencial por clientes, fornecedores e praca.
            </p>
          </div>

          <div className="financial-filter-meta">
            <div className="financial-meta-card">
              <span>Recorte ativo</span>
              <strong>
                {selectedPeriod === "custom" ? customPeriodLabel : selectedPeriodData.label}
              </strong>
            </div>

            <div className="financial-meta-card financial-meta-card--dark">
              <span>Modo</span>
              <strong>{selectedType === "faturamento" ? "Faturamento" : selectedType}</strong>
              <small>{loading ? "Carregando dados..." : "Dados integrados ao ERP"}</small>
            </div>
          </div>
        </div>

        <div className="financial-filter-row">
          <div className="financial-filter-group">
            <span className="financial-filter-label">Periodo</span>

            <div className="financial-chip-group">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  className={`financial-chip ${
                    selectedPeriod === option.key ? "financial-chip--active" : ""
                  }`}
                  key={option.key}
                  onClick={() => setSelectedPeriod(option.key)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="financial-filter-help">{selectedPeriodData.description}</p>
          </div>

          <div className="financial-filter-side">
            <div className="financial-select-group">
              <label htmlFor="financeiro-tipo">Tipo</label>
              <select
                id="financeiro-tipo"
                onChange={(event) => setSelectedType(event.target.value)}
                value={selectedType}
              >
                <option value="faturamento">Faturamento</option>
              </select>
            </div>

            <div className="financial-select-group">
              <label htmlFor="financeiro-empresa">Empresa</label>
              <input
                id="financeiro-empresa"
                type="number"
                value={empresaId}
                onChange={(event) => setEmpresaId(event.target.value)}
                placeholder="Todas"
              />
            </div>
          </div>
        </div>

        {selectedPeriod === "custom" && (
          <div className="financial-range-panel">
            <div className="financial-range-field">
              <label htmlFor="periodo-inicial">Data inicial</label>
              <input
                id="periodo-inicial"
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
                type="date"
                value={customRange.start}
              />
            </div>

            <div className="financial-range-field">
              <label htmlFor="periodo-final">Data final</label>
              <input
                id="periodo-final"
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
                type="date"
                value={customRange.end}
              />
            </div>
          </div>
        )}

        {error ? <p className="financial-filter-help">{error}</p> : null}
      </section>

      <section className="financial-top-grid">
        <article className="financial-kpi-card financial-kpi-card--payable">
          <div className="financial-kpi-header">
            <div>
              <span className="financial-kpi-tag">Saida prevista</span>
              <h3>Contas a Pagar</h3>
            </div>

            <span className="financial-kpi-pill financial-kpi-pill--warm">
              {financialData.contasPagar.variation}
            </span>
          </div>

          <strong className="financial-kpi-value">
            {formatCurrency(financialData.contasPagar.total)}
          </strong>

          <p className="financial-kpi-description">{financialData.contasPagar.subtitle}</p>

          <div className="financial-sparkline">
            {financialData.contasPagar.history.map((value, index) => (
              <div
                className="financial-sparkline-bar financial-sparkline-bar--payable"
                key={`payable-${index}`}
                style={{
                  height: `${getHeight(
                    value,
                    Math.max(...financialData.contasPagar.history, 1),
                    78
                  )}px`,
                }}
                title={`${value} pontos`}
              ></div>
            ))}
          </div>

          <div className="financial-kpi-footer">
            <span>{financialData.contasPagar.highlight}</span>
            <strong>{formatNumber(financialData.contasPagar.history.length)} pontos</strong>
          </div>
        </article>

        <article className="financial-kpi-card financial-kpi-card--receivable">
          <div className="financial-kpi-header">
            <div>
              <span className="financial-kpi-tag">Entrada prevista</span>
              <h3>Contas a Receber</h3>
            </div>

            <span className="financial-kpi-pill financial-kpi-pill--cool">
              {financialData.contasReceber.variation}
            </span>
          </div>

          <strong className="financial-kpi-value">
            {formatCurrency(financialData.contasReceber.total)}
          </strong>

          <p className="financial-kpi-description">
            {financialData.contasReceber.subtitle}
          </p>

          <div className="financial-sparkline">
            {financialData.contasReceber.history.map((value, index) => (
              <div
                className="financial-sparkline-bar financial-sparkline-bar--receivable"
                key={`receivable-${index}`}
                style={{
                  height: `${getHeight(
                    value,
                    Math.max(...financialData.contasReceber.history, 1),
                    78
                  )}px`,
                }}
                title={`${value} pontos`}
              ></div>
            ))}
          </div>

          <div className="financial-kpi-footer">
            <span>{financialData.contasReceber.highlight}</span>
            <strong>{formatNumber(financialData.contasReceber.history.length)} pontos</strong>
          </div>
        </article>

        <article className="financial-kpi-card financial-kpi-card--delinquency">
          <div className="financial-kpi-header">
            <div>
              <span className="financial-kpi-tag">Indicadores criticos</span>
              <h3>Inadimplencia</h3>
            </div>

            <span className="financial-kpi-pill financial-kpi-pill--alert">Acompanhamento</span>
          </div>

          <div className="financial-delinquency-rate">
            <strong>{formatPercent(financialData.inadimplencia.taxa)}</strong>
            <span>da carteira</span>
          </div>

          <p className="financial-kpi-description">
            Exposicao da carteira com leitura rapida entre valores em aberto, atrasados
            e recuperacao no mes.
          </p>

          <div className="financial-delinquency-grid">
            <div className="financial-delinquency-metric">
              <span>Total vencido</span>
              <strong>{formatCurrency(financialData.inadimplencia.totalVencido)}</strong>
            </div>

            <div className="financial-delinquency-metric">
              <span>Total a receber</span>
              <strong>{formatCurrency(financialData.inadimplencia.totalReceber)}</strong>
            </div>

            <div className="financial-delinquency-metric">
              <span>Recuperado</span>
              <strong>{formatCurrency(financialData.inadimplencia.recuperadoMes)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="financial-core-grid">
        <article className="chart-box financial-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Bloco central</span>
              <h3>Receitas x Despesas</h3>
              <p>Comparativo mensal da geracao de caixa contra a estrutura de custos.</p>
            </div>

            <div className="financial-summary-pills">
              <div className="financial-summary-pill">
                <span>Receitas</span>
                <strong>{formatCurrency(totalReceitas)}</strong>
              </div>

              <div className="financial-summary-pill">
                <span>Despesas</span>
                <strong>{formatCurrency(totalDespesas)}</strong>
              </div>

              <div className="financial-summary-pill financial-summary-pill--success">
                <span>Saldo</span>
                <strong>{formatCurrency(saldoPeriodo)}</strong>
              </div>
            </div>
          </div>

          <div className="financial-legend">
            <div className="financial-legend-item">
              <span className="financial-legend-dot financial-legend-dot--revenue"></span>
              Receitas
            </div>

            <div className="financial-legend-item">
              <span className="financial-legend-dot financial-legend-dot--expense"></span>
              Despesas
            </div>
          </div>

          <div className="table-responsive">
            <div className="financial-comparison-chart">
              {financialData.receitasDespesas.map((item) => (
                <div className="financial-month-group" key={item.label}>
                  <div className="financial-bar-pair">
                    <div
                      className="financial-bar financial-bar--revenue"
                      style={{
                        height: `${getHeight(item.receitas, maxReceitasDespesas, 214)}px`,
                      }}
                      title={`${item.label} - Receitas ${formatCurrency(item.receitas)}`}
                    ></div>

                    <div
                      className="financial-bar financial-bar--expense"
                      style={{
                        height: `${getHeight(item.despesas, maxReceitasDespesas, 214)}px`,
                      }}
                      title={`${item.label} - Despesas ${formatCurrency(item.despesas)}`}
                    ></div>
                  </div>

                  <div className="financial-month-values">
                    <strong className="financial-month-label">{item.label}</strong>
                    <span className="financial-month-meta">{formatCurrency(item.receitas)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="chart-box financial-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Bloco central</span>
              <h3>Analise de Aging</h3>
              <p>Leitura da concentracao da carteira por faixa de atraso e titulos a vencer.</p>
            </div>

            <div className="financial-summary-pill financial-summary-pill--alert">
              <span>Inadimplencia real</span>
              <strong>{formatPercent(percentualInadimplencia)}</strong>
            </div>
          </div>

          <div className="financial-aging-list">
            {financialData.aging.map((item) => (
              <div className="financial-aging-item" key={item.faixa}>
                <div className="financial-aging-copy">
                  <strong>{item.faixa}</strong>
                  <span>{formatNumber(item.titulos)} titulos</span>
                </div>

                <div className="financial-aging-track">
                  <div
                    className={`financial-aging-fill financial-aging-fill--${item.tone}`}
                    style={{ width: `${maxAging ? (item.valor / maxAging) * 100 : 0}%` }}
                  ></div>
                </div>

                <strong className="financial-aging-value">{formatCurrency(item.valor)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="financial-support-grid">
        <article className="chart-box financial-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Blocos inferiores</span>
              <h3>Melhores Clientes</h3>
              <p>Top 5 clientes com maior volume de compras no recorte atual.</p>
            </div>
          </div>

          <div className="financial-ranking-list">
            {financialData.melhoresClientes.map((item, index) => (
              <div className="financial-ranking-item" key={item.nome}>
                <div className="financial-ranking-head">
                  <div className="financial-ranking-title">
                    <span className="financial-ranking-position">{index + 1}</span>

                    <div className="financial-ranking-name">
                      <strong>{item.nome}</strong>
                      <span>{formatNumber(item.pedidos)} compras no periodo</span>
                    </div>
                  </div>

                  <strong className="financial-ranking-amount">
                    {formatCurrency(item.valor)}
                  </strong>
                </div>

                <div className="financial-ranking-track">
                  <div
                    className="financial-ranking-fill financial-ranking-fill--client"
                    style={{ width: `${maxCliente ? (item.valor / maxCliente) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-box financial-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Blocos inferiores</span>
              <h3>Melhores Fornecedores</h3>
              <p>Top 5 parceiros por quantidade de compras realizadas.</p>
            </div>
          </div>

          <div className="financial-ranking-list">
            {financialData.melhoresFornecedores.map((item, index) => (
              <div className="financial-ranking-item" key={item.nome}>
                <div className="financial-ranking-head">
                  <div className="financial-ranking-title">
                    <span className="financial-ranking-position financial-ranking-position--cool">
                      {index + 1}
                    </span>

                    <div className="financial-ranking-name">
                      <strong>{item.nome}</strong>
                      <span>Volume de {formatCurrency(item.volume)}</span>
                    </div>
                  </div>

                  <strong className="financial-ranking-amount">
                    {formatNumber(item.quantidade)} compras
                  </strong>
                </div>

                <div className="financial-ranking-track">
                  <div
                    className="financial-ranking-fill financial-ranking-fill--supplier"
                    style={{
                      width: `${maxFornecedor ? (item.quantidade / maxFornecedor) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="table-box financial-panel financial-stock-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Blocos inferiores</span>
              <h3>Produtos com estoque critico</h3>
              <p>Itens com cobertura abaixo do minimo operacional definido.</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table premium-table financial-stock-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Estoque</th>
                  <th>Minimo</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {financialData.estoqueCritico.map((item) => (
                  <tr key={item.produto}>
                    <td>{item.produto}</td>
                    <td>{formatNumber(item.estoque)}</td>
                    <td>{formatNumber(item.minimo)}</td>
                    <td>
                      <span
                        className={`financial-status-badge ${
                          item.status === "Critico"
                            ? "financial-status-badge--critical"
                            : item.status === "Reposicao"
                              ? "financial-status-badge--restock"
                              : "financial-status-badge--attention"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="financial-geo-grid">
        <article className="table-box financial-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Bloco final</span>
              <h3>Clientes por cidades</h3>
              <p>Distribuicao da base ativa nas principais pracas atendidas.</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table premium-table">
              <thead>
                <tr>
                  <th>Cidade</th>
                  <th>Quantidade</th>
                  <th>Participacao</th>
                </tr>
              </thead>

              <tbody>
                {financialData.cidadesClientes.map((item) => (
                  <tr key={item.cidade}>
                    <td>{item.cidade}</td>
                    <td>{formatNumber(item.quantidade)}</td>
                    <td>
                      {formatPercent(
                        totalClientesCidades
                          ? (item.quantidade / totalClientesCidades) * 100
                          : 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="chart-box financial-panel financial-map-panel">
          <div className="financial-panel-heading">
            <div>
              <span className="financial-panel-kicker">Bloco final</span>
              <h3>Mapa geografico</h3>
              <p>Concentracao dos clientes por praca com destaque para o eixo Sudeste.</p>
            </div>

            <div className="financial-summary-pill">
              <span>Pracas monitoradas</span>
              <strong>{formatNumber(financialData.cidadesClientes.length)}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <div className="financial-map-shell">
              <svg
                aria-label="Mapa de distribuicao de clientes"
                className="financial-map-svg"
                viewBox="0 0 520 340"
              >
                <path
                  className="financial-map-shape"
                  d="M129 78 L176 58 L216 72 L250 58 L292 78 L342 72 L392 102 L412 140 L402 190 L432 232 L406 278 L364 290 L338 314 L286 306 L250 280 L208 272 L178 242 L154 208 L146 170 L112 136 Z"
                />

                {MAP_CONNECTIONS.map((line, index) => (
                  <line
                    className="financial-map-connection"
                    key={`connection-${index}`}
                    x1={line.x1}
                    x2={line.x2}
                    y1={line.y1}
                    y2={line.y2}
                  />
                ))}

                {financialData.cidadesClientes.map((item) => (
                  <g key={item.cidade} transform={`translate(${item.x}, ${item.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      fill={item.cor}
                      fillOpacity="0.16"
                      r={16 + item.quantidade / 18}
                    />
                    <circle
                      cx="0"
                      cy="0"
                      fill="#ffffff"
                      r="12"
                      stroke={item.cor}
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="0" fill={item.cor} r="4.5" />
                    <text className="financial-map-label" x="18" y="5">
                      {item.cidade}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="financial-map-legend">
            {financialData.cidadesClientes.map((item) => (
              <div className="financial-map-legend-item" key={`legend-${item.cidade}`}>
                <div className="financial-map-legend-copy">
                  <span
                    className="financial-map-legend-dot"
                    style={{ backgroundColor: item.cor }}
                  ></span>

                  <div>
                    <strong>{item.cidade}</strong>
                    <span>
                      {formatPercent(
                        totalClientesCidades
                          ? (item.quantidade / totalClientesCidades) * 100
                          : 0
                      )}{" "}
                      da base
                    </span>
                  </div>
                </div>

                <strong className="financial-map-legend-value">
                  {formatNumber(item.quantidade)}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardFinanceiro;