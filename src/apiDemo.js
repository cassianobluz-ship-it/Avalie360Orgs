// API simulada do Avalie360 — usada só no modo demonstração (?demo na URL).
// Mesma interface de `api` em api.js e as mesmas regras do servidor (validação, Talentos, ciclos,
// confidencialidade com mínimo de respondentes), mas tudo fica em memória no navegador:
// nada é enviado ao servidor e tudo volta ao estado inicial ao recarregar a página.
// Todos os nomes, números e comentários abaixo são fictícios.
import banco from "./demo/perguntas.json";

export const USUARIOS_DEMO = {
  gestor:      { id: 1, nome: "Helena Duarte", email: "gestor.demo@sepal.org.br",      papel: "gestor" },
  missionario: { id: 2, nome: "Lucas Martins", email: "missionario.demo@sepal.org.br", papel: "missionario" },
};

const MINIMO = 5, MINIMO_LIDERANCA = 3, META_PARTICIPACAO = 70;
const minimoDo = t => (t === "lideranca" ? MINIMO_LIDERANCA : MINIMO);
const esperar = (ms = 120) => new Promise(r => setTimeout(r, ms));
const copia = x => JSON.parse(JSON.stringify(x));
const erro = (msg, status = 400) => Object.assign(new Error(msg), { status });

// Gerador pseudoaleatório com semente: a demonstração é sempre igual.
let semente = 20261003;
const rnd = () => { semente |= 0; semente = (semente + 0x6D2B79F5) | 0; let t = Math.imul(semente ^ (semente >>> 15), 1 | semente); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const escalaPerto = m => Math.max(1, Math.min(5, Math.round(m + (rnd() - 0.5) * 2.2)));

// ── Datas relativas a hoje: ciclo atual aberto e os dois anteriores fechados ──
const hojeISO = () => new Date().toISOString().slice(0, 10);
const iso = d => d.toISOString().slice(0, 10);
function trimestre(desloc) {
  const h = new Date(); const t0 = Math.floor(h.getMonth() / 3) + desloc;
  const ano = h.getFullYear() + Math.floor(t0 / 4), t = ((t0 % 4) + 4) % 4;
  return { nome: `T${t + 1} ${ano}`, inicio: iso(new Date(Date.UTC(ano, t * 3, 1))), fim: iso(new Date(Date.UTC(ano, t * 3 + 3, 0))) };
}
const diasAtras = n => new Date(Date.now() - n * 86400000).toISOString();

let ciclos = [
  { id: 1, ...trimestre(-2), inclui_lideranca: true,  perguntas_excluidas: [] },
  { id: 2, ...trimestre(-1), inclui_lideranca: false, perguntas_excluidas: [] },
  { id: 3, ...trimestre(0),  inclui_lideranca: true,  perguntas_excluidas: [] },
];
const comAberto = c => ({ ...c, aberto: c.inicio <= hojeISO() && c.fim >= hojeISO() });

let eventos = [
  { id: 1, nome: "Retiro Anual 2026", data: ciclos[1].inicio, abre_em: ciclos[1].inicio, fecha_em: ciclos[1].fim, ativo: true },
  { id: 2, nome: "Encontro de Líderes", data: hojeISO(), abre_em: ciclos[2].inicio, fecha_em: ciclos[2].fim, ativo: true },
];
const eventoComAberto = e => ({ ...e, aberto: e.ativo && e.abre_em <= hojeISO() && e.fecha_em >= hojeISO() });

let liderancas = [
  { id: 1, nome: "Diretor Executivo", tipo: "diretor", email_lider: USUARIOS_DEMO.gestor.email, ativo: true },
  { id: 2, nome: "Coordenação de Cuidado Missionário", tipo: "coordenacao", email_lider: null, ativo: true },
];

let equipes = [
  { id: "e1", nome: "João Ferreira" }, { id: "e2", nome: "Marcia Pinto" }, { id: "e3", nome: "Rafael Souza" }, { id: "e4", nome: "Beatriz Rocha" },
];

const hoje = new Date();
const aniversarioHoje = `1987-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
let missionarios = [
  ["Helena Duarte", "gestor.demo@sepal.org.br", "e1", "1975-04-22", 900, 260],
  ["Lucas Martins", "missionario.demo@sepal.org.br", "e2", "1991-08-09", 420, 320],
  ["Ana Souza", "ana.souza@sepal.org.br", "e1", "1985-03-12", 800, 470],
  ["Carlos Lima", "carlos.lima@sepal.org.br", "e1", "1990-07-25", 650, 420],
  ["Maria Oliveira", "maria.oliveira@sepal.org.br", "e2", "1978-11-03", 900, 390],
  ["Pedro Alves", "pedro.alves@sepal.org.br", "e2", "1995-01-18", 600, 290],
  ["Julia Costa", "julia.costa@sepal.org.br", "e3", aniversarioHoje, 500, 240],
  ["Roberto Neves", "roberto.neves@sepal.org.br", "e3", "1982-09-14", 450, 180],
  ["Fernanda Ribeiro", "fernanda.ribeiro@sepal.org.br", "e3", "1993-02-27", 380, 220],
  ["Tiago Mendes", "tiago.mendes@sepal.org.br", "e4", "1988-12-05", 190, 150],
  ["Priscila Gomes", "priscila.gomes@sepal.org.br", "e4", "1996-05-30", 150, 110],
  ["Daniel Barros", "daniel.barros@sepal.org.br", "e4", "1984-10-11", 40, 0],
  ["Camila Teixeira", "camila.teixeira@sepal.org.br", "e1", "1992-06-17", 20, 0],
  ["Marcos Pereira", "marcos.pereira@sepal.org.br", "e2", "1980-01-30", 700, 60],
].map(([nome, email, equipeId, nascimento, dias, tl], i) => ({
  id: i + 1, nome, email, whatsapp: `55119900000${String(i + 1).padStart(2, "0")}`, equipeId, nascimento,
  status: "ativo", tl, criado_em: diasAtras(dias), inativado_em: null,
}));
// Um desligamento recente (para o KPI de retenção).
Object.assign(missionarios[13], { status: "inativo", inativado_em: diasAtras(40) });

let usuarios = missionarios.slice(0, 11).map((m, i) => ({
  id: i + 1, nome: m.nome, email: m.email, papel: i === 0 ? "gestor" : "missionario",
  trocaSenhaPendente: i === 10, consentimentoEm: i === 1 ? null : diasAtras(30), criadoEm: m.criado_em,
}));

// ── Respostas anônimas fictícias por ciclo ──
const COMENTARIOS = {
  financeiro: ["Gostaria de um resumo trimestral das finanças da missão.", "Mais transparência sobre a destinação das ofertas.", "Divulgar o relatório financeiro nos encontros.", "Um resumo trimestral simples ajudaria muito."],
  cuidado: ["Visitas de cuidado mais frequentes no campo.", "Ter um contato fixo de cuidado para cada família.", "Mais acompanhamento em períodos de crise.", "Encontros de cuidado online mensais."],
  comunicacao: ["Boletim mensal com notícias das equipes.", "Usar mais o WhatsApp para avisos rápidos.", "Histórias do campo nas redes sociais.", "Boletim curto e mensal com as notícias."],
  rh: ["Mais encontros de equipe ao longo do ano.", "Plano de desenvolvimento para cada missionário.", "Reconhecer publicamente quem se dedica.", "Encontros de equipe trimestrais presenciais."],
  ti: ["Um sistema único para relatórios do campo.", "Treinamento nas ferramentas atuais.", "Internet melhor nas bases.", "Treinamento rápido em vídeo nas ferramentas."],
  operacoes: ["Simplificar o processo de reembolso.", "Prazos mais claros para pedidos de compra.", "Menos etapas no reembolso de despesas.", "Formulário único para pedidos."],
  estrategia: ["Mais projetos com povos não alcançados.", "Compartilhar o planejamento estratégico com todos.", "Metas claras para cada região.", "Apresentar o planejamento estratégico nos encontros."],
};
const ALVOS = { // médias-alvo por ciclo (1, 2, 3) e % de Sim das perguntas Sim/Não
  financeiro: [[3.9, 4.0, 4.2], 0], cuidado: [[3.6, 3.7, 3.8], 0.85], comunicacao: [[4.2, 4.4, 4.5], 0],
  rh: [[3.0, 3.1, 3.3], 0.68], ti: [[3.6, 3.8, 3.9], 0.6], operacoes: [[3.8, 3.9, 4.0], 0.72], estrategia: [[4.4, 4.6, 4.7], 0.9],
};
let respostas = [];
let submissao = 0;
function gerar({ tipoPulso, objetoId, objetoNome, cicloId = null, eventoId = null, perguntas, alvo, pctSim = 0.8, nps = [0.55, 0.3], comentarios = [], auto = false }) {
  const sub = ++submissao;
  for (const p of perguntas) {
    let valor = null, comentario = null;
    if (p.tipo === "escala") valor = escalaPerto(alvo);
    if (p.tipo === "binaria") valor = rnd() < pctSim ? 1 : 0;
    if (p.tipo === "nps") { const r = rnd(); valor = r < nps[0] ? 9 + Math.round(rnd()) : r < nps[0] + nps[1] ? 7 + Math.round(rnd()) : Math.round(rnd() * 6); }
    if (p.tipo === "aberta") { if (rnd() < 0.55 && comentarios.length) comentario = comentarios[Math.floor(rnd() * comentarios.length)]; else continue; }
    respostas.push({ sub, tipo_pulso: tipoPulso, objeto_id: String(objetoId), objeto_nome: objetoNome, ciclo_id: cicloId, evento_id: eventoId, codigo: p.codigo, tipo: p.tipo, valor, comentario, auto });
  }
}
banco.areas.forEach(a => {
  [0, 1, 2].forEach(ci => {
    const qtd = ci === 2 ? (a.id === "ti" ? 3 : 6 + Math.floor(rnd() * 3)) : 9 + Math.floor(rnd() * 4);
    for (let k = 0; k < qtd; k++) gerar({ tipoPulso: "area", objetoId: a.id, objetoNome: a.nome, cicloId: ci + 1, perguntas: a.perguntas,
      alvo: ALVOS[a.id][0][ci], pctSim: ALVOS[a.id][1], comentarios: COMENTARIOS[a.id] });
  });
});
[[1, 0, 9, 3.8], [1, 2, 7, 4.1], [2, 0, 5, 3.6], [2, 2, 4, 3.9]].forEach(([lid, ci, qtd, alvo]) => {
  const l = liderancas.find(x => x.id === lid);
  for (let k = 0; k < qtd; k++) gerar({ tipoPulso: "lideranca", objetoId: lid, objetoNome: l.nome, cicloId: ci + 1, perguntas: banco.lideranca[l.tipo].perguntas, alvo,
    comentarios: ["Mais tempo de escuta com as equipes.", "Comunicar as decisões com antecedência.", "Visitar mais as bases.", "Mais tempo de escuta com cada equipe."] });
});
gerar({ tipoPulso: "lideranca", objetoId: 1, objetoNome: "Diretor Executivo", cicloId: 1, perguntas: banco.lideranca.diretor.perguntas, alvo: 4.4, auto: true });
for (let k = 0; k < 12; k++) gerar({ tipoPulso: "evento", objetoId: 1, objetoNome: "Retiro Anual 2026", eventoId: 1, perguntas: banco.evento.perguntas, alvo: 4.4, nps: [0.6, 0.3],
  comentarios: ["Mais tempo livre para descanso.", "Programação começar mais cedo.", "Mais momentos de oração em grupo."] });
for (let k = 0; k < 4; k++) gerar({ tipoPulso: "evento", objetoId: 2, objetoNome: "Encontro de Líderes", eventoId: 2, perguntas: banco.evento.perguntas, alvo: 4.0 });
[[1, 11, [0.45, 0.35]], [2, 12, [0.5, 0.3]], [3, 8, [0.55, 0.3]]].forEach(([ci, qtd, dist]) => {
  for (let k = 0; k < qtd; k++) gerar({ tipoPulso: "area", objetoId: "ancora", objetoNome: "Âncora", cicloId: ci, perguntas: [banco.ancora], alvo: 0, nps: dist });
});

// ── Participações (quem participou; sem respostas) ──
let participacoes = [];
const participar = (missionarioId, tipoPulso, objetoId, objetoNome, cicloId, eventoId, talentos, comAncora = false, auto = false, dias = 30) =>
  participacoes.push({ missionario_id: missionarioId, tipo_pulso: tipoPulso, objeto_id: String(objetoId), objeto_nome: objetoNome, ciclo_id: cicloId, evento_id: eventoId,
    talentos, com_ancora: comAncora, autoavaliacao: auto, criado_em: diasAtras(dias) });
// Histórico do Lucas (missionário da demo)
participar(2, "area", "financeiro", "Financeiro", 1, null, 50, true, false, 170);
participar(2, "area", "cuidado", "Cuidado Missionário", 1, null, 10, false, false, 168);
participar(2, "lideranca", "1", "Diretor Executivo", 1, null, 70, false, false, 165);
participar(2, "area", "comunicacao", "Comunicação & Marketing", 2, null, 50, true, false, 80);
participar(2, "evento", "1", "Retiro Anual 2026", null, 1, 30, false, false, 75);
participar(2, "area", "financeiro", "Financeiro", 3, null, 50, true, false, 6);
participar(2, "area", "rh", "Recursos Humanos", 3, null, 10, false, false, 6);
// Helena (gestora): autoavaliação no ciclo 1 e áreas
participar(1, "lideranca", "1", "Diretor Executivo", 1, null, 70, true, true, 160);
participar(1, "area", "estrategia", "Estratégia & Missão", 3, null, 50, true, false, 4);
// Demais: participação por ciclo (para as taxas por equipe)
[[1, [3, 4, 5, 6, 7, 8, 9, 10, 11]], [2, [3, 4, 5, 6, 7, 9, 10, 11, 12]], [3, [3, 4, 5, 7, 10, 11]]].forEach(([ci, ids]) =>
  ids.forEach(id => participar(id, "area", "financeiro", "Financeiro", ci, null, 50, true, false, ci === 3 ? 5 : 100)));

let acoes = [
  { id: 1, ciclo_id: 2, area: "Recursos Humanos", titulo: "Encontros trimestrais presenciais por equipe", descricao: "Resposta à menor nota do ciclo anterior: um encontro por trimestre em cada equipe.", status: "em_andamento" },
  { id: 2, ciclo_id: 2, area: "Financeiro", titulo: "Resumo financeiro trimestral para todos", descricao: "Uma página com receitas, despesas e destino das ofertas.", status: "concluida" },
  { id: 3, ciclo_id: 3, area: "Tecnologia", titulo: "Vídeos curtos de treinamento nas ferramentas", descricao: null, status: "planejada" },
].map(a => ({ ...a, criado_em: diasAtras(50), atualizado_em: diasAtras(10) }));
let manuais = { projetos_alinhados_pct: { valor: 82, atualizadoEm: diasAtras(20), atualizadoPor: USUARIOS_DEMO.gestor.email },
  projetos_povos_nao_alcancados: { valor: 7, atualizadoEm: diasAtras(20), atualizadoPor: USUARIOS_DEMO.gestor.email } };
let financeiro = [{ mes: ciclos[1].fim.slice(0, 7), enviado_em: diasAtras(15), linhas: [
  { desc: "Projetos de missão — campo", orcado: 420000, realizado: 438000 },
  { desc: "Sustento missionário (missão)", orcado: 310000, realizado: 302000 },
  { desc: "Treinamento e capacitação para a missão", orcado: 95000, realizado: 88000 },
  { desc: "Administrativo", orcado: 180000, realizado: 191000 },
  { desc: "Comunicação", orcado: 60000, realizado: 57000 },
  { desc: "Tecnologia", orcado: 45000, realizado: 49000 },
] }];

// ── Sessão da demo ──
let logado = null;
const sessaoDe = token => {
  const u = Object.values(USUARIOS_DEMO).find(x => token === `demo-${x.papel}`);
  if (!u) throw erro("Sessão da demonstração expirada.", 401);
  return u;
};
const publico = u => {
  const conta = usuarios.find(x => x.email === u.email);
  return { ...u, trocaSenha: false, consentimentoPendente: !conta?.consentimentoEm };
};
const missionarioDe = email => missionarios.find(m => m.email === email);
const cicloAberto = () => ciclos.map(comAberto).find(c => c.aberto) || null;
const exigirGestor = token => { if (sessaoDe(token).papel !== "gestor") throw erro("Você não tem permissão para realizar esta ação.", 403); };

function conquistas(minhas) {
  const iniciados = ciclos.filter(c => c.inicio <= hojeISO()).map(c => c.id);
  const comPart = new Set(minhas.filter(p => p.ciclo_id).map(p => p.ciclo_id));
  let seg = 0, maior = 0;
  for (const id of iniciados) { seg = comPart.has(id) ? seg + 1 : 0; maior = Math.max(maior, seg); }
  const porCiclo = {};
  for (const p of minhas) if (p.tipo_pulso === "area" && p.ciclo_id) (porCiclo[p.ciclo_id] ||= new Set()).add(p.objeto_id);
  const maisAreas = Math.max(0, ...Object.values(porCiclo).map(s => s.size));
  const tipos = new Set(minhas.map(p => p.tipo_pulso)).size;
  const c = (id, nome, regra, atual, meta) => ({ id, nome, regra, progresso: Math.min(atual, meta), meta, conquistada: atual >= meta });
  return [
    c("primeira_voz", "Primeira Voz", "Responder o primeiro pulso", minhas.length, 1),
    c("fiel", "Fiel", "Participar de 3 ciclos seguidos", maior, 3),
    c("voz_missao", "Voz da Missão", "Responder os 3 tipos de pulso (área, evento e liderança)", tipos, 3),
    c("panorama", "Panorama", `Avaliar as ${banco.areas.length} áreas num mesmo ciclo`, maisAreas, banco.areas.length),
    c("guardiao", "Guardião", "Participar de 4 ciclos (um ano de pulsos)", comPart.size, 4),
  ];
}

function agregar() {
  const grupos = {};
  for (const r of respostas) {
    if (r.codigo === "ANC-1") continue;
    const k = [r.tipo_pulso, r.objeto_id, r.ciclo_id, r.evento_id, r.auto].join("|");
    const g = (grupos[k] ||= { tipoPulso: r.tipo_pulso, objetoId: r.objeto_id, objetoNome: r.objeto_nome, cicloId: r.ciclo_id, eventoId: r.evento_id, autoavaliacao: r.auto, subs: new Set(), por: {} });
    g.subs.add(r.sub);
    if (r.tipo === "aberta") continue;
    const p = (g.por[r.codigo] ||= { codigo: r.codigo, tipo: r.tipo, n: 0, soma: 0, promotores: 0, detratores: 0 });
    p.n++; p.soma += r.valor;
    if (r.tipo === "nps") { if (r.valor >= 9) p.promotores++; if (r.valor <= 6) p.detratores++; }
  }
  return Object.values(grupos).map(g => {
    const respondentes = g.subs.size, suprimido = !g.autoavaliacao && respondentes < minimoDo(g.tipoPulso);
    return { tipoPulso: g.tipoPulso, objetoId: g.objetoId, objetoNome: g.objetoNome, cicloId: g.cicloId, eventoId: g.eventoId, autoavaliacao: g.autoavaliacao,
      respondentes, minimo: minimoDo(g.tipoPulso), suprimido,
      perguntas: suprimido ? [] : Object.values(g.por).map(p => ({ codigo: p.codigo, tipo: p.tipo, n: p.n, media: p.soma / p.n, promotores: p.promotores, detratores: p.detratores })) };
  });
}

function participacaoColetiva() {
  const iniciados = ciclos.filter(c => c.inicio <= hojeISO());
  const ativos = missionarios.filter(m => m.status === "ativo");
  const resumo = c => {
    if (!c) return null;
    const ids = new Set(participacoes.filter(p => p.ciclo_id === c.id).map(p => p.missionario_id));
    const n = ativos.filter(m => ids.has(m.id)).length;
    return { cicloId: c.id, cicloNome: c.nome, participantes: n, ativos: ativos.length, pct: ativos.length ? Math.round((n / ativos.length) * 100) : null };
  };
  const atual = iniciados[iniciados.length - 1];
  const ids = new Set(participacoes.filter(p => p.ciclo_id === atual?.id).map(p => p.missionario_id));
  const porEquipe = equipes.map(e => {
    const base = ativos.filter(m => m.equipeId === e.id);
    const n = base.filter(m => ids.has(m.id)).length;
    return { equipeId: e.id, equipe: `Equipe de ${e.nome}`, participantes: n, ativos: base.length, pct: base.length ? Math.round((n / base.length) * 100) : null };
  }).filter(e => e.ativos > 0).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  return { meta: META_PARTICIPACAO, atual: resumo(atual), anterior: resumo(iniciados[iniciados.length - 2]), porEquipe };
}

const { legado, ...bancoPublico } = banco;

export const apiDemo = {
  async login(email) {
    await esperar(300);
    const u = Object.values(USUARIOS_DEMO).find(x => x.email === (email || "").trim().toLowerCase());
    if (!u) throw erro(`Na demonstração, use os botões de entrada (${USUARIOS_DEMO.gestor.email} ou ${USUARIOS_DEMO.missionario.email}).`);
    logado = u;
    return { usuario: publico(u), token: `demo-${u.papel}` };
  },
  async trocarSenha(token) { const u = sessaoDe(token); await esperar(); return { usuario: publico(u), token }; },
  async consentir(token) {
    const u = sessaoDe(token); await esperar();
    usuarios = usuarios.map(x => x.email === u.email ? { ...x, consentimentoEm: new Date().toISOString() } : x);
    return { usuario: publico(u) };
  },

  async me(token) {
    const u = sessaoDe(token); await esperar();
    const m = missionarioDe(u.email);
    const minhas = participacoes.filter(p => p.missionario_id === m?.id).sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    const aberto = cicloAberto();
    const noCiclo = aberto ? minhas.filter(p => p.ciclo_id === aberto.id) : [];
    const resp = (tipo, objId, evId) => minhas.some(p => p.tipo_pulso === tipo && p.objeto_id === String(objId) && (tipo === "evento" ? p.evento_id === evId : aberto && p.ciclo_id === aberto.id));
    return copia({
      usuario: publico(u),
      missionario: m && { id: m.id, nome: m.nome, equipeId: m.equipeId, status: m.status, tl: m.tl, membroDesde: m.criado_em },
      historico: minhas.map(p => ({ tipoPulso: p.tipo_pulso, objetoNome: p.objeto_nome, cicloNome: ciclos.find(c => c.id === p.ciclo_id)?.nome || null,
        talentos: p.talentos, autoavaliacao: p.autoavaliacao, data: p.criado_em })),
      conquistas: conquistas(minhas),
      cicloAberto: aberto && { ...aberto, ancoraPendente: !noCiclo.some(p => p.com_ancora), areasRespondidas: noCiclo.filter(p => p.tipo_pulso === "area").map(p => p.objeto_id) },
      eventos: eventos.map(eventoComAberto).filter(e => e.aberto).map(e => ({ id: e.id, nome: e.nome, data: e.data, fechaEm: e.fecha_em, respondido: resp("evento", e.id, e.id) })),
      liderancas: aberto?.inclui_lideranca ? liderancas.filter(l => l.ativo).map(l => ({ id: l.id, nome: l.nome, tipo: l.tipo, souEu: l.email_lider === u.email, respondido: resp("lideranca", l.id) })) : [],
    });
  },
  async perguntas() { await esperar(); return copia(bancoPublico); },

  async enviarPulso(token, { tipoPulso, objetoId, respostas: lista }) {
    const u = sessaoDe(token); await esperar(450);
    const m = missionarioDe(u.email);
    if (!m) throw erro("Seu acesso não está vinculado a um cadastro de missionário.", 403);
    let perguntas, nome, ciclo = null, evento = null, auto = false;
    if (tipoPulso === "evento") {
      evento = eventos.map(eventoComAberto).find(e => e.id === Number(objetoId));
      if (!evento?.aberto) throw erro("A avaliação deste evento não está aberta.", 409);
      perguntas = banco.evento.perguntas; nome = evento.nome;
    } else {
      ciclo = cicloAberto();
      if (!ciclo) throw erro("Não há ciclo de avaliação aberto no momento.", 409);
      if (tipoPulso === "area") { const a = banco.areas.find(x => x.id === objetoId); if (!a) throw erro("Área desconhecida."); perguntas = a.perguntas; nome = a.nome; }
      else { const l = liderancas.find(x => x.id === Number(objetoId)); if (!l) throw erro("Liderança não encontrada.", 404); perguntas = banco.lideranca[l.tipo].perguntas; nome = l.nome; auto = l.email_lider === u.email; }
    }
    const minhas = participacoes.filter(p => p.missionario_id === m.id);
    const noCiclo = ciclo ? minhas.filter(p => p.ciclo_id === ciclo.id) : [];
    if (tipoPulso === "evento" ? minhas.some(p => p.evento_id === evento.id) : noCiclo.some(p => p.tipo_pulso === tipoPulso && p.objeto_id === String(objetoId))) {
      throw erro(`Você já respondeu "${nome}"${ciclo ? ` no ciclo ${ciclo.nome}` : ""}.`, 409);
    }
    const comAncora = !!ciclo && !noCiclo.some(p => p.com_ancora);
    const permitidas = [...perguntas.filter(p => !ciclo || !ciclo.perguntas_excluidas.includes(p.codigo)), ...(comAncora ? [banco.ancora] : [])];
    const faltando = permitidas.filter(p => p.tipo !== "aberta" && !lista.some(r => r.codigo === p.codigo));
    if (faltando.length) throw erro(`Responda todas as perguntas obrigatórias (${faltando.map(p => p.codigo).join(", ")}).`);
    const regra = banco.talentos[tipoPulso];
    const talentos = tipoPulso !== "evento" && noCiclo.some(p => p.tipo_pulso === tipoPulso) ? regra.adicional : regra.primeira;
    const sub = ++submissao;
    for (const r of lista) {
      const p = permitidas.find(x => x.codigo === r.codigo);
      if (!p) continue;
      const valor = p.tipo === "binaria" ? (r.valor === "Sim" ? 1 : 0) : p.tipo === "aberta" ? null : Number(r.valor);
      respostas.push({ sub, tipo_pulso: tipoPulso, objeto_id: p.codigo === "ANC-1" ? "ancora" : String(objetoId), objeto_nome: nome, ciclo_id: ciclo?.id ?? null,
        evento_id: evento?.id ?? null, codigo: p.codigo, tipo: p.tipo, valor, comentario: p.tipo === "aberta" ? String(r.valor).trim() || null : null, auto });
    }
    participar(m.id, tipoPulso, objetoId, nome, ciclo?.id ?? null, evento?.id ?? null, talentos, comAncora, auto, 0);
    m.tl += talentos;
    return { talentosGanhos: talentos, totalTalentos: m.tl, respostasRegistradas: lista.length };
  },
  async participacao(token) { sessaoDe(token); await esperar(); return copia(participacaoColetiva()); },
  async acoes(token) {
    sessaoDe(token); await esperar();
    const ordem = { em_andamento: 0, planejada: 1, concluida: 2 };
    return copia([...acoes].sort((a, b) => ordem[a.status] - ordem[b.status]).map(a => ({ ...a, ciclo_nome: ciclos.find(c => c.id === a.ciclo_id)?.nome || null })));
  },

  async kpis(token) {
    exigirGestor(token); await esperar(250);
    const ativos = missionarios.filter(m => m.status === "ativo");
    const ano = Date.now() - 365 * 86400000;
    const base = missionarios.filter(m => new Date(m.criado_em) <= ano && (m.status === "ativo" || new Date(m.inativado_em) > ano));
    const anc = {};
    for (const r of respostas.filter(x => x.codigo === "ANC-1")) { const a = (anc[r.ciclo_id] ||= { cicloId: r.ciclo_id, n: 0, promotores: 0, detratores: 0 }); a.n++; if (r.valor >= 9) a.promotores++; if (r.valor <= 6) a.detratores++; }
    return copia({
      minimos: { geral: MINIMO, lideranca: MINIMO_LIDERANCA },
      ciclos: ciclos.map(comAberto), eventos: eventos.map(eventoComAberto), liderancas, equipes,
      agregados: agregar(),
      ancora: Object.values(anc).map(a => (a.n < MINIMO ? { cicloId: a.cicloId, n: a.n, suprimido: true } : { ...a, suprimido: false })),
      cadastro: { baseRetencao: base.length, retidos: base.filter(m => m.status === "ativo").length,
        novos90d: missionarios.filter(m => new Date(m.criado_em) > Date.now() - 90 * 86400000).length, ativos: ativos.length, total: missionarios.length },
      manuais, financeiro: [...financeiro].sort((a, b) => b.mes.localeCompare(a.mes))[0] || null, mesesFinanceiros: financeiro.map(f => f.mes),
    });
  },
  async sugestoes(token) {
    exigirGestor(token); await esperar();
    const subs = {};
    for (const r of respostas) if (!r.auto) (subs[[r.tipo_pulso, r.objeto_id, r.ciclo_id, r.evento_id].join("|")] ||= new Set()).add(r.sub);
    const lib = [], retidas = { n: 0 };
    respostas.filter(r => r.tipo === "aberta" && r.comentario && !r.auto).forEach(r => {
      const k = [r.tipo_pulso, r.objeto_id, r.ciclo_id, r.evento_id].join("|");
      if (subs[k].size >= minimoDo(r.tipo_pulso)) lib.push({ tipoPulso: r.tipo_pulso, objetoNome: r.objeto_nome, cicloId: r.ciclo_id, eventoId: r.evento_id, codigo: r.codigo, texto: r.comentario });
      else retidas.n++;
    });
    lib.sort((a, b) => a.objetoNome.localeCompare(b.objetoNome) || a.codigo.localeCompare(b.codigo) || a.texto.localeCompare(b.texto));
    return copia({ sugestoes: lib, retidas: retidas.n });
  },
  async pendentes(token) {
    exigirGestor(token); await esperar();
    const c = cicloAberto();
    if (!c) return { ciclo: null, pendentes: [] };
    const ids = new Set(participacoes.filter(p => p.ciclo_id === c.id).map(p => p.missionario_id));
    return copia({ ciclo: { id: c.id, nome: c.nome, fim: c.fim }, pendentes: missionarios.filter(m => m.status === "ativo" && !ids.has(m.id)) });
  },
  async gravarIndicadoresManuais(token, valores) {
    exigirGestor(token); await esperar();
    for (const [k, v] of Object.entries(valores)) manuais[k] = { valor: Number(v), atualizadoEm: new Date().toISOString(), atualizadoPor: logado?.email };
    return copia(manuais);
  },
  async gravarFinanceiro(token, mes, linhas) {
    exigirGestor(token); await esperar();
    financeiro = [...financeiro.filter(f => f.mes !== mes), { mes, linhas, enviado_em: new Date().toISOString() }];
    return { mes, linhas };
  },

  async listarMissionarios(token) { exigirGestor(token); await esperar(); return copia(missionarios); },
  async criarMissionario(token, d) {
    exigirGestor(token); await esperar();
    if (d.email && missionarios.some(m => m.email === d.email.toLowerCase())) throw erro("Já existe um missionário com este e-mail.", 409);
    const novo = { id: Math.max(...missionarios.map(m => m.id)) + 1, nome: d.nome, email: (d.email || "").toLowerCase(), whatsapp: d.whatsapp || "", equipeId: d.equipeId || "",
      nascimento: d.nascimento || "", status: d.status || "ativo", tl: 0, criado_em: new Date().toISOString(), inativado_em: d.status === "inativo" ? new Date().toISOString() : null };
    missionarios.push(novo); return copia(novo);
  },
  async atualizarMissionario(token, id, d) {
    exigirGestor(token); await esperar();
    missionarios = missionarios.map(m => m.id !== id ? m : { ...m, ...d, id, tl: m.tl,
      inativado_em: d.status === "inativo" && m.status === "ativo" ? new Date().toISOString() : d.status === "ativo" ? null : m.inativado_em });
    return copia(missionarios.find(m => m.id === id));
  },
  async removerMissionario(token, id) {
    exigirGestor(token); await esperar();
    missionarios = missionarios.filter(m => m.id !== id); participacoes = participacoes.filter(p => p.missionario_id !== id);
    return { id };
  },

  async listarEquipes(token) { sessaoDe(token); await esperar(); return copia(equipes); },
  async criarEquipe(token, nome) { exigirGestor(token); const e = { id: "e" + Date.now(), nome }; equipes.push(e); return copia(e); },
  async atualizarEquipe(token, id, nome) { exigirGestor(token); equipes = equipes.map(e => e.id === id ? { ...e, nome } : e); return copia(equipes.find(e => e.id === id)); },
  async removerEquipe(token, id) { exigirGestor(token); equipes = equipes.filter(e => e.id !== id); return { id }; },

  async listarUsuarios(token) { exigirGestor(token); await esperar(); return copia(usuarios); },
  async criarUsuario(token, { email, nome, papel = "missionario" }) {
    exigirGestor(token); await esperar();
    if (!/@sepal\.org\.br$/i.test(email || "")) throw erro("Use um e-mail @sepal.org.br.");
    if (usuarios.some(u => u.email === email.toLowerCase())) throw erro("Já existe um acesso para este e-mail.", 409);
    const u = { id: Math.max(...usuarios.map(x => x.id)) + 1, nome, email: email.toLowerCase(), papel, trocaSenhaPendente: true, consentimentoEm: null, criadoEm: new Date().toISOString() };
    usuarios.push(u);
    return { usuario: copia(u), senhaProvisoria: "Demo" + Math.random().toString(36).slice(2, 8) };
  },
  async redefinirSenha(token, id) {
    exigirGestor(token); await esperar();
    usuarios = usuarios.map(u => u.id === id ? { ...u, trocaSenhaPendente: true } : u);
    return { usuario: copia(usuarios.find(u => u.id === id)), senhaProvisoria: "Demo" + Math.random().toString(36).slice(2, 8) };
  },
  async alterarPapel(token, id, papel) { exigirGestor(token); usuarios = usuarios.map(u => u.id === id ? { ...u, papel } : u); return copia(usuarios.find(u => u.id === id)); },
  async removerUsuario(token, id) { exigirGestor(token); usuarios = usuarios.filter(u => u.id !== id); return { id }; },

  async listarCiclos(token) { sessaoDe(token); await esperar(); return copia(ciclos.map(comAberto)); },
  async criarCiclo(token, d) {
    exigirGestor(token); await esperar();
    const conflito = ciclos.find(c => c.inicio <= d.fim && c.fim >= d.inicio);
    if (conflito) throw erro(`As datas se sobrepõem ao ciclo ${conflito.nome}.`, 409);
    const c = { id: Math.max(...ciclos.map(x => x.id)) + 1, nome: d.nome, inicio: d.inicio, fim: d.fim, inclui_lideranca: d.incluiLideranca !== false, perguntas_excluidas: d.perguntasExcluidas || [] };
    ciclos = [...ciclos, c].sort((a, b) => a.inicio.localeCompare(b.inicio)); return copia(comAberto(c));
  },
  async atualizarCiclo(token, id, d) {
    exigirGestor(token); await esperar();
    const conflito = ciclos.find(c => c.id !== id && c.inicio <= d.fim && c.fim >= d.inicio);
    if (conflito) throw erro(`As datas se sobrepõem ao ciclo ${conflito.nome}.`, 409);
    ciclos = ciclos.map(c => c.id === id ? { ...c, nome: d.nome, inicio: d.inicio, fim: d.fim, inclui_lideranca: d.incluiLideranca, perguntas_excluidas: d.perguntasExcluidas } : c);
    return copia(comAberto(ciclos.find(c => c.id === id)));
  },
  async removerCiclo(token, id) {
    exigirGestor(token); await esperar();
    if (participacoes.some(p => p.ciclo_id === id)) throw erro("Este ciclo já tem participações e não pode ser removido.", 409);
    ciclos = ciclos.filter(c => c.id !== id); return { id };
  },

  async listarEventos(token) { sessaoDe(token); await esperar(); return copia(eventos.map(eventoComAberto)); },
  async criarEvento(token, d) {
    exigirGestor(token); await esperar();
    const e = { id: Math.max(...eventos.map(x => x.id)) + 1, nome: d.nome, data: d.data || null, abre_em: d.abreEm, fecha_em: d.fechaEm, ativo: true };
    eventos = [e, ...eventos]; return copia(eventoComAberto(e));
  },
  async atualizarEvento(token, id, d) {
    exigirGestor(token); await esperar();
    eventos = eventos.map(e => e.id === id ? { ...e, nome: d.nome, data: d.data || null, abre_em: d.abreEm, fecha_em: d.fechaEm, ativo: d.ativo ?? e.ativo } : e);
    return copia(eventoComAberto(eventos.find(e => e.id === id)));
  },
  async listarLiderancas(token) { sessaoDe(token); await esperar(); return copia(liderancas); },
  async criarLideranca(token, d) {
    exigirGestor(token); await esperar();
    const l = { id: Math.max(...liderancas.map(x => x.id)) + 1, nome: d.nome, tipo: d.tipo, email_lider: d.emailLider ? d.emailLider.toLowerCase() : null, ativo: true };
    liderancas.push(l); return copia(l);
  },
  async atualizarLideranca(token, id, d) {
    exigirGestor(token); await esperar();
    liderancas = liderancas.map(l => l.id === id ? { ...l, nome: d.nome, tipo: d.tipo, email_lider: d.emailLider ? d.emailLider.toLowerCase() : null, ativo: d.ativo ?? l.ativo } : l);
    return copia(liderancas.find(l => l.id === id));
  },
  async criarAcao(token, d) {
    exigirGestor(token); await esperar();
    const a = { id: Math.max(0, ...acoes.map(x => x.id)) + 1, ciclo_id: d.cicloId || null, area: d.area, titulo: d.titulo, descricao: d.descricao || null, status: d.status || "planejada",
      criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
    acoes.push(a); return copia(a);
  },
  async atualizarAcao(token, id, d) {
    exigirGestor(token); await esperar();
    acoes = acoes.map(a => a.id === id ? { ...a, ciclo_id: d.cicloId || null, area: d.area, titulo: d.titulo, descricao: d.descricao || null, status: d.status, atualizado_em: new Date().toISOString() } : a);
    return copia(acoes.find(a => a.id === id));
  },
  async removerAcao(token, id) { exigirGestor(token); await esperar(); acoes = acoes.filter(a => a.id !== id); return { id }; },
};
