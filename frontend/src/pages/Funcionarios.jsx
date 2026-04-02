import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Toolbar from "../components/Toolbar";
import TabelaFuncionarios from "../components/TabelaFuncionarios";
import FormFuncionario from "../components/FormFuncionario";
import Alerta from "../components/Alerta";
import ConfirmModal from "../components/ConfirmModal";
import ModalVincularFuncionario from "../components/ModalVincularFuncionario";
import {
  listarFuncionarios,
  listarColaboradoresERPDisponiveis,
  detalharFuncionario,
  criarFuncionario,
  atualizarFuncionario,
  excluirFuncionario,
  listarDepartamentos,
  listarCargos,
} from "../services/funcionariosService";

const ITENS_POR_PAGINA = 8;

export default function Funcionarios() {
  const [search, setSearch] = useState("");
  const [modo, setModo] = useState("lista");
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEdicao, setLoadingEdicao] = useState(false);
  const [loadingERP, setLoadingERP] = useState(false);
  const [error, setError] = useState("");
  const [funcionarioEdicao, setFuncionarioEdicao] = useState(null);
  const [setores, setSetores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [modalVinculoAberto, setModalVinculoAberto] = useState(false);
  const [colaboradoresERP, setColaboradoresERP] = useState([]);

  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome_asc");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [alerta, setAlerta] = useState({
    tipo: "",
    mensagem: "",
  });

  const [funcionarioExclusao, setFuncionarioExclusao] = useState(null);

  useEffect(() => {
    carregarFuncionarios();
    carregarListasAuxiliares();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [search, filtroDepartamento, filtroSetor, ordenacao]);

  async function carregarFuncionarios() {
    try {
      setLoading(true);
      setError("");

      const data = await listarFuncionarios();
      const lista = Array.isArray(data) ? data : [];

      const listaFormatada = lista.map((item, index) => ({
        id: item.rh_id ?? item.id ?? index + 1,
        rh_id: item.rh_id ?? item.id ?? index + 1,
        col_pessoa: item.col_pessoa ?? "",
        nome: item.nome ?? "",
        cpf: item.cpf ?? "",
        cargo_oficial: item.cargo_oficial ?? "",
        cargo_rh_id: item.cargo_rh_id ?? "",
        cargo_rh_nome: item.cargo_rh_nome ?? "",
        setor: item.departamento_nome ?? item.setor ?? "",
        setor_nome: item.setor_nome ?? item.setor ?? "",
        departamento_nome: item.departamento_nome ?? "",
        departamento_id: item.departamento_id ?? "",
        status: item.status ?? "Ativo",
        email: item.email ?? "",
        telefone: item.telefone ?? "",
        celular: item.celular ?? "",
        salario: item.salario ?? null,
        data_admissao: item.data_admissao ?? null,
        data_afastamento: item.data_afastamento ?? null,
        foto:
          item.pes_foto ??
          item.foto ??
          item.foto_url ??
          item.erp_foto ??
          null,
      }));

      setFuncionarios(listaFormatada);
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
      setError("Não foi possível carregar os funcionários da API.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarListasAuxiliares() {
    try {
      const [dadosSetores, dadosCargos] = await Promise.all([
        listarDepartamentos(),
        listarCargos(),
      ]);

      const listaSetores = Array.isArray(dadosSetores) ? dadosSetores : [];
      const listaCargos = Array.isArray(dadosCargos) ? dadosCargos : [];

      setSetores(
        listaSetores.map((item, index) => ({
          id: item.id ?? item.departamento_id ?? index + 1,
          nome: item.nome ?? item.departamento_nome ?? item.descricao ?? "",
        }))
      );

      setCargos(
        listaCargos.map((item, index) => ({
          id: item.id ?? item.cargo_id ?? index + 1,
          nome: item.nome ?? item.cargo_nome ?? item.descricao ?? "",
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar departamentos/cargos:", err);

      setSetores([
        { id: 1, nome: "RH" },
        { id: 2, nome: "Administrativo" },
        { id: 3, nome: "Financeiro" },
      ]);

      setCargos([
        { id: 1, nome: "Analista de RH" },
        { id: 2, nome: "Assistente Administrativo" },
        { id: 3, nome: "Gerente" },
      ]);
    }
  }

  const carregarColaboradoresERPDisponiveis = useCallback(async (textoBusca = "") => {
    try {
      setLoadingERP(true);

      const data = await listarColaboradoresERPDisponiveis(textoBusca);
      const lista = Array.isArray(data) ? data : [];
      setColaboradoresERP(lista);
    } catch (err) {
      console.error("Erro ao carregar colaboradores do ERP:", err);
      mostrarAlerta(
        "erro",
        "Não foi possível carregar os colaboradores disponíveis do ERP."
      );
    } finally {
      setLoadingERP(false);
    }
  }, []);

  const opcoesDepartamentos = useMemo(() => {
    const mapa = new Map();

    funcionarios.forEach((item) => {
      const value = String(item.departamento_nome || "").trim();
      if (value) {
        mapa.set(value, { value, label: value });
      }
    });

    setores.forEach((item) => {
      const value = String(item.nome || "").trim();
      if (value && !mapa.has(value)) {
        mapa.set(value, { value, label: value });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR")
    );
  }, [funcionarios, setores]);

  const opcoesSetores = useMemo(() => {
    const mapa = new Map();

    funcionarios.forEach((item) => {
      const value = String(item.setor_nome || item.setor || "").trim();
      if (value) {
        mapa.set(value, { value, label: value });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR")
    );
  }, [funcionarios]);

  const funcionariosFiltradosOrdenados = useMemo(() => {
    const textoBusca = String(search || "").toLowerCase().trim();

    const listaFiltrada = funcionarios.filter((f) => {
      const nome = String(f.nome || "").toLowerCase();
      const cpf = String(f.cpf || "").toLowerCase();
      const cargoERP = String(f.cargo_oficial || "").toLowerCase();
      const cargoRH = String(f.cargo_rh_nome || "").toLowerCase();
      const status = String(f.status || "").toLowerCase();
      const departamentoNome = String(f.departamento_nome || "").trim();
      const setorNome = String(f.setor_nome || f.setor || "").trim();

      const passouBusca =
        !textoBusca ||
        nome.includes(textoBusca) ||
        cpf.includes(textoBusca) ||
        cargoERP.includes(textoBusca) ||
        cargoRH.includes(textoBusca) ||
        status.includes(textoBusca);

      const passouDepartamento =
        !filtroDepartamento || departamentoNome === filtroDepartamento;

      const passouSetor = !filtroSetor || setorNome === filtroSetor;

      return passouBusca && passouDepartamento && passouSetor;
    });

    const listaOrdenada = [...listaFiltrada].sort((a, b) => {
      const nomeA = String(a.nome || "");
      const nomeB = String(b.nome || "");
      const statusA = String(a.status || "");
      const statusB = String(b.status || "");
      const departamentoA = String(a.departamento_nome || "");
      const departamentoB = String(b.departamento_nome || "");
      const setorA = String(a.setor_nome || a.setor || "");
      const setorB = String(b.setor_nome || b.setor || "");

      switch (ordenacao) {
        case "nome_desc":
          return nomeB.localeCompare(nomeA, "pt-BR");

        case "status_asc":
          return statusA.localeCompare(statusB, "pt-BR");

        case "departamento_asc":
          return departamentoA.localeCompare(departamentoB, "pt-BR");

        case "setor_asc":
          return setorA.localeCompare(setorB, "pt-BR");

        case "nome_asc":
        default:
          return nomeA.localeCompare(nomeB, "pt-BR");
      }
    });

    return listaOrdenada;
  }, [funcionarios, search, filtroDepartamento, filtroSetor, ordenacao]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(funcionariosFiltradosOrdenados.length / ITENS_POR_PAGINA)
  );

  const funcionariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    return funcionariosFiltradosOrdenados.slice(inicio, fim);
  }, [funcionariosFiltradosOrdenados, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function mostrarAlerta(tipo, mensagem) {
    setAlerta({ tipo, mensagem });
  }

  function fecharAlerta() {
    setAlerta({ tipo: "", mensagem: "" });
  }

  async function handleNovoFuncionario() {
    setModalVinculoAberto(true);
    await carregarColaboradoresERPDisponiveis("");
  }

  function fecharModalVinculo() {
    setModalVinculoAberto(false);
    setColaboradoresERP([]);
  }

  async function handleSalvarVinculo(dados) {
    try {
      await criarFuncionario(dados);

      mostrarAlerta("sucesso", "Colaborador vinculado ao RH com sucesso.");
      setModalVinculoAberto(false);

      await carregarFuncionarios();
    } catch (err) {
      console.error("Erro ao vincular colaborador:", err);
      console.error("Detalhes:", err.response?.data);

      mostrarAlerta(
        "erro",
        err.response?.data?.detail || "Não foi possível vincular o colaborador ao RH."
      );
    }
  }

  async function handleEditarFuncionario(funcionario) {
    try {
      setLoadingEdicao(true);
      setError("");

      const detalhe = await detalharFuncionario(funcionario.id);

      const dadosEdicao = {
        id: detalhe.rh_id,
        rh_id: detalhe.rh_id,
        col_pessoa: detalhe.col_pessoa ?? "",
        nome: detalhe.erp_pessoa?.PES_RSOCIAL_NOME ?? funcionario.nome ?? "",
        cpf: detalhe.erp_pessoa?.PES_CNPJ_CPF ?? funcionario.cpf ?? "",
        departamento_id: detalhe.departamento_id ?? "",
        setor: detalhe.departamento_nome ?? "",
        cargo_oficial: detalhe.cargo_oficial ?? "",
        cargo_rh_id: detalhe.cargo_rh_id ?? "",
        cargo_rh_nome: detalhe.cargo_rh_nome ?? "",
        status: detalhe.status_oficial ?? "",
        data_admissao: detalhe.data_admissao_oficial ?? "",
        salario: detalhe.salario_oficial ?? null,
      };

      setFuncionarioEdicao(dadosEdicao);
      setModo("cadastro");
    } catch (err) {
      console.error("Erro ao carregar detalhes do funcionário:", err);
      console.error("Detalhes:", err.response?.data);

      mostrarAlerta(
        "erro",
        "Não foi possível carregar os detalhes do colaborador para edição."
      );
    } finally {
      setLoadingEdicao(false);
    }
  }

  function handleCancelarCadastro() {
    setFuncionarioEdicao(null);
    setModo("lista");
  }

  async function handleSalvarFuncionario(dados) {
    if (!funcionarioEdicao) {
      mostrarAlerta(
        "erro",
        "No momento, esta tela permite apenas editar vínculos já existentes no RH."
      );
      return;
    }

    try {
      const payload = {
        departamento_id: Number(dados.departamento_id),
        cargo_id: dados.cargo_id ?? null,
      };

      await atualizarFuncionario(funcionarioEdicao.id, payload);

      mostrarAlerta("sucesso", "Vínculo do funcionário atualizado com sucesso.");

      setFuncionarioEdicao(null);
      setModo("lista");
      await carregarFuncionarios();
    } catch (err) {
      console.error("Erro ao salvar funcionário:", err);
      console.error("Detalhes:", err.response?.data);
      mostrarAlerta("erro", "Não foi possível atualizar o vínculo do funcionário.");
    }
  }

  function handleExcluirFuncionario(funcionario) {
    setFuncionarioExclusao(funcionario);
  }

  function cancelarExclusao() {
    setFuncionarioExclusao(null);
  }

  async function confirmarExclusao() {
    if (!funcionarioExclusao) {
      return;
    }

    try {
      await excluirFuncionario(funcionarioExclusao.id);
      mostrarAlerta("sucesso", "Vínculo do funcionário removido com sucesso.");
      setFuncionarioExclusao(null);
      await carregarFuncionarios();
    } catch (err) {
      console.error("Erro ao excluir funcionário:", err);
      console.error("Detalhes:", err.response?.data);
      mostrarAlerta("erro", "Não foi possível remover o vínculo do funcionário.");
      setFuncionarioExclusao(null);
    }
  }

  function paginaAnterior() {
    setPaginaAtual((pagina) => Math.max(1, pagina - 1));
  }

  function proximaPagina() {
    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1));
  }

  const totalResultados = funcionariosFiltradosOrdenados.length;
  const inicioResultado =
    totalResultados === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1;
  const fimResultado = Math.min(
    paginaAtual * ITENS_POR_PAGINA,
    totalResultados
  );

  return (
    <Layout title={modo === "lista" ? "Funcionários" : "Editar Funcionário"}>
      <div style={styles.pageContent}>
        <Alerta
          tipo={alerta.tipo}
          mensagem={alerta.mensagem}
          onFechar={fecharAlerta}
        />

        {modo === "lista" ? (
          <div style={styles.listagemContainer}>
            <div style={styles.toolbarContainer}>
              <Toolbar
                search={search}
                setSearch={setSearch}
                onNovo={handleNovoFuncionario}
                filtroDepartamento={filtroDepartamento}
                setFiltroDepartamento={setFiltroDepartamento}
                opcoesDepartamentos={opcoesDepartamentos}
                filtroSetor={filtroSetor}
                setFiltroSetor={setFiltroSetor}
                opcoesSetores={opcoesSetores}
                ordenacao={ordenacao}
                setOrdenacao={setOrdenacao}
              />
            </div>

            <div style={styles.resultadoContainer}>
              <TabelaFuncionarios
                funcionarios={funcionariosPaginados}
                loading={loading}
                error={error}
                onEditar={handleEditarFuncionario}
                onExcluir={handleExcluirFuncionario}
              />
            </div>

            {!loading && !error && (
              <div style={styles.paginationBar}>
                <div style={styles.paginationInfo}>
                  Mostrando {inicioResultado} a {fimResultado} de {totalResultados} resultado(s)
                </div>

                <div style={styles.paginationActions}>
                  <button
                    type="button"
                    onClick={paginaAnterior}
                    disabled={paginaAtual === 1}
                    style={{
                      ...styles.pageButton,
                      ...(paginaAtual === 1 ? styles.pageButtonDisabled : {}),
                    }}
                  >
                    Anterior
                  </button>

                  <div style={styles.pageIndicator}>
                    Página {paginaAtual} de {totalPaginas}
                  </div>

                  <button
                    type="button"
                    onClick={proximaPagina}
                    disabled={paginaAtual === totalPaginas}
                    style={{
                      ...styles.pageButton,
                      ...(paginaAtual === totalPaginas
                        ? styles.pageButtonDisabled
                        : {}),
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Editar vínculo do colaborador</h2>
              <p style={styles.formSubtitle}>
                Os dados pessoais vêm do ERP. Aqui você altera apenas as
                informações internas do RH.
              </p>
            </div>

            <div style={styles.formBody}>
              <FormFuncionario
                onCancelar={handleCancelarCadastro}
                onSalvar={handleSalvarFuncionario}
                funcionarioEdicao={funcionarioEdicao}
                setores={setores}
                cargos={cargos}
              />
            </div>
          </div>
        )}

        {loadingEdicao && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingBox}>
              Carregando dados completos do colaborador...
            </div>
          </div>
        )}

        <ModalVincularFuncionario
          aberto={modalVinculoAberto}
          onFechar={fecharModalVinculo}
          onSalvar={handleSalvarVinculo}
          onBuscar={carregarColaboradoresERPDisponiveis}
          colaboradores={colaboradoresERP}
          setores={setores}
          cargos={cargos}
          loading={loadingERP}
        />

        <ConfirmModal
          aberto={!!funcionarioExclusao}
          titulo="Confirmar remoção do vínculo"
          mensagem={
            funcionarioExclusao
              ? `Deseja realmente remover o vínculo do colaborador "${funcionarioExclusao.nome}" no RH?`
              : ""
          }
          onConfirmar={confirmarExclusao}
          onCancelar={cancelarExclusao}
        />
      </div>
    </Layout>
  );
}

const styles = {
  pageContent: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  listagemContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  toolbarContainer: {
    backgroundColor: "transparent",
  },

  resultadoContainer: {
    backgroundColor: "transparent",
    minHeight: "200px",
  },

  paginationBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px 16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  },

  paginationInfo: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "600",
  },

  paginationActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  pageIndicator: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#374151",
    padding: "0 6px",
  },

  pageButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #dbeafe",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontWeight: "700",
    cursor: "pointer",
  },

  pageButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb",
  },

  formHeader: {
    marginBottom: "20px",
  },

  formTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#1f2937",
  },

  formSubtitle: {
    margin: "8px 0 0 0",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#6b7280",
  },

  formBody: {
    marginTop: "8px",
  },

  loadingOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },

  loadingBox: {
    backgroundColor: "#ffffff",
    padding: "20px 24px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
    fontSize: "15px",
    fontWeight: "bold",
    color: "#374151",
  },
};