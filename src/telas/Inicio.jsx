// Tela inicial: ciclo aberto, o que ainda dá para responder, ações da liderança e participação coletiva.
import { C, TIPOS_PULSO, nivel, proxNivel, fmtData, ICONE_CONQUISTA } from "../tema";
import { Badge, Barra, Titulo, Cartao, Aviso, Vazio } from "../ui";

export const STATUS_ACAO = {
  planejada:    ["Planejada", C.muted],
  em_andamento: ["Em andamento", C.warning],
  concluida:    ["Concluída", C.success],
};

function CardPulso({ tipo, titulo, descricao, selos, pendente, onClick }) {
  const t = TIPOS_PULSO[tipo];
  return (
    <button onClick={pendente ? onClick : undefined} disabled={!pendente} style={{
      background:C.card, borderRadius:16, padding:20, textAlign:"left", fontFamily:"inherit", color:C.text,
      border:`1px solid ${pendente ? C.border : C.success+"50"}`, cursor:pendente?"pointer":"default", transition:"all 0.2s",
      opacity:pendente?1:0.85,
    }}
      onMouseEnter={e=>{ if (pendente) { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.transform="translateY(-2px)"; } }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=pendente?C.border:C.success+"50"; e.currentTarget.style.transform="translateY(0)"; }}
    >
      <div style={{ fontSize:30, marginBottom:10 }}>{t.icon}</div>
      <h4 style={{ margin:"0 0 4px", fontSize:16, fontWeight:700 }}>{titulo}</h4>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 14px", lineHeight:1.5 }}>{descricao}</p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{selos}</div>
    </button>
  );
}

export default function Inicio({ me, banco, papel, acoes, participacao, onAvaliar, onIr }) {
  const m = me.missionario;
  const tl = m?.tl || 0;
  const nv = nivel(tl), prx = proxNivel(tl);
  const ciclo = me.cicloAberto;
  const totalAreas = banco?.areas?.length || 7;
  const areasFeitas = ciclo?.areasRespondidas?.length || 0;
  const lideresPendentes = (me.liderancas || []).filter(l => !l.respondido);
  const eventosPendentes = (me.eventos || []).filter(e => !e.respondido);
  const regras = banco?.talentos;

  return (
    <>
      {!m && (
        <Aviso cor={C.warning} style={{ marginBottom:20 }}>
          Seu acesso ainda não está vinculado a um cadastro de missionário, por isso você não pode responder pulsos.
          {papel === "gestor" ? " Cadastre o seu e-mail em Missionários para participar." : " Fale com a gestão da SEPAL."}
        </Aviso>
      )}

      {m && (
        <Cartao borda={`${nv.cor}40`} style={{ marginBottom:20, backgroundImage:`radial-gradient(ellipse at 90% 10%,${nv.cor}10,transparent 60%)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
            <div style={{
              width:52, height:52, borderRadius:"50%", fontSize:24, flexShrink:0,
              background:`linear-gradient(135deg,${nv.cor},${nv.cor}88)`,
              display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${nv.cor}50`,
            }}>{nv.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}>
                <div>
                  <div style={{ fontSize:14, color:C.muted, letterSpacing:1, textTransform:"uppercase" }}>Seu nível</div>
                  <div style={{ fontWeight:800, fontSize:18, color:nv.cor }}>{nv.nome}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ fontSize:20, fontWeight:900 }}>{tl}</span>
                  {prx.min > tl && <span style={{ color:C.muted, fontSize:14 }}> / {prx.min} TL</span>}
                </div>
              </div>
              {prx.min > tl ? <>
                <div style={{ marginTop:8 }}><Barra valor={tl} max={prx.min} cor={nv.cor}/></div>
                <div style={{ color:C.muted, fontSize:14, marginTop:4 }}>{prx.min - tl} Talentos para {prx.nome}</div>
              </> : <div style={{ color:C.muted, fontSize:14, marginTop:4 }}>Nível máximo alcançado</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {me.conquistas.filter(c=>c.conquistada).map(c=>(
              <div key={c.id} title={c.regra} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"5px 10px", display:"flex", alignItems:"center", gap:5, fontSize:14 }}>
                <span>{ICONE_CONQUISTA[c.id]}</span><span style={{ fontWeight:600 }}>{c.nome}</span>
              </div>
            ))}
            {me.conquistas.every(c=>!c.conquistada) && <span style={{ color:C.muted, fontSize:14 }}>Responda o primeiro pulso para ganhar a conquista Primeira Voz.</span>}
          </div>
        </Cartao>
      )}

      <Titulo>Para responder agora</Titulo>
      {ciclo ? (
        <p style={{ color:C.muted, fontSize:14, margin:"-4px 0 12px" }}>
          Ciclo <b style={{ color:C.text }}>{ciclo.nome}</b> aberto até <b style={{ color:C.text }}>{fmtData(ciclo.fim)}</b>.
        </p>
      ) : (
        <p style={{ color:C.muted, fontSize:14, margin:"-4px 0 12px" }}>Nenhum ciclo de avaliação aberto no momento.</p>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:12, marginBottom:24 }}>
        {ciclo && m && (
          <CardPulso tipo="area" titulo="Pulso de Área" pendente={areasFeitas < totalAreas} onClick={()=>onAvaliar("area")}
            descricao={areasFeitas < totalAreas ? `Avalie as áreas da SEPAL — ${areasFeitas} de ${totalAreas} respondidas neste ciclo.` : `Você avaliou as ${totalAreas} áreas neste ciclo. Obrigado!`}
            selos={<>
              <Badge color={C.purple}>{TIPOS_PULSO.area.tempo}</Badge>
              {regras && <Badge color={C.gold}>+{areasFeitas ? regras.area.adicional : regras.area.primeira} TL</Badge>}
              {areasFeitas >= totalAreas && <Badge color={C.success}>✓ Completo</Badge>}
            </>}/>
        )}
        {ciclo?.inclui_lideranca && m && (me.liderancas || []).length > 0 && (
          <CardPulso tipo="lideranca" titulo="Pulso de Liderança" pendente={lideresPendentes.length > 0} onClick={()=>onAvaliar("lideranca")}
            descricao={lideresPendentes.length ? `${lideresPendentes.length} liderança(s) para avaliar neste ciclo.` : "Você já avaliou as lideranças deste ciclo."}
            selos={<>
              <Badge color={C.purple}>{TIPOS_PULSO.lideranca.tempo}</Badge>
              {regras && <Badge color={C.gold}>+{(me.liderancas.length - lideresPendentes.length) ? regras.lideranca.adicional : regras.lideranca.primeira} TL</Badge>}
            </>}/>
        )}
        {m && (me.eventos || []).length > 0 && (
          <CardPulso tipo="evento" titulo="Pulso de Evento" pendente={eventosPendentes.length > 0} onClick={()=>onAvaliar("evento")}
            descricao={eventosPendentes.length ? `Avalie: ${eventosPendentes.map(e=>e.nome).join(", ")}.` : "Você já avaliou os eventos abertos."}
            selos={<>
              <Badge color={C.purple}>{TIPOS_PULSO.evento.tempo}</Badge>
              {regras && <Badge color={C.gold}>+{regras.evento.primeira} TL</Badge>}
            </>}/>
        )}
        {(!ciclo || !m) && (me.eventos || []).length === 0 && <Vazio>Quando um ciclo ou a avaliação de um evento abrir, ela aparece aqui.</Vazio>}
      </div>

      {participacao?.atual && (
        <Cartao style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, gap:10, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:16 }}>🤝 Participação no ciclo {participacao.atual.cicloNome}</span>
            <button onClick={()=>onIr("participacao")} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit" }}>Ver equipes →</button>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:28, fontWeight:900, color:(participacao.atual.pct ?? 0) >= participacao.meta ? C.success : C.accent }}>{participacao.atual.pct ?? 0}%</span>
            <span style={{ color:C.muted, fontSize:14 }}>dos missionários ativos · meta {participacao.meta}%</span>
          </div>
          <Barra valor={participacao.atual.pct || 0} max={100} cor={(participacao.atual.pct ?? 0) >= participacao.meta ? C.success : C.accent}/>
        </Cartao>
      )}

      <Titulo>Vocês disseram, nós fizemos</Titulo>
      {acoes.length === 0 ? (
        <Vazio>Quando a liderança definir ações a partir dos resultados, elas aparecem aqui, com o andamento de cada uma.</Vazio>
      ) : (
        <Cartao style={{ padding:0, overflow:"hidden", marginBottom:20 }}>
          {acoes.slice(0, 5).map((a, i) => {
            const [rotulo, cor] = STATUS_ACAO[a.status];
            return (
              <div key={a.id} style={{ padding:"14px 18px", borderBottom:i < Math.min(acoes.length, 5) - 1 ? `1px solid ${C.border}` : "none", display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:15 }}>{a.titulo}</div>
                  <div style={{ color:C.muted, fontSize:14, marginTop:2 }}>{a.area}{a.ciclo_nome ? ` · a partir do ciclo ${a.ciclo_nome}` : ""}</div>
                  {a.descricao && <div style={{ color:C.text, fontSize:14, marginTop:6, lineHeight:1.5 }}>{a.descricao}</div>}
                </div>
                <Badge color={cor}>{rotulo}</Badge>
              </div>
            );
          })}
        </Cartao>
      )}

      {papel === "gestor" && (
        <button onClick={()=>onIr("resultados")} style={{
          width:"100%", minHeight:48, padding:"13px 0", borderRadius:12, background:C.surface, marginTop:4,
          color:C.text, border:`1px solid ${C.border}`, cursor:"pointer", fontWeight:600, fontSize:16, fontFamily:"inherit",
        }}>Ver resultados do ciclo →</button>
      )}
    </>
  );
}
