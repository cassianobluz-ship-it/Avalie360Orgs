// Cálculo dos resultados, dos 10 KPIs e do índice estratégico a partir dos dados AGREGADOS de /kpis.
// O servidor só entrega médias de grupos com o mínimo de respondentes; aqui nada identifica pessoas.

const media = (itens) => {
  const n = itens.reduce((t, i) => t + i.n, 0);
  return n ? itens.reduce((t, i) => t + i.media * i.n, 0) / n : null;
};
const npsDe = ({ promotores, detratores, n }) => (n ? ((promotores - detratores) / n) * 100 : null);

// Ciclos já iniciados, do mais antigo ao mais recente.
export function ciclosIniciados(kpis) {
  const hoje = new Date().toISOString().slice(0, 10);
  return (kpis?.ciclos || []).filter(c => c.inicio <= hoje);
}

export function cicloPadrao(kpis) {
  const lista = ciclosIniciados(kpis);
  return lista[lista.length - 1] || null;
}

export function cicloAnterior(kpis, cicloId) {
  const lista = ciclosIniciados(kpis);
  const i = lista.findIndex(c => c.id === cicloId);
  return i > 0 ? lista[i - 1] : null;
}

const grupo = (kpis, filtro) => (kpis?.agregados || []).filter(g => Object.entries(filtro).every(([k, v]) => g[k] === v));

// Resultado de uma área num ciclo: média das afirmações (escala 1–5) e % de "Sim" das perguntas Sim/Não.
export function resultadoArea(kpis, areaId, cicloId) {
  const g = grupo(kpis, { tipoPulso: "area", objetoId: areaId, cicloId, autoavaliacao: false })[0];
  if (!g) return { respondentes: 0, suprimido: false, semDados: true, media: null, perguntas: [] };
  if (g.suprimido) return { respondentes: g.respondentes, minimo: g.minimo, suprimido: true, media: null, perguntas: [] };
  const escalas = g.perguntas.filter(p => p.tipo === "escala");
  return { respondentes: g.respondentes, suprimido: false, media: media(escalas), perguntas: g.perguntas };
}

export function resultadosAreas(kpis, banco, cicloId) {
  return (banco?.areas || []).map(a => ({ ...a, ...resultadoArea(kpis, a.id, cicloId) }));
}

export function mediaGeral(resultados) {
  const com = resultados.filter(r => r.media !== null);
  return com.length ? com.reduce((t, r) => t + r.media, 0) / com.length : null;
}

// % de "Sim" de uma pergunta Sim/Não (gravada como 1/0) num ciclo.
export function pctSim(kpis, areaId, codigo, cicloId) {
  const r = resultadoArea(kpis, areaId, cicloId);
  const p = r.perguntas.find(x => x.codigo === codigo);
  return p ? p.media * 100 : null;
}

// Liderança: equipe x autoavaliação por dimensão (360).
export function resultadosLideranca(kpis, cicloId) {
  return (kpis?.liderancas || []).map(l => {
    const equipe = grupo(kpis, { tipoPulso: "lideranca", objetoId: String(l.id), cicloId, autoavaliacao: false })[0];
    const auto = grupo(kpis, { tipoPulso: "lideranca", objetoId: String(l.id), cicloId, autoavaliacao: true })[0];
    const valores = g => g && !g.suprimido ? Object.fromEntries(g.perguntas.filter(p => p.tipo === "escala").map(p => [p.codigo.slice(-1), p.media])) : null;
    const eq = valores(equipe);
    return {
      ...l, respondentes: equipe?.respondentes || 0, minimo: equipe?.minimo, suprimido: !!equipe?.suprimido,
      equipe: eq, auto: valores(auto),
      media: eq ? media(equipe.perguntas.filter(p => p.tipo === "escala")) : null,
    };
  }).filter(l => l.respondentes || l.auto);
}

// Eventos: satisfação (EVE-1/EVE-2) e NPS do evento (EVE-3).
export function resultadosEventos(kpis) {
  return (kpis?.eventos || []).map(e => {
    const g = grupo(kpis, { tipoPulso: "evento", eventoId: e.id, autoavaliacao: false })[0];
    if (!g) return { ...e, respondentes: 0, semDados: true };
    if (g.suprimido) return { ...e, respondentes: g.respondentes, minimo: g.minimo, suprimido: true };
    const nps = g.perguntas.find(p => p.tipo === "nps");
    return { ...e, respondentes: g.respondentes, suprimido: false,
      satisfacao: media(g.perguntas.filter(p => p.tipo === "escala" && ["EVE-1", "EVE-2"].includes(p.codigo))),
      nps: nps ? npsDe(nps) : null };
  });
}

// eNPS da pergunta-âncora por ciclo.
export function enpsDoCiclo(kpis, cicloId) {
  const a = (kpis?.ancora || []).find(x => x.cicloId === cicloId);
  if (!a) return { semDados: true, valor: null };
  if (a.suprimido) return { suprimido: true, n: a.n, valor: null };
  return { valor: npsDe(a), n: a.n };
}

// ── KPIs e índice estratégico ─────────────────────────────────────────────────
export const DIMENSOES = [
  { id: "impacto",    nome: "Resultados de Impacto da Missão",     peso: 45, icon: "🎯" },
  { id: "capacidade", nome: "Capacidade Estratégica e Liderança",   peso: 35, icon: "🌟" },
  { id: "eficiencia", nome: "Eficiência Operacional e Governança",  peso: 20, icon: "⚙️" },
];

// Atingimento de 0 a 1 em relação à meta (para o índice).
const atinge = (valor, meta) => (valor === null || valor === undefined ? null : Math.max(0, Math.min(1, valor / meta)));

export function calcularKpis(kpis, cicloId) {
  const ciclo = (kpis?.ciclos || []).find(c => c.id === cicloId);
  const cad = kpis?.cadastro || {};
  const man = kpis?.manuais || {};
  const fin = kpis?.financeiro;

  // KPI 3: eventos cuja avaliação abriu dentro do período do ciclo.
  const evs = resultadosEventos(kpis).filter(e => ciclo && e.abre_em >= ciclo.inicio && e.abre_em <= ciclo.fim && e.satisfacao != null);
  const kpi3 = evs.length ? evs.reduce((t, e) => t + e.satisfacao * e.respondentes, 0) / evs.reduce((t, e) => t + e.respondentes, 0) : null;

  const diretor = resultadosLideranca(kpis, cicloId).filter(l => l.tipo === "diretor" && l.media != null);
  const kpi7 = diretor.length ? diretor.reduce((t, l) => t + l.media, 0) / diretor.length : null;

  let kpi9 = null, kpi10 = null;
  if (fin?.linhas?.length) {
    const orc = fin.linhas.reduce((t, l) => t + l.orcado, 0);
    const real = fin.linhas.reduce((t, l) => t + l.realizado, 0);
    const missao = fin.linhas.filter(l => /miss[aã]o/i.test(l.desc)).reduce((t, l) => t + l.realizado, 0);
    kpi9 = real > 0 ? (missao / real) * 100 : null;
    kpi10 = orc > 0 ? ((real - orc) / orc) * 100 : null;
  }

  const lista = [
    { num: 1, dim: "impacto", nome: "Retenção de missionários (12 meses)", valor: cad.baseRetencao ? (cad.retidos / cad.baseRetencao) * 100 : null,
      unidade: "%", meta: 90, metaTexto: "≥ 90%", fonte: "Cadastro: ativos há 12 meses que continuam ativos" },
    { num: 2, dim: "impacto", nome: "Novos missionários (últimos 90 dias)", valor: cad.novos90d ?? null,
      unidade: "", meta: 2, metaTexto: "≥ 2 por trimestre", fonte: "Cadastro: data de inclusão" },
    { num: 3, dim: "impacto", nome: "Satisfação com encontros estratégicos", valor: kpi3,
      unidade: "/5", meta: 4, metaTexto: "≥ 4,0", fonte: "Pulso de Evento (EVE-1 e EVE-2) dos eventos do ciclo" },
    { num: 4, dim: "impacto", nome: "% projetos alinhados à missão", valor: man.projetos_alinhados_pct?.valor ?? null, chave: "projetos_alinhados_pct",
      unidade: "%", meta: 80, metaTexto: "≥ 80%", fonte: "Informado pela diretoria", manual: true, atualizadoEm: man.projetos_alinhados_pct?.atualizadoEm },
    { num: 5, dim: "impacto", nome: "Projetos ativos com povos não alcançados", valor: man.projetos_povos_nao_alcancados?.valor ?? null, chave: "projetos_povos_nao_alcancados",
      unidade: "", meta: 5, metaTexto: "≥ 5", fonte: "Informado pela diretoria", manual: true, atualizadoEm: man.projetos_povos_nao_alcancados?.atualizadoEm },
    { num: 6, dim: "capacidade", nome: "Participação dos missionários nas equipes", valor: pctSim(kpis, "rh", "RH-3", cicloId),
      unidade: "%", meta: 75, metaTexto: "≥ 75% responderam Sim", fonte: "Pulso de Área — RH-3 (Sim/Não)" },
    { num: 7, dim: "capacidade", nome: "Avaliação do Diretor Executivo", valor: kpi7,
      unidade: "/5", meta: 4, metaTexto: "≥ 4,0", fonte: "Pulso de Liderança — LID-D-1 a LID-D-4 (sem a autoavaliação)" },
    { num: 8, dim: "capacidade", nome: "Uso do planejamento anual (PLANU)", valor: pctSim(kpis, "operacoes", "OPE-2", cicloId),
      unidade: "%", meta: 75, metaTexto: "≥ 75% responderam Sim", fonte: "Pulso de Área — OPE-2 (Sim/Não)" },
    { num: 9, dim: "eficiencia", nome: "% dos recursos na atividade-fim", valor: kpi9,
      unidade: "%", meta: 70, metaTexto: "≥ 70%", fonte: fin ? `Relatório financeiro de ${fin.mes}` : "Relatório financeiro mensal" },
    { num: 10, dim: "eficiencia", nome: "Orçamento realizado vs. previsto (desvio)", valor: kpi10, inverso: true,
      unidade: "%", meta: 10, metaTexto: "desvio de até ±10%", fonte: fin ? `Relatório financeiro de ${fin.mes}` : "Relatório financeiro mensal" },
  ].map(k => {
    const atingimento = k.inverso
      ? (k.valor === null ? null : Math.abs(k.valor) <= k.meta ? 1 : Math.max(0, k.meta / Math.abs(k.valor)))
      : atinge(k.valor, k.meta);
    const ok = atingimento === null ? null : k.inverso ? Math.abs(k.valor) <= k.meta : k.valor >= k.meta;
    return { ...k, atingimento, ok };
  });

  const dimensoes = DIMENSOES.map(d => {
    const itens = lista.filter(k => k.dim === d.id);
    const comDado = itens.filter(k => k.atingimento !== null);
    return { ...d, itens, nota: comDado.length ? (comDado.reduce((t, k) => t + k.atingimento, 0) / comDado.length) * 100 : null, comDado: comDado.length };
  });
  const validas = dimensoes.filter(d => d.nota !== null);
  const pesoTotal = validas.reduce((t, d) => t + d.peso, 0);
  const indice = pesoTotal ? validas.reduce((t, d) => t + d.nota * d.peso, 0) / pesoTotal : null;

  return { lista, dimensoes, indice, cobertura: lista.filter(k => k.atingimento !== null).length };
}

export const corDoIndice = (v, C) => v === null ? C.muted : v >= 90 ? C.success : v >= 70 ? C.warning : C.danger;

export function formatarKpi(k) {
  if (k.valor === null || k.valor === undefined) return "—";
  if (k.unidade === "/5") return `${k.valor.toFixed(1).replace(".", ",")}/5`;
  if (k.unidade === "%") return `${k.inverso && k.valor > 0 ? "+" : ""}${k.valor.toFixed(1).replace(".", ",")}%`;
  return String(Math.round(k.valor));
}

// Palavras mais citadas nas sugestões (resumo automático simples, sem enviar texto a terceiros).
const PARADAS = new Set(("a o e é de da do das dos em no na nos nas um uma uns umas para por com sem que se mais menos muito " +
  "pouco ao aos à às como mas ou ser ter ter mais isso esse essa este esta seu sua seus suas meu minha nós nos eu ele ela eles elas " +
  "já não sim também quando onde qual quais sobre entre até pela pelo pelas pelos ainda bem há foi são está estão tem têm fazer " +
  "poderia seria pode podem deve devem melhor melhorar sepal cada todos todas todo toda nossa nosso nossos nossas sempre gostaria").split(" "));
export function palavrasMaisCitadas(textos, limite = 12) {
  const cont = {};
  for (const t of textos) {
    const vistas = new Set();
    for (const w of t.toLowerCase().normalize("NFC").match(/[a-zà-ú]{4,}/g) || []) {
      if (PARADAS.has(w) || vistas.has(w)) continue;
      vistas.add(w);
      cont[w] = (cont[w] || 0) + 1;
    }
  }
  return Object.entries(cont).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limite);
}
