import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { listarEmpresas } from "../services/empresaService";
import { useAuth } from "./AuthContext";

const EmpresaContext = createContext(null);

export function EmpresaProvider({ children }) {
  const { isAuthenticated, loadingAuth } = useAuth();

  const [empresas, setEmpresas] = useState([]);
  const [empresaAtual, setEmpresaAtual] = useState(() => {
    const saved = localStorage.getItem("empresa_atual");
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  useEffect(() => {
    async function carregarEmpresas() {
      try {
        setLoadingEmpresas(true);

        const data = await listarEmpresas();
        const lista = Array.isArray(data) ? data : [];

        setEmpresas(lista);

        if (!lista.length) {
          setEmpresaAtual(null);
          localStorage.removeItem("empresa_atual");
          return;
        }

        const empresaSalva = localStorage.getItem("empresa_atual");
        const empresaSalvaObj = empresaSalva ? JSON.parse(empresaSalva) : null;

        if (empresaSalvaObj) {
          const empresaEncontrada = lista.find(
            (item) => Number(item.id) === Number(empresaSalvaObj.id)
          );

          if (empresaEncontrada) {
            setEmpresaAtual(empresaEncontrada);
            localStorage.setItem("empresa_atual", JSON.stringify(empresaEncontrada));
            return;
          }
        }

        const primeiraEmpresa = lista[0];
        setEmpresaAtual(primeiraEmpresa);
        localStorage.setItem("empresa_atual", JSON.stringify(primeiraEmpresa));
      } catch (error) {
        console.error("Erro ao carregar empresas:", error);
        setEmpresas([]);
        setEmpresaAtual(null);
        localStorage.removeItem("empresa_atual");
      } finally {
        setLoadingEmpresas(false);
      }
    }

    if (loadingAuth) {
      return;
    }

    if (!isAuthenticated) {
      setEmpresas([]);
      setEmpresaAtual(null);
      localStorage.removeItem("empresa_atual");
      return;
    }

    carregarEmpresas();
  }, [isAuthenticated, loadingAuth]);

  function selecionarEmpresa(empresa) {
    setEmpresaAtual(empresa);
    localStorage.setItem("empresa_atual", JSON.stringify(empresa));
  }

  const value = useMemo(
    () => ({
      empresas,
      empresaAtual,
      selecionarEmpresa,
      loadingEmpresas,
    }),
    [empresas, empresaAtual, loadingEmpresas]
  );

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);

  if (!context) {
    throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider");
  }

  return context;
}