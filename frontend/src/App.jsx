import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardVendas from "./pages/DashboardVendas";
import DashboardFinanceiro from "./pages/DashboardFinanceiro";
import DashboardMultiEmpresa from "./pages/DashboardMultiEmpresa";
import Relatorios from "./pages/Relatorios";
import RelatoriosVendas from "./pages/RelatoriosVendas";
import RelatorioPreviewPage from "./pages/RelatorioPreviewPage";
import RelatoriosFinanceiro from "./pages/RelatoriosFinanceiro";
import RelatoriosConsultoria from "./pages/RelatoriosConsultoria";
import RelatoriosDiversos from "./pages/RelatoriosDiversos";
import Funcionarios from "./pages/Funcionarios";
import FuncionarioNovoVinculo from "./pages/FuncionarioNovoVinculo";
import FuncionarioAnalise from "./pages/FuncionarioAnalise";
import FuncionarioDetalhe from "./pages/FuncionarioDetalhe";
import Performance from "./pages/Performance";
import PerformanceExclusoes from "./pages/PerformanceExclusoes";
import PerformanceInclusoes from "./pages/PerformanceInclusoes";
import PerformanceAlteracoes from "./pages/PerformanceAlteracoes";
import PerformanceCancelamentos from "./pages/PerformanceCancelamentos";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

function AppLayout() {
  return (
    <div>
      <Sidebar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/vendas" replace />} />

          <Route path="/dashboard/vendas" element={<DashboardVendas />} />
          <Route path="/dashboard/financeiro" element={<DashboardFinanceiro />} />
          <Route path="/dashboard/multiempresa" element={<DashboardMultiEmpresa />} />

          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios/vendas" element={<RelatoriosVendas />} />
          <Route path="/relatorios/preview" element={<RelatorioPreviewPage />} />
          <Route path="/relatorios/financeiro" element={<RelatoriosFinanceiro />} />
          <Route path="/relatorios/consultoria" element={<RelatoriosConsultoria />} />
          <Route path="/relatorios/diversos" element={<RelatoriosDiversos />} />

          <Route path="/funcionarios" element={<Funcionarios />} />
          <Route path="/funcionarios/novo" element={<FuncionarioNovoVinculo />} />
          <Route path="/funcionarios/:id/analise" element={<FuncionarioAnalise />} />
          <Route path="/funcionarios/:id" element={<FuncionarioDetalhe />} />

          <Route path="/performance" element={<Performance />} />
          <Route path="/performance/exclusoes" element={<PerformanceExclusoes />} />
          <Route path="/performance/inclusoes" element={<PerformanceInclusoes />} />
          <Route path="/performance/alteracoes" element={<PerformanceAlteracoes />} />
          <Route
            path="/performance/cancelamentos"
            element={<PerformanceCancelamentos />}
          />

          <Route path="*" element={<Navigate to="/dashboard/vendas" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function PrivateApp() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<PrivateApp />} />
    </Routes>
  );
}