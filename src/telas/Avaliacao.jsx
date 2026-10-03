// Responder um pulso: escolher o que avaliar → perguntas → envio confirmado pelo servidor.
import { useState } from "react";
import { api } from "../api";
import { C, FONTE, TIPOS_PULSO, VISUAL_AREA } from "../tema";
import { AppHeader, Badge, EscalaInput, BinariaInput, NpsInput, Toast, Aviso } from "../ui";

function perguntasDoPulso(tipo, objeto, banco, me) {
  const excluidas = me.cicloAberto?.perguntas_excluidas || [];
  let lista = [];
  if (tipo === "area") lista = banco.areas.find(a => a.id === objeto.id)?.perguntas || [];
  if (tipo === "evento") lista = banco.evento.perguntas;
  if (tipo === "lideranca") lista = banco.lideranca[objeto.tipo].perguntas.map(p => objeto.souEu ? { ...p, texto: p.textoAuto } : p);
  lista = lista.filter(p => tipo === "evento" || !excluidas.includes(p.codigo));
  // Pergunta-âncora: uma vez por ciclo, no fim do primeiro pulso respondido.
  if (tipo !== "evento" && me.cicloAberto?.ancoraPendente) lista = [...lista, { ...banco.ancora, ancora: true }];
  return lista;
}

export default function Avaliacao({ tipo, me, banco, token, papel, onVoltar, onConcluido }) {
  const t = TIPOS_PULSO[tipo];
  const [objeto, setObjeto] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [atual, setAtual] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  const objetos = tipo === "area"
    ? banco.areas.map(a => ({ id: a.id, nome: a.nome, icon: VISUAL_AREA[a.id]?.icon, feito: me.cicloAberto?.areasRespondidas?.includes(a.id) }))
    : tipo === "lideranca"
      ? (me.liderancas || []).map(l => ({ ...l, icon: l.tipo === "diretor" ? "🏆" : "🤝", feito: l.respondido }))
      : (me.eventos || []).map(e => ({ ...e, icon: "📅", feito: e.respondido }));

  const perguntas = objeto ? perguntasDoPulso(tipo, objeto, banco, me) : [];
  const perg = perguntas[atual];
  const respondida = p => p && (p.tipo === "aberta" || (respostas[p.codigo] !== undefined && respostas[p.codigo] !== ""));
  const ultima = atual === perguntas.length - 1;

  async function enviar() {
    setEnviando(true);
    setErro("");
    try {
      const lista = perguntas.filter(p => respostas[p.codigo] !== undefined && respostas[p.codigo] !== "")
        .map(p => ({ codigo: p.codigo, valor: respostas[p.codigo] }));
      const r = await api.enviarPulso(token, { tipoPulso: tipo, objetoId: String(objeto.id), respostas: lista });
      setResultado(r);
      onConcluido();
    } catch (e) {
      setErro(e.message || "Não foi possível enviar. Suas respostas continuam aqui; tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const pagina = (conteudo, sub) => (
    <div style={{ fontFamily:FONTE, background:C.bg, minHeight:"100vh", color:C.text }}>
      <AppHeader papel={papel} tl={me.missionario?.tl} onHome={onVoltar}/>
      {sub}
      {conteudo}
    </div>
  );

  if (resultado) return (
    <div style={{ fontFamily:FONTE, background:C.bg, minHeight:"100vh", color:C.text, display:"flex", alignItems:"center", justifyContent:"center",
      backgroundImage:`radial-gradient(ellipse at 50% 50%,${C.accent}08,transparent 70%)` }}>
      <Toast titulo={`+${resultado.talentosGanhos} Talentos!`} texto="Sua contribuição foi registrada"/>
      <div style={{ textAlign:"center", padding:"32px 20px", maxWidth:420, boxSizing:"border-box" }}>
        <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontSize:24, margin:"0 0 8px" }}>Avaliação enviada!</h2>
        <p style={{ color:C.muted, marginBottom:20, lineHeight:1.6 }}>
          Sua voz sobre <strong style={{ color:C.text }}>{objeto.nome}</strong> foi registrada de forma confidencial. Obrigado por fortalecer a SEPAL!
        </p>
        <div style={{ background:`linear-gradient(135deg,${C.gold}20,${C.accent}20)`, border:`1px solid ${C.gold}50`, borderRadius:16, padding:"16px 24px", marginBottom:24 }}>
          <div style={{ fontSize:32, fontWeight:900, color:C.gold }}>+{resultado.talentosGanhos} Talentos</div>
          <div style={{ color:C.muted, fontSize:14 }}>Total agora: {resultado.totalTalentos} TL</div>
        </div>
        <button onClick={onVoltar} style={{
          width:"100%", minHeight:48, padding:"14px 0", borderRadius:12, cursor:"pointer", fontFamily:"inherit",
          background:`linear-gradient(135deg,${C.accent},#EA580C)`, color:"#fff", fontWeight:600, fontSize:16, border:"none",
          boxShadow:`0 4px 20px ${C.accent}50`,
        }}>Voltar ao início</button>
      </div>
    </div>
  );

  const voltarBarra = (
    <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"15px 20px", display:"flex", alignItems:"center", gap:14 }}>
      <button onClick={objeto ? ()=>{ setObjeto(null); setErro(""); } : onVoltar} aria-label="Voltar" style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:22 }}>←</button>
      <span style={{ fontWeight:700 }}>{t.icon} {t.label}</span>
    </div>
  );

  if (!objeto) return pagina(
    <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 20px", boxSizing:"border-box" }}>
      <h2 style={{ fontSize:22, margin:"0 0 4px" }}>O que você vai avaliar?</h2>
      <p style={{ color:C.muted, margin:"0 0 22px", fontSize:14 }}>
        {t.tempo} · respostas confidenciais{me.cicloAberto && tipo !== "evento" ? ` · ciclo ${me.cicloAberto.nome}` : ""}
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {objetos.map(o => (
          <button key={o.id} disabled={o.feito} onClick={()=>{ setObjeto(o); setAtual(0); setRespostas({}); }} style={{
            background:C.card, borderRadius:16, padding:20, cursor:o.feito?"default":"pointer", textAlign:"left", fontFamily:"inherit", color:C.text,
            border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:14, transition:"all 0.15s", opacity:o.feito?0.6:1,
          }}
            onMouseEnter={e=>{ if (!o.feito) { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform="translateX(4px)"; } }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="translateX(0)"; }}
          >
            <span style={{ fontSize:26 }}>{o.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>{o.nome}</div>
              <div style={{ color:C.muted, fontSize:14, marginTop:2 }}>
                {o.feito ? "Já respondido" + (tipo === "evento" ? "" : " neste ciclo") : `${perguntasDoPulso(tipo, o, banco, me).length} perguntas`}
              </div>
            </div>
            {o.feito ? <Badge color={C.success}>✓ Feito</Badge> : o.souEu ? <Badge color={C.purple}>Autoavaliação</Badge> : null}
          </button>
        ))}
      </div>
      {objeto === null && objetos.every(o => o.feito) && (
        <p style={{ color:C.muted, fontSize:14, marginTop:16 }}>Tudo respondido por aqui. Obrigado!</p>
      )}
    </div>, voltarBarra);

  return pagina(
    <div style={{ maxWidth:560, margin:"0 auto", padding:"28px 20px", boxSizing:"border-box" }}>
      {objeto.souEu && atual === 0 && (
        <Aviso cor={C.purple} style={{ marginBottom:14 }}>
          Esta é a sua autoavaliação como líder. Ela aparece para a gestão ao lado da média da equipe, para comparar as duas visões.
        </Aviso>
      )}
      <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${perg.ancora ? C.gold+"60" : C.border}` }}>
        <p style={{ color:C.muted, fontSize:14, letterSpacing:2, textTransform:"uppercase", margin:"0 0 10px" }}>
          {perg.ancora ? "Pergunta do ciclo" : `Pergunta ${atual + 1} de ${perguntas.length}`}
        </p>
        <h3 style={{ fontSize:18, fontWeight:600, lineHeight:1.55, margin:"0 0 6px" }}>{perg.texto}</h3>
        <p style={{ color:C.muted, fontSize:14, margin:"0 0 20px" }}>
          {perg.tipo === "escala" ? "Quanto você concorda com esta afirmação?" : perg.tipo === "aberta" ? "Opcional." : perg.ancora ? "Feita uma vez por ciclo, para acompanhar a evolução ao longo do tempo." : ""}
        </p>
        {perg.tipo === "escala"  && <EscalaInput  value={respostas[perg.codigo]} onChange={v=>setRespostas(r=>({...r,[perg.codigo]:v}))}/>}
        {perg.tipo === "binaria" && <BinariaInput value={respostas[perg.codigo]} onChange={v=>setRespostas(r=>({...r,[perg.codigo]:v}))}/>}
        {perg.tipo === "nps"     && <NpsInput     value={respostas[perg.codigo]} onChange={v=>setRespostas(r=>({...r,[perg.codigo]:v}))}/>}
        {perg.tipo === "aberta"  && (
          <textarea value={respostas[perg.codigo] || ""} maxLength={1000} onChange={e=>setRespostas(r=>({...r,[perg.codigo]:e.target.value}))}
            placeholder="Escreva sua resposta (opcional). Evite colocar informações que identifiquem você."
            style={{ width:"100%", minHeight:110, background:C.bg, color:C.text, fontSize:16, padding:14, border:`1px solid ${C.border}`, borderRadius:12, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }}/>
        )}
      </div>
      {erro && <Aviso style={{ marginTop:14 }}>⚠ {erro}</Aviso>}
      <div style={{ display:"flex", gap:12, marginTop:16 }}>
        {atual > 0
          ? <button onClick={()=>setAtual(p=>p-1)} style={{ flex:1, minHeight:48, borderRadius:12, background:C.card, color:C.text, border:`1px solid ${C.border}`, cursor:"pointer", fontWeight:600, fontSize:16, fontFamily:"inherit" }}>← Anterior</button>
          : <div style={{ flex:1 }}/>}
        <button disabled={enviando || !respondida(perg)} onClick={()=>ultima ? enviar() : setAtual(p=>p+1)} style={{
          flex:2, minHeight:48, borderRadius:12, cursor:(enviando || !respondida(perg)) ? "default" : "pointer", fontFamily:"inherit",
          background:`linear-gradient(135deg,${C.accent},#EA580C)`, color:"#fff", fontWeight:600, fontSize:16, border:"none",
          boxShadow:`0 4px 16px ${C.accent}40`, opacity:(enviando || !respondida(perg)) ? 0.5 : 1,
        }}>{enviando ? "Enviando..." : ultima ? (erro ? "Tentar enviar de novo" : "Enviar ✓") : "Próxima →"}</button>
      </div>
      {!respondida(perg) && <p style={{ color:C.muted, fontSize:14, textAlign:"center", marginTop:10 }}>Responda para continuar.</p>}
    </div>,
    <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"15px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
        <button onClick={()=>{ setObjeto(null); setErro(""); }} aria-label="Voltar" style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:22 }}>←</button>
        <span style={{ fontWeight:700 }}>{objeto.icon} {objeto.nome}</span>
        <span style={{ marginLeft:"auto", color:C.muted, fontSize:14 }}>{atual + 1}/{perguntas.length}</span>
      </div>
      <div style={{ height:5, background:C.border, borderRadius:10, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:10, transition:"width 0.4s ease", width:`${((atual + 1) / perguntas.length) * 100}%`,
          background:`linear-gradient(90deg,${C.accent},${C.purple})` }}/>
      </div>
    </div>
  );
}
