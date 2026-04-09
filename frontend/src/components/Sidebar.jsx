import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  const location = useLocation();

  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const isVendasRoute = location.pathname === "/dashboard/vendas";
  const isFinanceiroRoute = location.pathname === "/dashboard/financeiro";
  const isMultiempresaRoute = location.pathname === "/dashboard/multiempresa";
  const isRelatoriosRoute = location.pathname === "/relatorios";
  const isFuncionariosRoute = location.pathname === "/funcionarios";
  const isPerformanceRoute = location.pathname === "/performance";

  const [dashboardOpen, setDashboardOpen] = useState(isDashboardRoute);

  function toggleDashboard() {
    setDashboardOpen(!dashboardOpen);
  }

  return (
    <div className="sidebar">
      <div className="logo">
        <img src="\logo.png" alt="LMD Sistemas" />
        <strong></strong>
      </div>

      <nav>
        <div className="menu-group">
          <div
            className={`menu-item ${isDashboardRoute ? "active" : ""}`}
            onClick={toggleDashboard}
          >
            Dashboard
          </div>

          {dashboardOpen && (
            <div className="submenu">
              <Link
                to="/dashboard/vendas"
                className={`submenu-item ${isVendasRoute ? "submenu-item-active" : ""}`}
              >
                Vendas
              </Link>

              <Link
                to="/dashboard/financeiro"
                className={`submenu-item ${isFinanceiroRoute ? "submenu-item-active" : ""}`}
              >
                Financeiro
              </Link>

              <Link
                to="/dashboard/multiempresa"
                className={`submenu-item ${isMultiempresaRoute ? "submenu-item-active" : ""}`}
              >
                MultiEmpresa
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/relatorios"
          className={`menu-item ${isRelatoriosRoute ? "active" : ""}`}
        >
          Relatórios
        </Link>

        <Link
          to="/funcionarios"
          className={`menu-item ${isFuncionariosRoute ? "active" : ""}`}
        >
          Funcionários
        </Link>

        <Link
          to="/performance"
          className={`menu-item ${isPerformanceRoute ? "active" : ""}`}
        >
          Performance
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;