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

  const [alerta, setAlerta] = useState({
    tipo: "",
    mensagem: "",
  });

  const [funcionarioExclusao, setFuncionarioExclusao] = useState(null);

  useEffect(() => {
    carregarFuncionarios();
    carregarListasAuxiliares();
  }, []);

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
        departamento_id: item.departamento_id ?? "",
        status: item.status ?? "Ativo",
        email: item.email ?? "",
        telefone: item.telefone ?? "",
        celular: item.celular ?? "",
        salario: item.salario ?? null,
        data_admissao: item.data_admissao ?? null,
        data_afastamento: item.data_afastamento ?? null,
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

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) =>
      String(f.nome || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [funcionarios, search]);

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
              />
            </div>

            <div style={styles.resultadoContainer}>
              <TabelaFuncionarios
                funcionarios={funcionariosFiltrados}
                loading={loading}
                error={error}
                onEditar={handleEditarFuncionario}
                onExcluir={handleExcluirFuncionario}
              />
            </div>
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