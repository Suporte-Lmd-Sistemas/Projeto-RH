import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosConsultoria() {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Consultoria / Contabilidade" />
      <ListaRelatorios
        categoria="consultoria"
        titulo="Relatórios de Consultoria / Contabilidade"
      />
    </>
  );
}

export default RelatoriosConsultoria;