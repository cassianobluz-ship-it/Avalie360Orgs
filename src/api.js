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

async function chamar(caminho, { method = "GET", body, token } = {}) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await resposta.json().catch(() => ({ sucesso: false, erro: "Resposta inválida do servidor." }));

  if (!resposta.ok || !json.sucesso) {
    throw new Error(json.erro || `Erro ${resposta.status} ao chamar a API.`);
  }

  return json.dados;
}

const apiReal = {
  login: (email, senha) => chamar("/auth/login", { method: "POST", body: { email, senha } }),
  registrar: (nome, email, senha, papel) =>
    chamar("/auth/registrar", { method: "POST", body: { nome, email, senha, papel } }),

  listarMissionarios: (token) => chamar("/missionarios", { token }),
  criarMissionario: (token, dados) => chamar("/missionarios", { method: "POST", body: dados, token }),
  atualizarMissionario: (token, id, dados) => chamar(`/missionarios/${id}`, { method: "PUT", body: dados, token }),
  removerMissionario: (token, id) => chamar(`/missionarios/${id}`, { method: "DELETE", token }),

  criarPulso: (token, dados) => chamar("/pulsos", { method: "POST", body: dados, token }),
  listarPulsosMissionario: (token, missionarioId) => chamar(`/pulsos/missionario/${missionarioId}`, { token }),

  buscarKpis: (token) => chamar("/kpis", { token }),

  listarEquipes: (token) => chamar("/equipes", { token }),
  criarEquipe: (token, nome) => chamar("/equipes", { method: "POST", body: { nome }, token }),
  atualizarEquipe: (token, id, nome) => chamar(`/equipes/${id}`, { method: "PUT", body: { nome }, token }),
  removerEquipe: (token, id) => chamar(`/equipes/${id}`, { method: "DELETE", token }),
};

export const api = MODO_DEMO ? apiDemo : apiReal;
