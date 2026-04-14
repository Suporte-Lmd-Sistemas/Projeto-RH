import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import FuncionarioCard from "../components/FuncionarioCard";
import api from "../services/api";
import "../styles/dashboard.css";
import "../styles/topbar.css";
import "../styles/funcionarios.css";

function Funcionarios() {
  const navigate = useNavigate();

  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState("nome");

  useEffect(() => {
    async function carregarFuncionarios() {
      try {
        setLoading(true);
        setErro("");

        const response = await api.get("/funcionarios/");
        const dados = Array.isArray(response.data) ? response.data : [];

        const funcionariosFormatados = dados.map((item) => ({
          rh_id: item.rh_id,
          col_pessoa: item.col_pessoa,
          nome: item.nome || "FUNCIONÁRIO SEM NOME",
          cargo_rh_nome: item.cargo_rh_nome || "",
          cargo_oficial: item.cargo_oficial || "Não informado",
          departamento_nome: item.departamento_nome || "Não informado",
          periodo: "Período Integral",
          status:
            item.status && item.status.trim() !== ""
              ? item.status
              : "Sem status",
        }));

        setFuncionarios(funcionariosFormatados);
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        setErro("Não foi possível carregar os funcionários da API.");
      } finally {
        setLoading(false);
      }
    }

    carregarFuncionarios();
  }, []);

  const departamentos = useMemo(() => {
    const lista = funcionarios.map((funcionario) => funcionario.departamento_nome);
    const unicos = [...new Set(lista)];
    return unicos.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [funcionarios]);

  const funcionariosFiltradosEOrdenados = useMemo(() => {
    let resultado = [...funcionarios];

    if (pesquisa.trim() !== "") {
      const texto = pesquisa.toLowerCase();

      resultado = resultado.filter((funcionario) => {
        const nome = String(funcionario.nome || "").toLowerCase();
        const idErp = String(funcionario.col_pessoa || "").toLowerCase();
        const departamento = String(funcionario.departamento_nome || "").toLowerCase();
        const cargo = String(
          funcionario.cargo_rh_nome || funcionario.cargo_oficial || ""
        ).toLowerCase();

        return (
          nome.includes(texto) ||
          idErp.includes(texto) ||
          departamento.includes(texto) ||
          cargo.includes(texto)
        );
      });
    }

    if (departamentoSelecionado !== "") {
      resultado = resultado.filter(
        (funcionario) => funcionario.departamento_nome === departamentoSelecionado
      );
    }

    if (ordemSelecionada === "nome") {
      resultado.sort((a, b) =>
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
      );
    }

    if (ordemSelecionada === "idErp") {
      resultado.sort(
        (a, b) => Number(a.col_pessoa || 0) - Number(b.col_pessoa || 0)
      );
    }

    return resultado;
  }, [funcionarios, pesquisa, departamentoSelecionado, ordemSelecionada]);

  return (
    <div className="dashboard-page">
      <Topbar titulo="Funcionários" caminho="Dashboard / Funcionários" />

      <div className="funcionarios-toolbar">
        <div className="funcionarios-toolbar-left">
          <input
            type="text"
            placeholder="Pesquisa"
            className="funcionarios-search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />

          <select
            className="funcionarios-select"
            value={departamentoSelecionado}
            onChange={(e) => setDepartamentoSelecionado(e.target.value)}
          >
            <option value="">Todos os departamentos</option>
            {departamentos.map((departamento) => (
              <option key={departamento} value={departamento}>
                {departamento}
              </option>
            ))}
          </select>

          <button className="funcionarios-filter-button" type="button">
            Setores
          </button>
        </div>

        <div className="funcionarios-toolbar-right">
          <div className="funcionarios-ordem-box">
            <span>Ordem:</span>
            <select
              className="funcionarios-select"
              value={ordemSelecionada}
              onChange={(e) => setOrdemSelecionada(e.target.value)}
            >
              <option value="nome">Nome</option>
              <option value="idErp">ID ERP</option>
            </select>
          </div>

          <button
            className="funcionarios-novo-vinculo"
            type="button"
            onClick={() => navigate("/funcionarios/novo")}
          >
            Novo vínculo
          </button>
        </div>
      </div>

      {loading && (
        <div className="funcionarios-mensagem">
          Carregando funcionários...
        </div>
      )}

      {!loading && erro && (
        <div className="funcionarios-mensagem erro">
          {erro}
        </div>
      )}

      {!loading && !erro && funcionariosFiltradosEOrdenados.length === 0 && (
        <div className="funcionarios-mensagem">
          Nenhum funcionário encontrado.
        </div>
      )}

      {!loading && !erro && funcionariosFiltradosEOrdenados.length > 0 && (
        <>
          <div className="funcionarios-grid">
            {funcionariosFiltradosEOrdenados.map((funcionario) => (
              <FuncionarioCard
                key={funcionario.rh_id}
                funcionario={funcionario}
              />
            ))}
          </div>

          <div className="funcionarios-footer">
            <div className="funcionarios-resultados">
              Mostrando {funcionariosFiltradosEOrdenados.length} resultado(s)
            </div>

            <div className="funcionarios-paginacao">
              <button className="pagina-btn" type="button">
                ‹
              </button>
              <button className="pagina-btn active" type="button">
                1
              </button>
              <button className="pagina-btn" type="button">
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Funcionarios;