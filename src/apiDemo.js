// API simulada do Avalie360 — usada só no modo demonstração (?demo na URL).
// Mesma interface de `api` em api.js, mas tudo fica em memória no navegador:
// nada é enviado ao servidor e tudo volta ao estado inicial ao recarregar a página.
// Todos os nomes e números abaixo são fictícios.

export const USUARIOS_DEMO = {
  gestor:      { id: 1, nome: "Helena Duarte", email: "gestor.demo@sepal.org.br",      papel: "gestor" },
  missionario: { id: 2, nome: "Lucas Martins", email: "missionario.demo@sepal.org.br", papel: "missionario" },
};

const hoje = new Date();
const diasAtras = (n) => new Date(hoje.getTime() - n * 86400000).toISOString();
// Um aniversariante "hoje" para mostrar o alerta de aniversário na Gestão de Missionários
const aniversarioHoje = `1987-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

let equipes = [
  { id: "e1", nome: "João Ferreira", criado_em: diasAtras(500) },
  { id: "e2", nome: "Marcia Pinto",  criado_em: diasAtras(500) },
  { id: "e3", nome: "Rafael Souza",  criado_em: diasAtras(500) },
  { id: "e4", nome: "Beatriz Rocha", criado_em: diasAtras(200) },
];

let missionarios = [
  { id: 1,  nome: "Helena Duarte",    email: "gestor.demo@sepal.org.br",      whatsapp: "5511990000001", equipeId: "e1", nascimento: "1975-04-22", status: "ativo",   tl: 280, criado_em: diasAtras(720) },
  { id: 2,  nome: "Lucas Martins",    email: "missionario.demo@sepal.org.br", whatsapp: "5511990000002", equipeId: "e2", nascimento: "1991-08-09", status: "ativo",   tl: 370, criado_em: diasAtras(400) },
  { id: 3,  nome: "Ana Souza",        email: "ana.souza@sepal.org.br",        whatsapp: "5511990000003", equipeId: "e1", nascimento: "1985-03-12", status: "ativo",   tl: 470, criado_em: diasAtras(800) },
  { id: 4,  nome: "Carlos Lima",      email: "carlos.lima@sepal.org.br",      whatsapp: "5511990000004", equipeId: "e1", nascimento: "1990-07-25", status: "ativo",   tl: 420, criado_em: diasAtras(650) },
  { id: 5,  nome: "Maria Oliveira",   email: "maria.oliveira@sepal.org.br",   whatsapp: "5511990000005", equipeId: "e2", nascimento: "1978-11-03", status: "ativo",   tl: 390, criado_em: diasAtras(900) },
  { id: 6,  nome: "Pedro Alves",      email: "pedro.alves@sepal.org.br",      whatsapp: "5511990000006", equipeId: "e2", nascimento: "1995-01-18", status: "inativo", tl: 290, criado_em: diasAtras(600) },
  { id: 7,  nome: "Julia Costa",      email: "julia.costa@sepal.org.br",      whatsapp: "5511990000007", equipeId: "e3", nascimento: aniversarioHoje, status: "ativo", tl: 240, criado_em: diasAtras(300) },
  { id: 8,  nome: "Roberto Neves",    email: "roberto.neves@sepal.org.br",    whatsapp: "5511990000008", equipeId: "e3", nascimento: "1982-09-14", status: "ativo",   tl: 180, criado_em: diasAtras(250) },
  { id: 9,  nome: "Fernanda Ribeiro", email: "fernanda.ribeiro@sepal.org.br", whatsapp: "5511990000009", equipeId: "e3", nascimento: "1993-02-27", status: "ativo",   tl: 220, criado_em: diasAtras(380) },
  { id: 10, nome: "Tiago Mendes",     email: "tiago.mendes@sepal.org.br",     whatsapp: "5511990000010", equipeId: "e4", nascimento: "1988-12-05", status: "ativo",   tl: 150, criado_em: diasAtras(190) },
  { id: 11, nome: "Priscila Gomes",   email: "priscila.gomes@sepal.org.br",   whatsapp: "5511990000011", equipeId: "e4", nascimento: "1996-05-30", status: "ativo",   tl: 110, criado_em: diasAtras(150) },
  { id: 12, nome: "Daniel Barros",    email: "daniel.barros@sepal.org.br",    whatsapp: "5511990000012", equipeId: "e4", nascimento: "1984-10-11", status: "ativo",   tl: 0,   criado_em: diasAtras(12) },
  { id: 13, nome: "Camila Teixeira",  email: "camila.teixeira@sepal.org.br",  whatsapp: "5511990000013", equipeId: "e1", nascimento: "1992-06-17", status: "ativo",   tl: 0,   criado_em: diasAtras(5) },
];
let proximoIdMissionario = 100;
let proximoIdEquipe = 5;

// Histórico de pulsos de quem faz login na demo (uma linha por pergunta, como no banco real)
let pulsos = [];
function semearPulsos(missionarioId, envios) {
  envios.forEach(([ciclo, area, dias], i) => {
    pulsos.push({ id: pulsos.length + 1, missionario_id: missionarioId, submissao_id: `demo-${missionarioId}-${i}`, ciclo, area, pergunta: "—", tipo: "escala", resposta: 4, comentario: null, criado_em: diasAtras(dias) });
  });
}
semearPulsos(2, [
  ["area", "Financeiro", 30], ["lideranca", "Diretor Executivo", 60], ["area", "Cuidado Missionário", 120],
  ["evento", "Retiro Anual 2026", 150], ["area", "Comunicação & Marketing", 210], ["area", "Tecnologia", 300],
]);
semearPulsos(1, [["area", "Estratégia & Missão", 45], ["evento", "Encontro Estratégico Abril", 160], ["area", "Operações", 230]]);

// Médias agregadas já "coletadas" (soma/quantidade), atualizadas a cada novo envio na demo
const agregados = [
  ["area", "Cuidado Missionário", 3.8, 42], ["area", "Comunicação & Marketing", 4.5, 39], ["area", "Estratégia & Missão", 4.7, 44],
  ["area", "Financeiro", 4.2, 41], ["area", "Operações", 4.0, 38], ["area", "Recursos Humanos", 3.2, 40], ["area", "Tecnologia", 3.9, 37],
  ["evento", "Encontro Estratégico Abril", 4.1, 33], ["evento", "Retiro Anual 2026", 4.4, 52],
  ["lideranca", "Coord. Cuidado Missionário", 3.9, 28], ["lideranca", "Diretor Executivo", 4.1, 31],
].map(([ciclo, area, media, n]) => ({ ciclo, area, soma: media * n, n }));
let totalSubmissoes = 87;

const esperar = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const copia = (x) => JSON.parse(JSON.stringify(x));

function valorNumerico(tipo, valor) {
  if (tipo === "escala") { const n = Number(valor); return n >= 1 && n <= 5 ? n : null; }
  if (tipo === "binaria") return valor === "Sim" ? 5 : valor === "Não" ? 1 : null;
  return null;
}

export const apiDemo = {
  async login(email) {
    await esperar(400);
    const usuario = Object.values(USUARIOS_DEMO).find((u) => u.email === (email || "").trim().toLowerCase());
    if (!usuario) throw new Error(`Na demonstração, use ${USUARIOS_DEMO.gestor.email} ou ${USUARIOS_DEMO.missionario.email} (qualquer senha).`);
    return { usuario: copia(usuario), token: `demo-${usuario.papel}` };
  },
  async registrar() { throw new Error("Cadastro desativado no modo demonstração."); },

  async listarMissionarios() { await esperar(); return copia(missionarios); },
  async criarMissionario(_t, dados) {
    await esperar();
    const novo = { ...dados, id: proximoIdMissionario++, tl: 0, criado_em: new Date().toISOString() };
    missionarios.push(novo);
    return copia(novo);
  },
  async atualizarMissionario(_t, id, dados) {
    await esperar();
    missionarios = missionarios.map((m) => (m.id === id ? { ...m, ...dados, id, tl: m.tl } : m));
    return copia(missionarios.find((m) => m.id === id));
  },
  async removerMissionario(_t, id) {
    await esperar();
    missionarios = missionarios.filter((m) => m.id !== id);
    return { id };
  },

  async criarPulso(_t, { missionarioId, ciclo, area, talentos, respostas }) {
    await esperar(500);
    const submissaoId = `demo-novo-${Date.now()}`;
    for (const r of respostas) {
      const valor = valorNumerico(r.tipo, r.valor);
      pulsos.push({ id: pulsos.length + 1, missionario_id: missionarioId, submissao_id: submissaoId, ciclo, area, pergunta: r.texto, tipo: r.tipo, resposta: valor, comentario: r.tipo === "aberta" ? r.valor || null : null, criado_em: new Date().toISOString() });
      if (valor == null) continue;
      let ag = agregados.find((a) => a.ciclo === ciclo && a.area === area);
      if (!ag) { ag = { ciclo, area, soma: 0, n: 0 }; agregados.push(ag); }
      ag.soma += valor; ag.n += 1;
    }
    totalSubmissoes += 1;
    let missionario = null;
    const m = missionarios.find((x) => x.id === missionarioId);
    if (m && talentos) { m.tl += talentos; missionario = { id: m.id, nome: m.nome, talentos: m.tl }; }
    return { respostasRegistradas: respostas.length, missionario };
  },
  async listarPulsosMissionario(_t, missionarioId) {
    await esperar();
    return copia(pulsos.filter((p) => p.missionario_id === missionarioId));
  },

  async buscarKpis(token) {
    await esperar();
    const usuario = Object.values(USUARIOS_DEMO).find((u) => token === `demo-${u.papel}`);
    const submissoesPor = {};
    for (const p of pulsos) (submissoesPor[p.missionario_id] ||= new Set()).add(p.submissao_id);
    // Na demo os demais missionários não têm linhas de pulso; estima-se os ciclos pelos Talentos acumulados.
    const ciclosDe = (m) => submissoesPor[m.id]?.size ?? Math.round(m.tl / 55);
    return {
      totalMissionarios: missionarios.length,
      missionariosAtivos: missionarios.filter((m) => m.status === "ativo").length,
      totalPulsosRespondidos: totalSubmissoes,
      mediaPorArea: agregados
        .filter((a) => a.n > 0)
        .sort((a, b) => a.ciclo.localeCompare(b.ciclo) || a.area.localeCompare(b.area))
        .map((a) => ({ ciclo: a.ciclo, area: a.area, media: (a.soma / a.n).toFixed(2), total_respostas: a.n })),
      rankingTalentos: [...missionarios].sort((a, b) => b.tl - a.tl).slice(0, 5).map((m, i) => ({
        id: m.id, nome: m.nome, tl: m.tl, talentos: m.tl, pos: i + 1, ciclos: ciclosDe(m), eu: m.email === usuario?.email,
      })),
    };
  },

  async listarEquipes() { await esperar(); return copia(equipes); },
  async criarEquipe(_t, nome) {
    await esperar();
    const nova = { id: `e${proximoIdEquipe++}`, nome, criado_em: new Date().toISOString() };
    equipes.push(nova);
    return copia(nova);
  },
  async atualizarEquipe(_t, id, nome) {
    await esperar();
    equipes = equipes.map((e) => (e.id === id ? { ...e, nome } : e));
    return copia(equipes.find((e) => e.id === id));
  },
  async removerEquipe(_t, id) {
    await esperar();
    equipes = equipes.filter((e) => e.id !== id);
    return { id };
  },
};

// Planilha financeira de exemplo para o Painel de KPIs (KPIs 9 e 10)
export const FINANCEIRO_DEMO = [
  { desc: "Projetos de missão — campo",       orcado: 420000, realizado: 438000 },
  { desc: "Sustento missionário (missão)",    orcado: 310000, realizado: 302000 },
  { desc: "Treinamento e capacitação missão", orcado: 95000,  realizado: 88000 },
  { desc: "Administrativo",                   orcado: 180000, realizado: 191000 },
  { desc: "Comunicação",                      orcado: 60000,  realizado: 57000 },
  { desc: "Tecnologia",                       orcado: 45000,  realizado: 49000 },
];
