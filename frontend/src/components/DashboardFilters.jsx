import { useEffect, useState } from "react";
import "../styles/dashboard-filters.css";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getMonthStart() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function DashboardFilters({ onChange }) {
  const [period, setPeriod] = useState("today");
  const [type, setType] = useState("faturamento");
  const [start, setStart] = useState(getMonthStart());
  const [end, setEnd] = useState(getToday());

  function emitFilters(nextPeriod, nextType, nextStart, nextEnd) {
    if (onChange) {
      onChange({
        period: nextPeriod,
        type: nextType,
        start: nextPeriod === "custom" ? nextStart : null,
        end: nextPeriod === "custom" ? nextEnd : null,
      });
    }
  }

  function changePeriod(value) {
    setPeriod(value);
    emitFilters(value, type, start, end);
  }

  function changeType(value) {
    setType(value);
    emitFilters(period, value, start, end);
  }

  function changeStart(value) {
    setStart(value);
    emitFilters(period, type, value, end);
  }

  function changeEnd(value) {
    setEnd(value);
    emitFilters(period, type, start, value);
  }

  useEffect(() => {
    emitFilters(period, type, start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard-filters">
      <div className="filters-left">
        <div className="filter-title">Período:</div>

        <div className="filter-buttons">
          <button
            type="button"
            className={`filter-btn ${period === "today" ? "active" : ""}`}
            onClick={() => changePeriod("today")}
          >
            Hoje
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "yesterday" ? "active" : ""}`}
            onClick={() => changePeriod("yesterday")}
          >
            Ontem
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "week" ? "active" : ""}`}
            onClick={() => changePeriod("week")}
          >
            Esta Semana
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "month" ? "active" : ""}`}
            onClick={() => changePeriod("month")}
          >
            Este Mês
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "previousMonth" ? "active" : ""}`}
            onClick={() => changePeriod("previousMonth")}
          >
            Mês Anterior
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "year" ? "active" : ""}`}
            onClick={() => changePeriod("year")}
          >
            Este Ano
          </button>

          <button
            type="button"
            className={`filter-btn ${period === "custom" ? "active" : ""}`}
            onClick={() => changePeriod("custom")}
          >
            Personalizado
          </button>
        </div>

        {period === "custom" && (
          <div className="custom-date-range">
            <div className="custom-date-field">
              <label htmlFor="start-date">Data inicial</label>
              <input
                id="start-date"
                type="date"
                value={start}
                onChange={(e) => changeStart(e.target.value)}
              />
            </div>

            <div className="custom-date-field">
              <label htmlFor="end-date">Data final</label>
              <input
                id="end-date"
                type="date"
                value={end}
                onChange={(e) => changeEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="filters-right">
        <label htmlFor="tipo" className="filter-label">
          Tipo:
        </label>

        <select
          id="tipo"
          className="filter-select"
          value={type}
          onChange={(e) => changeType(e.target.value)}
        >
          <option value="faturamento">Faturamento</option>
          <option value="pedidos">Pedidos</option>
          <option value="clientes">Clientes</option>
          <option value="lucro">Lucro</option>
        </select>
      </div>
    </div>
  );
}

export default DashboardFilters;