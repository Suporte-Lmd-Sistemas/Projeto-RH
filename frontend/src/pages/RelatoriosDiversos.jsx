import Topbar from "../components/Topbar";
import ListaRelatorios from "../components/ListaRelatorios.jsx";
import "../styles/topbar.css";

function RelatoriosDiversos() {
  return (
    <>
      <Topbar titulo="Relatórios" caminho="Dashboard / Diversos" />
      <ListaRelatorios categoria="diversos" titulo="Relatórios Diversos" />
    </>
  );
}

export default RelatoriosDiversos;