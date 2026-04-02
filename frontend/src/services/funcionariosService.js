import api from "./api";

export async function listarFuncionarios() {
  const response = await api.get("/funcionarios");
  return response.data;
}

export async function listarColaboradoresERPDisponiveis(search = "") {
  const response = await api.get("/funcionarios/erp-disponiveis", {
    params: { search },
  });
  return response.data;
}

export async function detalharFuncionario(id) {
  const response = await api.get(`/funcionarios/${id}`);
  return response.data;
}

export async function criarFuncionario(dados) {
  const response = await api.post("/funcionarios", dados);
  return response.data;
}

export async function atualizarFuncionario(id, dados) {
  const response = await api.put(`/funcionarios/${id}`, dados);
  return response.data;
}

export async function excluirFuncionario(id) {
  const response = await api.delete(`/funcionarios/${id}`);
  return response.data;
}

export async function listarDepartamentos() {
  const response = await api.get("/departamentos");
  return response.data;
}

export async function listarCargos() {
  const response = await api.get("/cargos");
  return response.data;
}