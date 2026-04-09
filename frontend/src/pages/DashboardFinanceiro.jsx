import Topbar from "../components/Topbar";
import "../styles/dashboard.css";
import "../styles/topbar.css";

function DashboardFinanceiro() {
  return (
    <div className="dashboard-page">
      <Topbar titulo="Dashboard" caminho="Dashboard / Financeiro" />

      <div className="chart-box">
        <h3>Financeiro</h3>
        <div className="placeholder">Página inicial do dashboard financeiro</div>
      </div>
    </div>
  );
}

export default DashboardFinanceiro;