import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosVendas({ onToggleSidebar, isMobileOrTablet }) {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Relatorios" onToggleSidebar={onToggleSidebar}
        isMobileOrTablet={isMobileOrTablet} />
      <ListaRelatorios categoria="vendas" titulo="Relatórios de Vendas" />
    </>
  );
}

export default RelatoriosVendas;