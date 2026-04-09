import Topbar from "../components/Topbar";
import "../styles/dashboard.css";
import "../styles/topbar.css";

function Performance() {
  return (
    <div className="dashboard-page">
      <Topbar titulo="Performance" caminho="Performance" />

      <div className="chart-box">
        <h3>Performance</h3>
        <div className="placeholder">
          Página inicial do módulo de performance
        </div>
      </div>
    </div>
  );
}

export default Performance;