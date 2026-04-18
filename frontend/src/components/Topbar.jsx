import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";

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
    <header
      style={{
        width: "100%",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        padding: "18px 28px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: 500,
            }}
          >
            {caminho || `Olá ${primeiroNome}!`}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#1e293b",
              letterSpacing: "-0.02em",
            }}
          >
            {titulo}
          </h1>

          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "14px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {subtitulo || `${saudacao}, ${primeiroNome}`}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              htmlFor="empresa-topbar"
              style={{
                fontSize: "12px",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Empresa ativa
            </label>

            <select
              id="empresa-topbar"
              value={empresaAtual?.id || ""}
              onChange={handleEmpresaChange}
              disabled={loadingEmpresas}
              style={{
                minWidth: "260px",
                height: "42px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                padding: "0 12px",
                fontSize: "14px",
                fontWeight: 600,
              }}
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "8px 12px",
              minWidth: "220px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "14px",
              }}
            >
              {iniciais}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nomeUsuario}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "2px",
                }}
              >
                {user?.perfil || "Usuário autenticado"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              height: "42px",
              padding: "0 16px",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#1e293b",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}