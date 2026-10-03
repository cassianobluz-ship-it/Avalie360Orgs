// Meu Perfil (dados reais da própria pessoa) e Participação coletiva (substitui o ranking individual).
import { useState } from "react";
import { api } from "../api";
import { C, nivel, proxNivel, fmtData, fmtMesAno, TIPOS_PULSO, ICONE_CONQUISTA } from "../tema";
import { Badge, Barra, Titulo, Cartao, Vazio, Modal, Btn, FieldInput } from "../ui";
import { TextoPrivacidade } from "./Acesso";

export function Perfil({ me, token, onSenhaTrocada }) {
  const m = me.missionario;
  const tl = m?.tl || 0;
  const nv = nivel(tl), prx = proxNivel(tl);
  const ciclos = new Set(me.historico.filter(h => h.cicloNome).map(h => h.cicloNome)).size;
  const [modal, setModal] = useState(null);

  return (
    <div>
      <Cartao borda={`${nv.cor}40`} style={{ marginBottom:16, backgroundImage:`radial-gradient(ellipse at 80% 0%,${nv.cor}12,transparent 50%)` }}>
        <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
          <div style={{
            width:70, height:70, borderRadius:"50%", fontSize:32, flexShrink:0,
            background:`linear-gradient(135deg,${nv.cor},${nv.cor}66)`, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 24px ${nv.cor}60`, border:`3px solid ${nv.cor}`,
          }}>{nv.icon}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:20 }}>{m?.nome || me.usuario.nome}</div>
            <div style={{ color:nv.cor, fontWeight:700 }}>{nv.nome}</div>
            {m && <div style={{ color:C.muted, fontSize:14 }}>Membro desde {fmtMesAno(m.membroDesde)}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          {[["Talentos", tl, C.accent], ["Pulsos respondidos", me.historico.length, C.success], ["Ciclos com participação", ciclos, C.gold]].map(([label, val, cor]) => (
            <div key={label} style={{ flex:1, minWidth:120, background:C.bg, borderRadius:12, padding:"12px 0", textAlign:"center", border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:22, fontWeight:900, color:cor }}>{val}</div>
              <div style={{ color:C.muted, fontSize:14 }}>{label}</div>
            </div>
          ))}
        </div>
        {prx.min > tl && <>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ color:C.muted, fontSize:14 }}>Progresso para {prx.nome}</span>
            <span style={{ color:nv.cor, fontWeight:700, fontSize:14 }}>{tl}/{prx.min} TL</span>
          </div>
          <Barra valor={tl} max={prx.min} cor={nv.cor}/>
        </>}
      </Cartao>

      <Titulo>Conquistas</Titulo>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10, marginBottom:20 }}>
        {me.conquistas.map(c => (
          <div key={c.id} style={{
            background:c.conquistada?C.card:C.bg, borderRadius:14, padding:"14px 16px",
            border:`1px solid ${c.conquistada?C.accent+"50":C.border}`,
          }}>
            <div style={{ fontSize:28, marginBottom:6, filter:c.conquistada?"none":"grayscale(1)", opacity:c.conquistada?1:0.5 }}>{c.conquistada ? ICONE_CONQUISTA[c.id] : "🔒"}</div>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{c.nome}</div>
            <div style={{ color:C.muted, fontSize:14, lineHeight:1.4 }}>{c.regra}</div>
            {!c.conquistada && <>
              <div style={{ marginTop:8 }}><Barra valor={c.progresso} max={c.meta} cor={C.accent} h={4}/></div>
              <div style={{ color:C.accent, fontSize:13, marginTop:4, fontWeight:600 }}>{c.progresso} de {c.meta}</div>
            </>}
          </div>
        ))}
      </div>

      <Titulo>Histórico</Titulo>
      {me.historico.length === 0 ? <Vazio>Você ainda não respondeu nenhum pulso.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden", marginBottom:20 }}>
          {me.historico.map((h, i) => (
            <div key={i} style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, borderBottom:i < me.historico.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize:22 }}>{TIPOS_PULSO[h.tipoPulso].icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{TIPOS_PULSO[h.tipoPulso].label}{h.autoavaliacao ? " (autoavaliação)" : ""}</div>
                <div style={{ color:C.muted, fontSize:14 }}>{h.objetoNome}{h.cicloNome ? ` · ciclo ${h.cicloNome}` : ""} · {fmtData(h.data)}</div>
              </div>
              {h.talentos > 0 && <Badge color={C.gold}>+{h.talentos} TL</Badge>}
            </div>
          ))}
        </Cartao>
      )}

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn outline small color={C.muted} onClick={()=>setModal("privacidade")}>🔒 Aviso de privacidade</Btn>
        <Btn outline small color={C.muted} onClick={()=>setModal("senha")}>🔑 Trocar senha</Btn>
      </div>

      {modal === "privacidade" && <Modal titulo="Aviso de privacidade" largura={640} onClose={()=>setModal(null)}><TextoPrivacidade/></Modal>}
      {modal === "senha" && <TrocarSenhaModal token={token} onClose={()=>setModal(null)} onSenhaTrocada={onSenhaTrocada}/>}
    </div>
  );
}

function TrocarSenhaModal({ token, onClose, onSenhaTrocada }) {
  const [atual, setAtual] = useState(""), [nova, setNova] = useState(""), [conf, setConf] = useState("");
  const [msg, setMsg] = useState(null);
  async function salvar() {
    if (nova.length < 8) return setMsg(["A nova senha precisa ter pelo menos 8 caracteres.", C.danger]);
    if (nova !== conf) return setMsg(["A confirmação não confere.", C.danger]);
    try {
      const r = await api.trocarSenha(token, atual, nova);
      onSenhaTrocada(r.usuario, r.token);
      setMsg(["Senha alterada.", C.success]);
      setTimeout(onClose, 900);
    } catch (e) { setMsg([e.message, C.danger]); }
  }
  return (
    <Modal titulo="Trocar senha" onClose={onClose}>
      <FieldInput label="Senha atual" type="password" value={atual} onChange={e=>setAtual(e.target.value)} autoComplete="current-password"/>
      <FieldInput label="Nova senha (mínimo 8 caracteres)" type="password" value={nova} onChange={e=>setNova(e.target.value)} autoComplete="new-password"/>
      <FieldInput label="Repita a nova senha" type="password" value={conf} onChange={e=>setConf(e.target.value)} autoComplete="new-password"/>
      {msg && <p style={{ color:msg[1], fontSize:14, margin:"0 0 10px" }}>{msg[0]}</p>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn outline color={C.muted} onClick={onClose}>Cancelar</Btn>
        <Btn onClick={salvar}>Salvar</Btn>
      </div>
    </Modal>
  );
}

export function Participacao({ participacao }) {
  if (!participacao?.atual) return <Vazio>A participação aparece aqui quando o primeiro ciclo de avaliação começar.</Vazio>;
  const { atual, anterior, porEquipe, meta } = participacao;
  const cor = p => (p ?? 0) >= meta ? C.success : (p ?? 0) >= meta * 0.7 ? C.warning : C.danger;
  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>🤝 Participação</h2>
        <p style={{ color:C.muted, fontSize:14, margin:0, lineHeight:1.5 }}>
          Quanto mais gente participa, mais confiáveis são os resultados. Aqui não há ranking de pessoas: o que conta é a participação de todos.
        </p>
      </div>
      <Cartao style={{ marginBottom:20 }}>
        <div style={{ color:C.muted, fontSize:14, textTransform:"uppercase", letterSpacing:1 }}>Ciclo {atual.cicloNome}</div>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, margin:"6px 0 10px", flexWrap:"wrap" }}>
          <span style={{ fontSize:40, fontWeight:900, color:cor(atual.pct) }}>{atual.pct ?? 0}%</span>
          <span style={{ color:C.muted }}>{atual.participantes} de {atual.ativos} missionários ativos · meta {meta}%</span>
        </div>
        <Barra valor={atual.pct || 0} max={100} cor={cor(atual.pct)} h={10}/>
        {anterior && <div style={{ color:C.muted, fontSize:14, marginTop:10 }}>No ciclo anterior ({anterior.cicloNome}): {anterior.pct ?? 0}%</div>}
      </Cartao>
      <Titulo>Por equipe</Titulo>
      <Cartao style={{ padding:0, overflow:"hidden" }}>
        {porEquipe.length === 0 && <div style={{ padding:20, color:C.muted }}>Sem equipes com missionários ativos.</div>}
        {porEquipe.map((e, i) => (
          <div key={e.equipeId} style={{ padding:"14px 18px", borderBottom:i < porEquipe.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, gap:10 }}>
              <span style={{ fontWeight:600 }}>{(e.pct ?? 0) >= meta ? "🏅 " : ""}{e.equipe}</span>
              <span style={{ fontWeight:800, color:cor(e.pct) }}>{e.pct ?? 0}% <span style={{ color:C.muted, fontWeight:400, fontSize:14 }}>({e.participantes}/{e.ativos})</span></span>
            </div>
            <Barra valor={e.pct || 0} max={100} cor={cor(e.pct)}/>
          </div>
        ))}
      </Cartao>
      <p style={{ color:C.muted, fontSize:14, marginTop:12 }}>🏅 Equipes que atingiram a meta de participação do ciclo.</p>
    </div>
  );
}
