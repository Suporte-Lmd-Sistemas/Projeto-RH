import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dashboardOpen, setDashboardOpen] = useState(
    location.pathname.startsWith("/dashboard")
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (isMobile) {
      navigate("/dashboard/vendas");
      return;
    }

    setDashboardOpen((prev) => !prev);
  }

  return (
    <aside className={`sidebar ${isMobile ? "sidebar-mobile" : ""}`}>
      <div className="logo">
        <img src="/logo.png" alt="LMD Sistemas" className="logo-image" />
      </div>

      <nav className="sidebar-nav">
        <div className="menu-group">
          <button
            type="button"
            className={`menu-item ${isDashboardRoute ? "active" : ""}`}
            onClick={handleDashboardClick}
            title="Dashboard"
          >
            <span className="menu-icon">▦</span>
            {!isMobile && <span className="menu-label">Dashboard</span>}
          </button>

          {!isMobile && dashboardOpen && (
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
          title="Relatórios"
        >
          <span className="menu-icon">✉</span>
          {!isMobile && <span className="menu-label">Relatórios</span>}
        </Link>

        <Link
          to="/funcionarios"
          className={`menu-item ${isFuncionariosRoute ? "active" : ""}`}
          title="Funcionários"
        >
          <span className="menu-icon">👥</span>
          {!isMobile && <span className="menu-label">Funcionários</span>}
        </Link>

        <Link
          to="/performance"
          className={`menu-item ${isPerformanceRoute ? "active" : ""}`}
          title="Performance"
        >
          <span className="menu-icon">↗</span>
          {!isMobile && <span className="menu-label">Performance</span>}
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;