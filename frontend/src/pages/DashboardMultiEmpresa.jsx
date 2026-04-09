import Topbar from "../components/Topbar";
import "../styles/dashboard.css";
import "../styles/topbar.css";

function DashboardMultiEmpresa() {
  return (
    <div className="dashboard-page">
      <Topbar titulo="Dashboard" caminho="Dashboard / MultiEmpresa" />

      <div className="chart-box">
        <h3>MultiEmpresa</h3>
        <div className="placeholder">Página inicial do dashboard multiempresa</div>
      </div>
    </div>
  );
}

export default DashboardMultiEmpresa;