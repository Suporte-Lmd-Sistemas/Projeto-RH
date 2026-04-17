import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosFinanceiro() {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Financeiro" />
      <ListaRelatorios categoria="financeiro" titulo="Relatórios Financeiros" />
    </>
  );
}

export default RelatoriosFinanceiro;