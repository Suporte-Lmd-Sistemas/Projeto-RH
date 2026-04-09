import Topbar from "../components/Topbar";
import "../styles/dashboard.css";
import "../styles/topbar.css";

function Relatorios() {
  return (
    <div className="dashboard-page">
      <Topbar titulo="Relatórios" caminho="Relatórios" />

      <div className="chart-box">
        <h3>Relatórios</h3>
        <div className="placeholder">
          Página inicial do módulo de relatórios
        </div>
      </div>
    </div>
  );
}

export default Relatorios;