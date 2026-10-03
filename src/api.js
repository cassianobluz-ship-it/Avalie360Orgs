// Cliente da API do Avalie360 (avalie360-api) — autenticação JWT + endpoints REST

import { apiDemo } from "./apiDemo";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Modo demonstração: abrir o site com ?demo na URL (ex.: avalie360.com.br/?demo).
// Usa dados fictícios em memória (apiDemo.js) e não toca na API nem no banco de produção.
export const MODO_DEMO = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

const CHAVE_TOKEN = "avalie360_token";
const CHAVE_USUARIO = "avalie360_usuario";

export function salvarSessao(token, usuario) {
  if (MODO_DEMO) return;
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function limparSessao() {
  if (MODO_DEMO) return;
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

export function carregarSessao() {
  if (MODO_DEMO) return null;
  const token = localStorage.getItem(CHAVE_TOKEN);
  const usuarioBruto = localStorage.getItem(CHAVE_USUARIO);
  if (!token || !usuarioBruto) return null;
  try {
    return { token, usuario: JSON.parse(usuarioBruto) };
  } catch {
    return null;
  }
}

// Erro com o status HTTP, para as telas saberem quando a sessão expirou (401).
export class ErroApi extends Error {
  constructor(mensagem, status) { super(mensagem); this.status = status; }
}

async function chamar(caminho, { method = "GET", body, token } = {}) {
  let resposta;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique sua internet e tente de novo.", 0);
  }
  const json = await resposta.json().catch(() => ({ sucesso: false, erro: "Resposta inválida do servidor." }));
  if (!resposta.ok || !json.sucesso) throw new ErroApi(json.erro || `Erro ${resposta.status} ao chamar a API.`, resposta.status);
  return json.dados;
}

const apiReal = {
  // Acesso
  login: (email, senha) => chamar("/auth/login", { method: "POST", body: { email, senha } }),
  trocarSenha: (token, senhaAtual, novaSenha) => chamar("/auth/trocar-senha", { method: "POST", body: { senhaAtual, novaSenha }, token }),
  consentir: (token) => chamar("/auth/consentimento", { method: "POST", token }),

  // Pessoa logada, perguntas e envio
  me: (token) => chamar("/me", { token }),
  perguntas: (token) => chamar("/perguntas", { token }),
  enviarPulso: (token, dados) => chamar("/pulsos", { method: "POST", body: dados, token }),
  participacao: (token) => chamar("/participacao", { token }),
  acoes: (token) => chamar("/acoes", { token }),

  // Gestão: resultados
  kpis: (token) => chamar("/kpis", { token }),
  sugestoes: (token) => chamar("/kpis/sugestoes", { token }),
  pendentes: (token) => chamar("/participacao/pendentes", { token }),
  gravarIndicadoresManuais: (token, valores) => chamar("/indicadores/manuais", { method: "PUT", body: valores, token }),
  gravarFinanceiro: (token, mes, linhas) => chamar(`/indicadores/financeiro/${mes}`, { method: "PUT", body: { linhas }, token }),

  // Gestão: cadastros
  listarMissionarios: (token) => chamar("/missionarios", { token }),
  criarMissionario: (token, dados) => chamar("/missionarios", { method: "POST", body: dados, token }),
  atualizarMissionario: (token, id, dados) => chamar(`/missionarios/${id}`, { method: "PUT", body: dados, token }),
  removerMissionario: (token, id) => chamar(`/missionarios/${id}`, { method: "DELETE", token }),

  listarEquipes: (token) => chamar("/equipes", { token }),
  criarEquipe: (token, nome) => chamar("/equipes", { method: "POST", body: { nome }, token }),
  atualizarEquipe: (token, id, nome) => chamar(`/equipes/${id}`, { method: "PUT", body: { nome }, token }),
  removerEquipe: (token, id) => chamar(`/equipes/${id}`, { method: "DELETE", token }),

  listarUsuarios: (token) => chamar("/usuarios", { token }),
  criarUsuario: (token, dados) => chamar("/usuarios", { method: "POST", body: dados, token }),
  redefinirSenha: (token, id) => chamar(`/usuarios/${id}/redefinir-senha`, { method: "POST", token }),
  alterarPapel: (token, id, papel) => chamar(`/usuarios/${id}`, { method: "PUT", body: { papel }, token }),
  removerUsuario: (token, id) => chamar(`/usuarios/${id}`, { method: "DELETE", token }),

  listarCiclos: (token) => chamar("/ciclos", { token }),
  criarCiclo: (token, dados) => chamar("/ciclos", { method: "POST", body: dados, token }),
  atualizarCiclo: (token, id, dados) => chamar(`/ciclos/${id}`, { method: "PUT", body: dados, token }),
  removerCiclo: (token, id) => chamar(`/ciclos/${id}`, { method: "DELETE", token }),

  listarEventos: (token) => chamar("/eventos?todos=1", { token }),
  criarEvento: (token, dados) => chamar("/eventos", { method: "POST", body: dados, token }),
  atualizarEvento: (token, id, dados) => chamar(`/eventos/${id}`, { method: "PUT", body: dados, token }),

  listarLiderancas: (token) => chamar("/liderancas?todos=1", { token }),
  criarLideranca: (token, dados) => chamar("/liderancas", { method: "POST", body: dados, token }),
  atualizarLideranca: (token, id, dados) => chamar(`/liderancas/${id}`, { method: "PUT", body: dados, token }),

  criarAcao: (token, dados) => chamar("/acoes", { method: "POST", body: dados, token }),
  atualizarAcao: (token, id, dados) => chamar(`/acoes/${id}`, { method: "PUT", body: dados, token }),
  removerAcao: (token, id) => chamar(`/acoes/${id}`, { method: "DELETE", token }),
};

export const api = MODO_DEMO ? apiDemo : apiReal;
