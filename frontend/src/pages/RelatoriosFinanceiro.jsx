import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosFinanceiro({ onToggleSidebar, isMobileOrTablet }) {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Relatorios"  onToggleSidebar={onToggleSidebar}
        isMobileOrTablet={isMobileOrTablet}/>
      <ListaRelatorios categoria="financeiro" titulo="Relatórios Financeiros" />
    </>
  );
}

export default RelatoriosFinanceiro;