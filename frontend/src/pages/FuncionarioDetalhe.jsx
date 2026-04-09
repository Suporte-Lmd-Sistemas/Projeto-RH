import Topbar from "../components/Topbar";

function FuncionarioDetalhe() {
  return (
    <div className="dashboard-page">
      <Topbar titulo="Funcionário" caminho="Dashboard / Funcionários" />

      <div className="chart-box">
        Página de detalhe do funcionário
      </div>
    </div>
  );
}

export default FuncionarioDetalhe;