import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Toolbar from "../components/Toolbar";
import TabelaFuncionarios from "../components/TabelaFuncionarios";
import FormFuncionario from "../components/FormFuncionario";
import Alerta from "../components/Alerta";
import ConfirmModal from "../components/ConfirmModal";
import {
  listarFuncionarios,
  criarFuncionario,
  atualizarFuncionario,
  excluirFuncionario,
  listarCargos,
  listarDepartamentos,
} from "../services/funcionariosService";

export default function Funcionarios() {
  const [search, setSearch] = useState("");
  const [modo, setModo] = useState("lista");
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [funcionarioEdicao, setFuncionarioEdicao] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [setores, setSetores] = useState([]);

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
        id: item.id ?? item.funcionario_id ?? item.fun_id ?? index + 1,
        nome: item.nome ?? item.func_nome ?? item.fun_nome ?? "",
        cpf: item.cpf ?? item.func_cpf ?? item.fun_cpf ?? "",
        cargo: item.cargo ?? item.func_cargo ?? item.cargo_nome ?? "",
        setor: item.setor ?? item.func_setor ?? item.departamento ?? "",
        cargo_id:
          item.cargo_id ??
          item.func_cargo_id ??
          item.id_cargo ??
          "",
        departamento_id:
          item.departamento_id ??
          item.func_departamento_id ??
          item.setor_id ??
          "",
        status: item.status ?? item.func_status ?? item.situacao ?? "Ativo",
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
      const [dadosCargos, dadosSetores] = await Promise.all([
        listarCargos(),
        listarDepartamentos(),
      ]);

      const listaCargos = Array.isArray(dadosCargos) ? dadosCargos : [];
      const listaSetores = Array.isArray(dadosSetores) ? dadosSetores : [];

      setCargos(
        listaCargos.map((item, index) => ({
          id: item.id ?? item.cargo_id ?? index + 1,
          nome: item.nome ?? item.cargo_nome ?? item.descricao ?? "",
        }))
      );

      setSetores(
        listaSetores.map((item, index) => ({
          id: item.id ?? item.departamento_id ?? index + 1,
          nome: item.nome ?? item.departamento_nome ?? item.descricao ?? "",
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar cargos/setores:", err);

      setCargos([
        { id: 1, nome: "Analista de RH" },
        { id: 2, nome: "Assistente Administrativo" },
        { id: 3, nome: "Gerente" },
      ]);

      setSetores([
        { id: 1, nome: "RH" },
        { id: 2, nome: "Administrativo" },
        { id: 3, nome: "Financeiro" },
      ]);
    }
  }

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

  function handleNovoFuncionario() {
    setFuncionarioEdicao(null);
    setModo("cadastro");
  }

  function handleEditarFuncionario(funcionario) {
    setFuncionarioEdicao(funcionario);
    setModo("cadastro");
  }

  function handleCancelarCadastro() {
    setFuncionarioEdicao(null);
    setModo("lista");
  }

  async function handleSalvarFuncionario(dados) {
    try {
      const payload = {
        nome: dados.nome,
        cpf: dados.cpf,
        cargo_id: Number(dados.cargo_id),
        departamento_id: Number(dados.departamento_id),
        status: dados.status,
      };

      if (funcionarioEdicao) {
        await atualizarFuncionario(funcionarioEdicao.id, payload);
        mostrarAlerta("sucesso", "Funcionário atualizado com sucesso.");
      } else {
        await criarFuncionario(payload);
        mostrarAlerta("sucesso", "Funcionário cadastrado com sucesso.");
      }

      setFuncionarioEdicao(null);
      setModo("lista");
      await carregarFuncionarios();
    } catch (err) {
      console.error("Erro ao salvar funcionário:", err);
      console.error("Detalhes:", err.response?.data);
      mostrarAlerta("erro", "Não foi possível salvar o funcionário.");
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
      mostrarAlerta("sucesso", "Funcionário excluído com sucesso.");
      setFuncionarioExclusao(null);
      await carregarFuncionarios();
    } catch (err) {
      console.error("Erro ao excluir funcionário:", err);
      console.error("Detalhes:", err.response?.data);
      mostrarAlerta("erro", "Não foi possível excluir o funcionário.");
      setFuncionarioExclusao(null);
    }
  }

  return (
    <Layout
      title={
        modo === "lista"
          ? "Funcionários"
          : funcionarioEdicao
          ? "Editar Funcionário"
          : "Cadastro de Funcionário"
      }
    >
      <Alerta
        tipo={alerta.tipo}
        mensagem={alerta.mensagem}
        onFechar={fecharAlerta}
      />

      {modo === "lista" ? (
        <>
          <Toolbar
            search={search}
            setSearch={setSearch}
            onNovo={handleNovoFuncionario}
          />

          <TabelaFuncionarios
            funcionarios={funcionariosFiltrados}
            loading={loading}
            error={error}
            onEditar={handleEditarFuncionario}
            onExcluir={handleExcluirFuncionario}
          />
        </>
      ) : (
        <FormFuncionario
          onCancelar={handleCancelarCadastro}
          onSalvar={handleSalvarFuncionario}
          funcionarioEdicao={funcionarioEdicao}
          cargos={cargos}
          setores={setores}
        />
      )}

      <ConfirmModal
        aberto={!!funcionarioExclusao}
        titulo="Confirmar exclusão"
        mensagem={
          funcionarioExclusao
            ? `Deseja realmente excluir o funcionário "${funcionarioExclusao.nome}"?`
            : ""
        }
        onConfirmar={confirmarExclusao}
        onCancelar={cancelarExclusao}
      />
    </Layout>
  );
}