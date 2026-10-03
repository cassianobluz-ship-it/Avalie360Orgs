// Tokens visuais, níveis de Talentos e formatadores compartilhados pelas telas.

export const C = {
  bg: "#0A0E1A", surface: "#111827", card: "#1A2235",
  border: "#2A3550", accent: "#F97316", purple: "#7C3AED",
  text: "#E8EDF5", muted: "#64748B",
  success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
  gold: "#FBBF24", silver: "#94A3B8", bronze: "#CD7F32",
};

export const FONTE = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// Aparência de cada área (o conteúdo das perguntas vem do servidor).
export const VISUAL_AREA = {
  financeiro:  { icon: "💰", cor: "#F97316" },
  cuidado:     { icon: "🤝", cor: "#7C3AED" },
  comunicacao: { icon: "📢", cor: "#10B981" },
  rh:          { icon: "👥", cor: "#F59E0B" },
  ti:          { icon: "💻", cor: "#3B82F6" },
  operacoes:   { icon: "⚙️", cor: "#EC4899" },
  estrategia:  { icon: "🎯", cor: "#14B8A6" },
};

export const TIPOS_PULSO = {
  area:      { label: "Pulso de Área",      icon: "🏛️", freq: "Por ciclo",   tempo: "~3 min" },
  evento:    { label: "Pulso de Evento",    icon: "📅", freq: "Após eventos", tempo: "~2 min" },
  lideranca: { label: "Pulso de Liderança", icon: "🌟", freq: "Por ciclo",   tempo: "~3 min" },
};

// Níveis são só de Talentos (participação); as conquistas têm nomes próprios, sem repetir os níveis.
export const NIVEIS = [
  { min: 500, nome: "Embaixador",   cor: C.gold,    icon: "👑" },
  { min: 300, nome: "Referência",   cor: "#C084FC", icon: "⭐" },
  { min: 200, nome: "Voz Ativa",    cor: C.accent,  icon: "📣" },
  { min: 100, nome: "Contribuidor", cor: C.success, icon: "🌱" },
  { min: 0,   nome: "Iniciante",    cor: C.muted,   icon: "🌿" },
];
export const nivel     = tl => NIVEIS.find(n => tl >= n.min);
export const proxNivel = tl => NIVEIS[Math.max(0, NIVEIS.findIndex(n => tl >= n.min) - 1)];

export const ICONE_CONQUISTA = { primeira_voz: "🎙️", fiel: "🔥", voz_missao: "📣", panorama: "🧭", guardiao: "🛡️" };

export const fmtData   = iso => iso ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR") : "—";
export const fmtMesAno = iso => iso ? new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—";
export const fmtNota   = v => (v === null || v === undefined ? "—" : v.toFixed(1).replace(".", ","));
export const fmtPct    = v => (v === null || v === undefined ? "—" : `${Math.round(v)}%`);
export const fmtBRL    = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const linkWA    = (num, msg) => `https://wa.me/${String(num || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
export const linkEmail = (email, assunto, corpo) => `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

// Classificação das médias (escala 1–5), igual em todas as telas e no relatório.
export const classificar = v => v >= 4.5 ? ["Excelente", C.success] : v >= 4 ? ["Bom", C.accent] : v >= 3.5 ? ["Regular", C.warning] : ["Atenção", C.danger];

export function aniversariantesHoje(lista) {
  const hoje = new Date();
  return lista.filter(m => {
    if (!m.nascimento) return false;
    const d = new Date(m.nascimento + "T12:00:00");
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
  });
}
