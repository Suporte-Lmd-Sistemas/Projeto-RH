import api from "./api";

export async function listarRelatorios(categoria) {
  const response = await api.get(`/relatorios/${categoria}`);
  return response.data;
}

export async function inspecionarRelatorio(cdarquivo) {
  const response = await api.get(`/relatorios/${cdarquivo}/inspecionar`);
  return response.data;
}

export async function obterOpcoesRelatorio(cdarquivo) {
  const response = await api.get(`/relatorios/${cdarquivo}/opcoes`);
  return response.data;
}

export async function executarPreviewRelatorio(cdarquivo, payload) {
  const response = await api.post(`/relatorios/${cdarquivo}/preview`, payload);
  return response.data;
}