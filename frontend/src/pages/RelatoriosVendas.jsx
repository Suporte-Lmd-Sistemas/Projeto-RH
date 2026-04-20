import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosVendas() {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Relatorios" />
      <ListaRelatorios categoria="vendas" titulo="Relatórios de Vendas" />
    </>
  );
}

export default RelatoriosVendas;