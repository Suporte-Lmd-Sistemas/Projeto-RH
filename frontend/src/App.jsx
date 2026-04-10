import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardVendas from "./pages/DashboardVendas";
import DashboardFinanceiro from "./pages/DashboardFinanceiro";
import DashboardMultiEmpresa from "./pages/DashboardMultiEmpresa";
import Relatorios from "./pages/Relatorios";
import RelatoriosVendas from "./pages/RelatoriosVendas";
import RelatoriosFinanceiro from "./pages/RelatoriosFinanceiro";
import RelatoriosConsultoria from "./pages/RelatoriosConsultoria";
import RelatoriosDiversos from "./pages/RelatoriosDiversos";
import Funcionarios from "./pages/Funcionarios";
import FuncionarioDetalhe from "./pages/FuncionarioDetalhe";
import FuncionarioAnalise from "./pages/FuncionarioAnalise";
import Performance from "./pages/Performance";

function App() {
  return (
    <div>
      <Sidebar />

      <div style={{ marginLeft: "240px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/vendas" replace />} />

          <Route path="/dashboard/vendas" element={<DashboardVendas />} />
          <Route path="/dashboard/financeiro" element={<DashboardFinanceiro />} />
          <Route path="/dashboard/multiempresa" element={<DashboardMultiEmpresa />} />

          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios/vendas" element={<RelatoriosVendas />} />
          <Route path="/relatorios/financeiro" element={<RelatoriosFinanceiro />} />
          <Route path="/relatorios/consultoria" element={<RelatoriosConsultoria />} />
          <Route path="/relatorios/diversos" element={<RelatoriosDiversos />} />

          <Route path="/funcionarios" element={<Funcionarios />} />
          <Route path="/funcionarios/:id" element={<FuncionarioDetalhe />} />
          <Route path="/funcionarios/:id/analise" element={<FuncionarioAnalise />} />

          <Route path="/performance" element={<Performance />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;