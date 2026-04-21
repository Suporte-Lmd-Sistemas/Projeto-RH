import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar({
  isMobileOrTablet = false,
  isOpen = false,
  onClose = () => {},
}) {
  const location = useLocation();

  const [dashboardOpen, setDashboardOpen] = useState(
    location.pathname.startsWith("/dashboard")
  );

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard")) {
      setDashboardOpen(true);
    }
  }, [location.pathname]);

  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const isVendasRoute = location.pathname === "/dashboard/vendas";
  const isFinanceiroRoute = location.pathname === "/dashboard/financeiro";
  const isMultiempresaRoute = location.pathname === "/dashboard/multiempresa";
  const isRelatoriosRoute = location.pathname.startsWith("/relatorios");
  const isFuncionariosRoute = location.pathname.startsWith("/funcionarios");
  const isPerformanceRoute = location.pathname.startsWith("/performance");

  function handleDashboardClick() {
    setDashboardOpen((prev) => !prev);
  }

  function handleMobileNavigate() {
    if (isMobileOrTablet) {
      onClose();
    }
  }

  return (
    <aside
      className={`sidebar ${isMobileOrTablet ? "sidebar-overlay-mode" : ""} ${
        isOpen ? "sidebar-open" : ""
      }`}
    >
      <div className="logo">
        <img
          src="/logo-comprida.svg"
          alt="LMD Sistemas"
          className="sidebar-logo-full"
        />
        <img
          src="/logo-azul.svg"
          alt="LMD"
          className="sidebar-logo-icon"
        />
      </div>

      <nav className="sidebar-nav">
        <div className="menu-group">
          <button
            type="button"
            className={`menu-item ${isDashboardRoute ? "active" : ""}`}
            onClick={handleDashboardClick}
            title="Dashboard"
          >
            <span className="menu-icon" aria-hidden="true">
              <img src="/icons/painel.svg" alt="" />
            </span>
            <span className="menu-label">Dashboard</span>
          </button>

          {dashboardOpen && (
            <div className="submenu">
              <Link
                to="/dashboard/vendas"
                onClick={handleMobileNavigate}
                className={`submenu-item ${
                  isVendasRoute ? "submenu-item-active" : ""
                }`}
              >
                Vendas
              </Link>

              <Link
                to="/dashboard/financeiro"
                onClick={handleMobileNavigate}
                className={`submenu-item ${
                  isFinanceiroRoute ? "submenu-item-active" : ""
                }`}
              >
                Financeiro
              </Link>

              <Link
                to="/dashboard/multiempresa"
                onClick={handleMobileNavigate}
                className={`submenu-item ${
                  isMultiempresaRoute ? "submenu-item-active" : ""
                }`}
              >
                MultiEmpresa
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/relatorios"
          onClick={handleMobileNavigate}
          className={`menu-item ${isRelatoriosRoute ? "active" : ""}`}
          title="Relatórios"
        >
          <span className="menu-icon" aria-hidden="true">
            <img src="/icons/relatorio.svg" alt="" />
          </span>
          <span className="menu-label">Relatórios</span>
        </Link>

        <Link
          to="/funcionarios"
          onClick={handleMobileNavigate}
          className={`menu-item ${isFuncionariosRoute ? "active" : ""}`}
          title="Funcionários"
        >
          <span className="menu-icon" aria-hidden="true">
            <img src="/icons/funcionario.svg" alt="" />
          </span>
          <span className="menu-label">Funcionários</span>
        </Link>

        <Link
          to="/performance"
          onClick={handleMobileNavigate}
          className={`menu-item ${isPerformanceRoute ? "active" : ""}`}
          title="Performance"
        >
          <span className="menu-icon" aria-hidden="true">
            <img src="/icons/performance.svg" alt="" />
          </span>
          <span className="menu-label">Performance</span>
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;