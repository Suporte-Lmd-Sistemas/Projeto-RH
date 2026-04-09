import "../styles/dashboard-filters.css";

function DashboardFilters() {
  return (
    <div className="dashboard-filters">
      <div className="filters-left">
        <div className="filter-title">Período:</div>

        <div className="filter-buttons">
          <button className="filter-btn active">Hoje</button>
          <button className="filter-btn">Ontem</button>
          <button className="filter-btn">Esta Semana</button>
          <button className="filter-btn">Este Mês</button>
          <button className="filter-btn">Mês Anterior</button>
          <button className="filter-btn">Este Ano</button>
          <button className="filter-btn">Personalizado</button>
        </div>
      </div>

      <div className="filters-right">
        <label htmlFor="tipo" className="filter-label">
          Tipo:
        </label>

        <select id="tipo" className="filter-select">
          <option>Faturamento</option>
          <option>Pedidos</option>
          <option>Clientes</option>
          <option>Lucro</option>
        </select>
      </div>
    </div>
  );
}

export default DashboardFilters;