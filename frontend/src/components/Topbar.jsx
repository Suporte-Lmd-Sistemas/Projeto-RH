import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import "../styles/topbar.css";

function obterSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function obterPrimeiroNome(nome) {
  const texto = String(nome || "").trim();
  if (!texto) return "Usuário";
  return texto.split(" ")[0];
}

function obterIniciais(nome) {
  const texto = String(nome || "").trim();

  if (!texto) return "US";

  const partes = texto.split(" ").filter(Boolean);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0] || ""}${partes[1][0] || ""}`.toUpperCase();
}

export default function Topbar({
  titulo = "Dashboard",
  subtitulo = "",
  caminho = "",
  onToggleSidebar = () => {},
  isMobileOrTablet = false,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { empresas, empresaAtual, selecionarEmpresa, loadingEmpresas } = useEmpresa();

  const nomeUsuario = user?.nome || user?.login || "Usuário";
  const primeiroNome = useMemo(() => obterPrimeiroNome(nomeUsuario), [nomeUsuario]);
  const iniciais = useMemo(() => obterIniciais(nomeUsuario), [nomeUsuario]);
  const saudacao = useMemo(() => obterSaudacao(), []);

  function handleLogout() {
    logout();
    localStorage.removeItem("empresa_atual");
    navigate("/login", { replace: true });
  }

  function handleEmpresaChange(event) {
    const empresaId = Number(event.target.value);
    const empresa = empresas.find((item) => Number(item.id) === empresaId);

    if (empresa) {
      selecionarEmpresa(empresa);
    }
  }

  return (
    <header className="topbar-shell">
      <div className="topbar-main">
        <div className="topbar-title-area">
          {isMobileOrTablet && (
            <button
              type="button"
              className="topbar-menu-button"
              onClick={onToggleSidebar}
              aria-label="Abrir menu"
            >
              ☰
            </button>
          )}

          <div className="topbar-title-block">
            <div className="topbar-path">{caminho || `Olá ${primeiroNome}!`}</div>

            <h1 className="topbar-title">{titulo}</h1>

            <p className="topbar-subtitle">
              {subtitulo || `${saudacao}, ${primeiroNome}`}
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="topbar-company-group">
            <label htmlFor="empresa-topbar" className="topbar-company-label">
              Empresa ativa
            </label>

            <select
              id="empresa-topbar"
              value={empresaAtual?.id || ""}
              onChange={handleEmpresaChange}
              disabled={loadingEmpresas}
              className="topbar-company-select"
            >
              <option value="">
                {loadingEmpresas ? "Carregando empresas..." : "Selecione a empresa"}
              </option>

              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome_exibicao}
                </option>
              ))}
            </select>
          </div>

          <div className="topbar-user-card">
            <div className="topbar-user-avatar">{iniciais}</div>

            <div className="topbar-user-info">
              <div className="topbar-user-name">{nomeUsuario}</div>
              <div className="topbar-user-role">
                {user?.perfil || "Usuário autenticado"}
              </div>
            </div>
          </div>

          <button type="button" onClick={handleLogout} className="topbar-logout-button">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}