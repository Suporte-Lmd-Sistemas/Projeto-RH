import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Topbar from "../components/Topbar";
import DashboardFilters from "../components/DashboardFilters";
import api from "../services/api";
import { useEmpresa } from "../context/EmpresaContext";
import "../styles/dashboard.css";
import "../styles/topbar.css";
import "../styles/dashboard-vendas.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

const COLORS = [
  "#2563eb",
  "#60a5fa",
  "#7c3aed",
  "#a78bfa",
  "#16a34a",
  "#4ade80",
  "#f59e0b",
  "#fbbf24",
  "#ef4444",
  "#fb7185",
  "#0ea5e9",
  "#14b8a6",
  "#8b5cf6",
  "#22c55e",
];

const MONTH_ORDER = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function CustomTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="vendas-tooltip">
      {label ? <div className="vendas-tooltip-title">{label}</div> : null}

      {payload.map((entry, index) => (
        <div className="vendas-tooltip-row" key={`${entry.name}-${index}`}>
          <span
            className="vendas-tooltip-dot"
            style={{ backgroundColor: entry.color || "#2563eb" }}
          />
          <span className="vendas-tooltip-label">{entry.name}</span>
          <strong className="vendas-tooltip-value">
            {currency ? formatCurrency(entry.value) : formatNumber(entry.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function preparePieData(items = [], limit = 8) {
  const normalized = items
    .map((item) => ({
      label: item.label || "Nao informado",
      valor: Number(item.valor || 0),
    }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  if (!normalized.length) {
    return [];
  }

  const topItems = normalized.slice(0, limit);
  const others = normalized.slice(limit);
  const othersTotal = others.reduce((sum, item) => sum + item.valor, 0);

  const merged = othersTotal > 0
    ? [...topItems, { label: "Outros", valor: othersTotal }]
    : topItems;

  const total = merged.reduce((sum, item) => sum + item.valor, 0);

  return merged.map((item, index) => ({
    ...item,
    percent: total > 0 ? (item.valor / total) * 100 : 0,
    color: COLORS[index % COLORS.length],
  }));
}

function DashboardVendas() {
  const { empresaAtual } = useEmpresa();

  const [filters, setFilters] = useState({
    period: "today",
    type: "faturamento",
    start: null,
    end: null,
  });

  const [dashboardData, setDashboardData] = useState({
    resumo: {
      faturamento: 0,
      pedidos: 0,
      ticketMedio: 0,
      variation: "Sem base anterior",
    },
    historico: [],
    topClientes: [],
    topProdutos: [],
    vendasPorCidade: [],
    vendasPorVendedor: [],
    vendasPorGrupo: [],
    vendasPorMarca: [],
    mediaPorFaixaHoraria: [],
    mediaPorDiaSemana: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleFilters(newFilters) {
    setFilters(newFilters);
  }

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("period", filters.period);
        params.set("type", filters.type);

        if (filters.period === "custom" && filters.start && filters.end) {
          params.set("start", filters.start);
          params.set("end", filters.end);
        }

        if (empresaAtual?.id) {
          params.set("empresa_id", String(empresaAtual.id));
        }

        const response = await api.get(`/api/dashboard/vendas?${params.toString()}`);
        const data = response.data;

        if (!ignore) {
          setDashboardData({
            resumo: data?.resumo ?? {
              faturamento: 0,
              pedidos: 0,
              ticketMedio: 0,
              variation: "Sem base anterior",
            },
            historico: data?.historico ?? [],
            topClientes: data?.topClientes ?? [],
            topProdutos: data?.topProdutos ?? [],
            vendasPorCidade: data?.vendasPorCidade ?? [],
            vendasPorVendedor: data?.vendasPorVendedor ?? [],
            vendasPorGrupo: data?.vendasPorGrupo ?? [],
            vendasPorMarca: data?.vendasPorMarca ?? [],
            mediaPorFaixaHoraria: data?.mediaPorFaixaHoraria ?? [],
            mediaPorDiaSemana: data?.mediaPorDiaSemana ?? [],
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Erro ao carregar dados.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (filters.period === "custom" && (!filters.start || !filters.end)) {
      return;
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [filters.period, filters.type, filters.start, filters.end, empresaAtual?.id]);

  const historicoMeta = useMemo(() => {
    const raw = dashboardData.historico || [];
    const years = [...new Set(raw.map((item) => Number(item?.ano || 0)).filter(Boolean))].sort(
      (a, b) => b - a
    );

    const anoAtual = years[0] || new Date().getFullYear();
    const anoAnterior = years[1] || anoAtual - 1;

    return { anoAtual, anoAnterior };
  }, [dashboardData.historico]);

  const historicoData = useMemo(() => {
    const raw = dashboardData.historico || [];
    if (!raw.length) return [];

    const hasYearData = raw.some((item) => item?.ano !== undefined && item?.ano !== null);

    if (!hasYearData) {
      return raw.map((item) => ({
        label: item.label,
        anoAtual: Number(item.valor || 0),
        anoAnterior: 0,
      }));
    }

    const years = [...new Set(raw.map((item) => Number(item.ano)).filter(Boolean))].sort((a, b) => b - a);
    const anoAtualRef = years[0] || new Date().getFullYear();
    const anoAnteriorRef = years[1] || anoAtualRef - 1;

    const grouped = {};

    MONTH_ORDER.forEach((month) => {
      grouped[month] = {
        label: month,
        anoAtual: 0,
        anoAnterior: 0,
      };
    });

    raw.forEach((item) => {
      const monthLabel = item.label;
      const ano = Number(item.ano || 0);
      const valor = Number(item.valor || 0);

      if (!grouped[monthLabel]) {
        grouped[monthLabel] = {
          label: monthLabel,
          anoAtual: 0,
          anoAnterior: 0,
        };
      }

      if (ano === anoAtualRef) {
        grouped[monthLabel].anoAtual = valor;
      } else if (ano === anoAnteriorRef) {
        grouped[monthLabel].anoAnterior = valor;
      }
    });

    return MONTH_ORDER.map((month) => grouped[month]).filter(Boolean);
  }, [dashboardData.historico]);

  const faixaData = useMemo(
    () =>
      (dashboardData.mediaPorFaixaHoraria || []).map((item) => ({
        ...item,
        valor: Number(item.valor || 0),
      })),
    [dashboardData.mediaPorFaixaHoraria]
  );

  const diaSemanaData = useMemo(
    () =>
      (dashboardData.mediaPorDiaSemana || []).map((item) => ({
        ...item,
        valor: Number(item.valor || 0),
      })),
    [dashboardData.mediaPorDiaSemana]
  );

  const grupoData = useMemo(
    () => preparePieData(dashboardData.vendasPorGrupo || [], 8),
    [dashboardData.vendasPorGrupo]
  );

  const marcaData = useMemo(
    () => preparePieData(dashboardData.vendasPorMarca || [], 8),
    [dashboardData.vendasPorMarca]
  );

  const maxClienteValor = useMemo(() => {
    if (!dashboardData.topClientes.length) return 1;
    return Math.max(...dashboardData.topClientes.map((item) => Number(item.valor || 0)), 1);
  }, [dashboardData.topClientes]);

  const maxVendedorValor = useMemo(() => {
    if (!dashboardData.vendasPorVendedor.length) return 1;
    return Math.max(
      ...dashboardData.vendasPorVendedor.map((item) => Number(item.valor || 0)),
      1
    );
  }, [dashboardData.vendasPorVendedor]);

  const maxCidadeQuantidade = useMemo(() => {
    if (!dashboardData.vendasPorCidade.length) return 1;
    return Math.max(
      ...dashboardData.vendasPorCidade.map((item) => Number(item.quantidade || 0)),
      1
    );
  }, [dashboardData.vendasPorCidade]);

  return (
    <div className="dashboard-page">
      <Topbar
        titulo="Dashboard de Vendas"
        caminho="Dashboard / Vendas"
        subtitulo="Visão geral das vendas e performance comercial"
      />

      <DashboardFilters onChange={handleFilters} />

      {loading && (
        <div className="status-message info-message">
          Carregando dados do ERP...
        </div>
      )}

      {error && (
        <div className="status-message error-message">
          {error}
        </div>
      )}

      <div className="cards-grid">
        <div className="card-kpi card-kpi-premium">
          <h3>Faturamento</h3>
          <p>{formatCurrency(dashboardData.resumo.faturamento)}</p>
          <span>Período selecionado</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Ticket Médio</h3>
          <p>{formatCurrency(dashboardData.resumo.ticketMedio)}</p>
          <span>Período selecionado</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Pedidos</h3>
          <p>{formatNumber(dashboardData.resumo.pedidos)}</p>
          <span>Período selecionado</span>
        </div>

        <div className="card-kpi card-kpi-soft">
          <h3>Variação</h3>
          <p className="card-kpi-text">{dashboardData.resumo.variation}</p>
          <span>Frente ao período anterior</span>
        </div>
      </div>

      <div className="chart-box large premium-box vendas-chart-card">
        <div className="vendas-box-header">
          <h3>
            Faturamento Anual - {historicoMeta.anoAtual} vs {historicoMeta.anoAnterior}
          </h3>
        </div>

        {historicoData.length ? (
          <ResponsiveContainer width="100%" height={330}>
            <AreaChart data={historicoData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAnoAtual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                </linearGradient>

                <linearGradient id="colorAnoAnterior" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#e9eef7" vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip currency />} />

              <Area
                type="monotone"
                dataKey="anoAtual"
                name={String(historicoMeta.anoAtual)}
                stroke="#2563eb"
                strokeWidth={2.6}
                fill="url(#colorAnoAtual)"
                dot={{ r: 3, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />

              <Area
                type="monotone"
                dataKey="anoAnterior"
                name={String(historicoMeta.anoAnterior)}
                stroke="#93c5fd"
                strokeWidth={2.3}
                fill="url(#colorAnoAnterior)"
                dot={{ r: 3, fill: "#93c5fd", stroke: "#ffffff", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">Nenhum dado encontrado para o histórico de vendas.</div>
        )}
      </div>

      <div className="two-columns">
        <div className="chart-box premium-box vendas-chart-card">
          <div className="vendas-box-header">
            <h3>Média por Faixa Horária</h3>
          </div>

          {faixaData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={faixaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaixa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e9eef7" vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="faixa"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip currency />} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Ticket Médio"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fill="url(#colorFaixa)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">Sem dados por faixa horária.</div>
          )}
        </div>

        <div className="chart-box premium-box vendas-chart-card">
          <div className="vendas-box-header">
            <h3>Média por Dia da Semana</h3>
          </div>

          {diaSemanaData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={diaSemanaData} barCategoryGap={22}>
                <CartesianGrid stroke="#e9eef7" vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip currency />} />
                <Bar
                  dataKey="valor"
                  name="Ticket Médio"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">Sem dados por dia da semana.</div>
          )}
        </div>
      </div>

      <div className="table-box premium-box">
        <div className="vendas-box-header">
          <h3>Produtos mais Vendidos</h3>
        </div>

        {dashboardData.topProdutos.length ? (
          <div className="table-responsive">
            <table className="custom-table premium-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.topProdutos.map((produto) => (
                  <tr key={`${produto.produto}-${produto.valor}`}>
                    <td>{produto.produto}</td>
                    <td>{formatNumber(produto.quantidade)}</td>
                    <td>{formatCurrency(produto.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Nenhum produto encontrado no período.</div>
        )}
      </div>

      <div className="two-columns">
        <div className="chart-box premium-box vendas-chart-card">
          <div className="vendas-box-header">
            <h3>Vendas por Grupo</h3>
          </div>

          {grupoData.length ? (
            <div className="vendas-pie-layout">
              <div className="vendas-pie-chart-side">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={grupoData}
                      dataKey="valor"
                      nameKey="label"
                      cx="42%"
                      outerRadius={95}
                      innerRadius={48}
                      paddingAngle={3}
                      labelLine={false}
                    >
                      {grupoData.map((entry) => (
                        <Cell key={`grupo-${entry.label}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip currency />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="vendas-pie-legend-side">
                <div className="vendas-pie-legend-list">
                  {grupoData.map((item) => (
                    <div className="vendas-pie-legend-item" key={`grupo-legenda-${item.label}`}>
                      <span
                        className="vendas-pie-legend-color"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="vendas-pie-legend-text">
                        <strong>{item.label}</strong>
                        <span>
                          {formatPercent(item.percent)} • {formatCurrency(item.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Nenhum grupo encontrado no período.</div>
          )}
        </div>

        <div className="chart-box premium-box vendas-chart-card">
          <div className="vendas-box-header">
            <h3>Vendas por Marcas</h3>
          </div>

          {marcaData.length ? (
            <div className="vendas-pie-layout">
              <div className="vendas-pie-chart-side">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={marcaData}
                      dataKey="valor"
                      nameKey="label"
                      cx="42%"
                      outerRadius={95}
                      innerRadius={48}
                      paddingAngle={3}
                      labelLine={false}
                    >
                      {marcaData.map((entry) => (
                        <Cell key={`marca-${entry.label}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip currency />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="vendas-pie-legend-side">
                <div className="vendas-pie-legend-list">
                  {marcaData.map((item) => (
                    <div className="vendas-pie-legend-item" key={`marca-legenda-${item.label}`}>
                      <span
                        className="vendas-pie-legend-color"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="vendas-pie-legend-text">
                        <strong>{item.label}</strong>
                        <span>
                          {formatPercent(item.percent)} • {formatCurrency(item.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Nenhuma marca encontrada no período.</div>
          )}
        </div>
      </div>

      <div className="two-columns">
        <div className="chart-box premium-box">
          <div className="vendas-box-header">
            <h3>Top Clientes</h3>
          </div>

          {dashboardData.topClientes.length ? (
            <div className="vendas-ranking-list">
              {dashboardData.topClientes.map((cliente) => {
                const width = (Number(cliente.valor || 0) / maxClienteValor) * 100;

                return (
                  <div className="vendas-ranking-item" key={cliente.nome}>
                    <div className="vendas-ranking-top">
                      <div className="vendas-ranking-main">
                        <strong>{cliente.nome}</strong>
                        <span>{formatNumber(cliente.pedidos)} pedidos</span>
                      </div>
                      <div className="vendas-ranking-value">
                        {formatCurrency(cliente.valor)}
                      </div>
                    </div>

                    <div className="vendas-progress-track">
                      <div
                        className="vendas-progress-fill blue"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">Nenhum cliente encontrado no período.</div>
          )}
        </div>

        <div className="chart-box premium-box">
          <div className="vendas-box-header">
            <h3>Vendas por Vendedor</h3>
          </div>

          {dashboardData.vendasPorVendedor.length ? (
            <div className="vendas-ranking-list">
              {dashboardData.vendasPorVendedor.map((vendedor) => {
                const width = (Number(vendedor.valor || 0) / maxVendedorValor) * 100;

                return (
                  <div
                    className="vendas-ranking-item"
                    key={`${vendedor.vendedor}-${vendedor.valor}`}
                  >
                    <div className="vendas-ranking-top">
                      <div className="vendas-ranking-main">
                        <strong>{vendedor.vendedor}</strong>
                        <span>{formatNumber(vendedor.pedidos)} pedidos</span>
                      </div>
                      <div className="vendas-ranking-value">
                        {formatCurrency(vendedor.valor)}
                      </div>
                    </div>

                    <div className="vendas-progress-track">
                      <div
                        className="vendas-progress-fill green"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">Nenhum vendedor encontrado no período.</div>
          )}
        </div>
      </div>

      <div className="chart-box premium-box">
        <div className="vendas-box-header">
          <h3>Vendas por Cidade</h3>
        </div>

        {dashboardData.vendasPorCidade.length ? (
          <div className="vendas-distribution-list">
            {dashboardData.vendasPorCidade.map((cidade) => {
              const width = (Number(cidade.quantidade || 0) / maxCidadeQuantidade) * 100;

              return (
                <div className="vendas-distribution-item" key={cidade.cidade}>
                  <div className="vendas-distribution-header">
                    <span>{cidade.cidade}</span>
                    <strong>{formatNumber(cidade.quantidade)}</strong>
                  </div>

                  <div className="vendas-progress-track">
                    <div
                      className="vendas-progress-fill purple"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">Nenhuma cidade encontrada no período.</div>
        )}
      </div>
    </div>
  );
}

export default DashboardVendas;