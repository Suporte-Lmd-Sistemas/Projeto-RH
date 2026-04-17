import axios from "axios";

const API = "http://127.0.0.1:8000";

export async function listarRelatorios(categoria) {
  const response = await axios.get(`${API}/relatorios/${categoria}`);
  return response.data;
}

export async function inspecionarRelatorio(cdarquivo) {
  const response = await axios.get(`${API}/relatorios/${cdarquivo}/inspecionar`);
  return response.data;
}

export async function obterOpcoesRelatorio(cdarquivo) {
  const response = await axios.get(`${API}/relatorios/${cdarquivo}/opcoes`);
  return response.data;
}

export async function executarPreviewRelatorio(cdarquivo, payload) {
  const response = await axios.post(`${API}/relatorios/${cdarquivo}/preview`, payload);
  return response.data;
}