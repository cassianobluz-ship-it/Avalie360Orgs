// Gestão de missionários e dos acessos ao sistema (só gestor). Contas são criadas aqui, com senha provisória.
import { useEffect, useRef, useState } from "react";
import { api, MODO_DEMO } from "../api";
import { C, fmtData, linkWA, linkEmail, aniversariantesHoje } from "../tema";
import { Badge, Btn, Modal, FieldInput, FieldSelect, FieldTexto, Aviso } from "../ui";

const URL_SITE = "https://www.avalie360.com.br";
const MISS_VAZIO = { nome:"", email:"", whatsapp:"", equipeId:"", nascimento:"", status:"ativo" };

function estadoDoAcesso(u) {
  if (!u) return ["Sem acesso", C.muted];
  if (u.trocaSenhaPendente) return ["Aguardando 1º acesso", C.warning];
  return [u.papel === "gestor" ? "Ativo · gestor" : "Ativo", C.success];
}

export default function Missionarios({ token, usuarioLogado }) {
  const [missionarios, setMissionarios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState(""), [filtroEquipe, setFiltroEquipe] = useState(""), [filtroStatus, setFiltroStatus] = useState("");
  const [modal, setModal] = useState(null);      // { tipo, dados }
  const [form, setForm] = useState(MISS_VAZIO);
  const [erroForm, setErroForm] = useState("");
  const fileRef = useRef();

  async function carregar() {
    try {
      const [ms, us, eqs] = await Promise.all([api.listarMissionarios(token), api.listarUsuarios(token), api.listarEquipes(token)]);
      setMissionarios(ms); setUsuarios(us); setEquipes(eqs.map(e => ({ id:e.id, lider:e.nome })));
      setErro("");
    } catch (e) { setErro(e.message); }
  }
  useEffect(() => { carregar(); }, [token]);

  const contaDe = m => usuarios.find(u => u.email === (m.email || "").toLowerCase());
  const semCadastro = usuarios.filter(u => !missionarios.some(m => (m.email || "").toLowerCase() === u.email));
  const lista = missionarios.filter(m =>
    (m.nome.toLowerCase().includes(busca.toLowerCase()) || (m.email || "").toLowerCase().includes(busca.toLowerCase())) &&
    (!filtroEquipe || m.equipeId === filtroEquipe) && (!filtroStatus || m.status === filtroStatus));
  const aniversariantes = aniversariantesHoje(missionarios);
  const ativos = missionarios.filter(m => m.status === "ativo");

  // ── Missionário: criar/editar/remover ──
  function abrirForm(m) { setForm(m ? { ...MISS_VAZIO, ...m, nascimento: m.nascimento || "" } : MISS_VAZIO); setErroForm(""); setModal({ tipo:"form", dados:m || null }); }
  async function salvar() {
    try {
      if (modal.dados) await api.atualizarMissionario(token, modal.dados.id, form);
      else await api.criarMissionario(token, form);
      setModal(null); carregar();
    } catch (e) { setErroForm(e.message); }
  }
  async function excluir(m) {
    if (!window.confirm(`Remover ${m.nome} do cadastro? O histórico de participação dele(a) também será apagado. As respostas, que são anônimas, continuam nos resultados.`)) return;
    try { await api.removerMissionario(token, m.id); carregar(); } catch (e) { setErro(e.message); }
  }

  // ── Acesso: criar, redefinir senha, papel, remover ──
  async function criarAcesso(m, papel="missionario") {
    try {
      const r = await api.criarUsuario(token, { email:m.email, nome:m.nome, papel });
      setModal({ tipo:"senha", dados:{ nome:m.nome, email:m.email, whatsapp:m.whatsapp, senha:r.senhaProvisoria, nova:true } });
      carregar();
    } catch (e) { setErro(e.message); }
  }
  async function redefinir(u, m) {
    if (!window.confirm(`Gerar uma nova senha provisória para ${u.nome}? A senha atual deixa de funcionar.`)) return;
    try {
      const r = await api.redefinirSenha(token, u.id);
      setModal({ tipo:"senha", dados:{ nome:u.nome, email:u.email, whatsapp:m?.whatsapp, senha:r.senhaProvisoria } });
      carregar();
    } catch (e) { setErro(e.message); }
  }
  async function trocarPapel(u) {
    const novo = u.papel === "gestor" ? "missionario" : "gestor";
    if (!window.confirm(novo === "gestor" ? `Dar acesso de GESTOR a ${u.nome}? Gestores veem cadastros, resultados e administram acessos.` : `Retirar o acesso de gestor de ${u.nome}?`)) return;
    try { await api.alterarPapel(token, u.id, novo); carregar(); } catch (e) { setErro(e.message); }
  }
  async function removerAcesso(u) {
    if (!window.confirm(`Remover o acesso de ${u.nome} ao sistema? O cadastro de missionário continua.`)) return;
    try { await api.removerUsuario(token, u.id); carregar(); } catch (e) { setErro(e.message); }
  }

  // ── Importação CSV ──
  const [csv, setCsv] = useState(null), [erroCsv, setErroCsv] = useState("");
  function lerCsv(e) {
    const arq = e.target.files[0]; if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = ev => {
      const linhas = ev.target.result.trim().split(/\r?\n/).map(l => l.split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, "")));
      const cab = linhas[0].map(h => h.toLowerCase());
      const dados = linhas.slice(1).map(cols => Object.fromEntries(cab.map((h, i) => [h, cols[i] || ""])));
      const faltando = ["nome", "email"].filter(c => !cab.includes(c));
      if (faltando.length) { setErroCsv(`Colunas ausentes: ${faltando.join(", ")}`); setCsv(null); return; }
      setCsv(dados); setErroCsv("");
    };
    leitor.readAsText(arq, "UTF-8");
    e.target.value = "";
  }
  async function importar() {
    const falhas = [];
    for (const r of csv) {
      try {
        await api.criarMissionario(token, { nome:r.nome, email:r.email, whatsapp:r.whatsapp, equipeId:r.equipeid || "",
          nascimento:/^\d{4}-\d{2}-\d{2}$/.test(r.nascimento) ? r.nascimento : "", status:r.status === "inativo" ? "inativo" : "ativo" });
      } catch { falhas.push(r.nome || r.email); }
    }
    setModal(null); setCsv(null); carregar();
    if (falhas.length) setErro(`Não foi possível importar: ${falhas.join(", ")} (e-mail repetido ou dados inválidos).`);
  }

  // ── Equipes ──
  const [listaEquipes, setListaEquipes] = useState([]), [novoLider, setNovoLider] = useState("");
  async function salvarEquipes() {
    try {
      const novos = new Set(listaEquipes.map(e => e.id)), antigos = new Set(equipes.map(e => e.id));
      for (const e of equipes.filter(e => !novos.has(e.id))) await api.removerEquipe(token, e.id);
      for (const e of listaEquipes.filter(e => antigos.has(e.id))) if (equipes.find(o => o.id === e.id)?.lider !== e.lider) await api.atualizarEquipe(token, e.id, e.lider);
      for (const e of listaEquipes.filter(e => !antigos.has(e.id))) await api.criarEquipe(token, e.lider);
      setModal(null); carregar();
    } catch (e) { setErro(e.message); }
  }

  // ── Comunicação: mensagem, alerta geral e lembrete do ciclo ──
  const [canal, setCanal] = useState("wa_grupo"), [texto, setTexto] = useState(""), [assunto, setAssunto] = useState("Aviso da SEPAL");
  const [grupoWA, setGrupoWA] = useState(""), [fila, setFila] = useState(null), [idx, setIdx] = useState(0);
  async function abrirLembrete() {
    try {
      const r = await api.pendentes(token);
      if (!r.ciclo) { setErro("Não há ciclo aberto para lembrar."); return; }
      setTexto(`Olá! O ciclo ${r.ciclo.nome} do Avalie360 está aberto até ${fmtData(r.ciclo.fim)}. Leva só alguns minutos e suas respostas são confidenciais: ${URL_SITE}`);
      setAssunto(`Avalie360: ciclo ${r.ciclo.nome} aberto`);
      setCanal("wa_individual"); setFila(null); setIdx(0);
      setModal({ tipo:"comunicar", dados:{ titulo:`🔔 Lembrete do ciclo ${r.ciclo.nome}`, destinatarios:r.pendentes, lembrete:true } });
    } catch (e) { setErro(e.message); }
  }
  function abrirAlerta() {
    setTexto(""); setAssunto("Aviso da SEPAL"); setCanal("wa_grupo"); setFila(null); setIdx(0);
    setModal({ tipo:"comunicar", dados:{ titulo:"📣 Alerta para todos", destinatarios:ativos } });
  }
  function iniciarEnvio() {
    if (canal === "wa_grupo") { window.open(grupoWA + (texto ? `?text=${encodeURIComponent(texto)}` : ""), "_blank"); setFila("fim"); return; }
    setFila(modal.dados.destinatarios); setIdx(0);
  }
  function proximo() {
    const m = fila[idx];
    window.open(canal === "wa_individual" ? linkWA(m.whatsapp, texto) : linkEmail(m.email, assunto, texto), "_blank");
    if (idx + 1 < fila.length) setIdx(idx + 1); else setFila("fim");
  }

  const botaoIcone = (titulo, icone, cor, onClick) => (
    <button title={titulo} aria-label={titulo} onClick={onClick} style={{ background:cor+"22", border:`1px solid ${cor}44`, color:cor, borderRadius:8, padding:"6px 9px", cursor:"pointer", fontSize:14 }}>{icone}</button>
  );
  const selecao = { height:48, padding:"0 14px", borderRadius:12, fontSize:16, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:22, fontWeight:700, margin:0 }}>👥 Missionários e acessos</h2>
        <span style={{ color:C.muted, fontSize:14 }}>{missionarios.length} cadastrados · {usuarios.length} com acesso</span>
      </div>
      {erro && <Aviso style={{ marginBottom:16 }}>⚠ {erro}</Aviso>}

      {aniversariantes.length > 0 && (
        <div style={{ background:`linear-gradient(135deg,${C.gold}20,${C.accent}10)`, border:`1px solid ${C.gold}40`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
          <span style={{ fontSize:28 }}>🎂</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:16, color:C.gold }}>{aniversariantes.length === 1 ? `Hoje é aniversário de ${aniversariantes[0].nome}!` : `${aniversariantes.length} aniversariantes hoje!`}</div>
            <div style={{ color:C.muted, fontSize:14 }}>Envie uma mensagem de celebração</div>
          </div>
          {aniversariantes.map(m => (
            <div key={m.id} style={{ display:"flex", gap:6 }}>
              <Btn small color={C.success} onClick={()=>window.open(linkWA(m.whatsapp, `Parabéns, ${m.nome.split(" ")[0]}! 🎉 A SEPAL celebra com você!`), "_blank")}>💬 WhatsApp</Btn>
              <Btn small outline onClick={()=>window.open(linkEmail(m.email, `Feliz aniversário, ${m.nome.split(" ")[0]}! 🎉`, `Olá ${m.nome.split(" ")[0]},\n\nA SEPAL celebra com você neste dia especial!\n\nCom carinho,\nEquipe SEPAL`), "_blank")}>📧 E-mail</Btn>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
        <Btn onClick={()=>abrirForm(null)}>+ Novo missionário</Btn>
        <Btn outline onClick={()=>{ setCsv(null); setErroCsv(""); setModal({ tipo:"importar" }); }}>📥 Importar planilha</Btn>
        <Btn outline color={C.purple} onClick={()=>{ setListaEquipes(equipes); setModal({ tipo:"equipes" }); }}>👥 Equipes</Btn>
        <Btn outline color={C.success} onClick={abrirLembrete}>🔔 Lembrar quem não participou</Btn>
        <Btn outline color={C.warning} onClick={abrirAlerta}>📣 Alerta para todos</Btn>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔍 Buscar por nome ou e-mail..." aria-label="Buscar" style={{ ...selecao, flex:2, minWidth:200 }}/>
        <select value={filtroEquipe} onChange={e=>setFiltroEquipe(e.target.value)} aria-label="Equipe" style={{ ...selecao, flex:1, minWidth:150 }}>
          <option value="">Todas as equipes</option>
          {equipes.map(e => <option key={e.id} value={e.id}>Equipe de {e.lider}</option>)}
        </select>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} aria-label="Status" style={{ ...selecao, flex:1, minWidth:120 }}>
          <option value="">Todos</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option>
        </select>
      </div>

      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflowX:"auto" }}>
        <div style={{ minWidth:860 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.8fr 2fr 1.2fr 1fr 1.4fr 1.6fr", padding:"12px 18px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:13, letterSpacing:1, textTransform:"uppercase" }}>
            <span>Nome</span><span>Contato</span><span>Equipe</span><span>Status</span><span>Acesso</span><span>Ações</span>
          </div>
          {lista.length === 0 && <div style={{ padding:40, textAlign:"center", color:C.muted }}>Nenhum missionário encontrado</div>}
          {lista.map((m, i) => {
            const u = contaDe(m);
            const [rotulo, cor] = estadoDoAcesso(u);
            const eq = equipes.find(e => e.id === m.equipeId);
            return (
              <div key={m.id} style={{ display:"grid", gridTemplateColumns:"1.8fr 2fr 1.2fr 1fr 1.4fr 1.6fr", padding:"14px 18px", alignItems:"center", borderBottom:i < lista.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{m.nome}</div><div style={{ color:C.muted, fontSize:13 }}>{m.tl} TL · nasc. {fmtData(m.nascimento)}</div></div>
                <div><div style={{ fontSize:13, color:C.muted }}>{m.email || "—"}</div><div style={{ fontSize:13, color:C.muted }}>{m.whatsapp || "—"}</div></div>
                <div style={{ fontSize:14 }}>{eq ? `Eq. ${eq.lider.split(" ")[0]}` : "—"}</div>
                <div><Badge color={m.status === "ativo" ? C.success : C.muted}>{m.status === "ativo" ? "Ativo" : "Inativo"}</Badge></div>
                <div><Badge color={cor} style={{ fontSize:12 }}>{rotulo}</Badge></div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {botaoIcone("Mensagem", "💬", C.success, ()=>{ setTexto(""); setCanal("wa_individual"); setFila(null); setModal({ tipo:"comunicar", dados:{ titulo:`Mensagem para ${m.nome}`, destinatarios:[m], individual:true } }); })}
                  {botaoIcone("Editar", "✏️", C.accent, ()=>abrirForm(m))}
                  {!u && m.email && botaoIcone("Criar acesso", "🔑", C.purple, ()=>criarAcesso(m))}
                  {u && botaoIcone("Nova senha provisória", "♻️", C.purple, ()=>redefinir(u, m))}
                  {u && u.email !== usuarioLogado.email && botaoIcone(u.papel === "gestor" ? "Retirar papel de gestor" : "Tornar gestor", u.papel === "gestor" ? "⬇️" : "⭐", C.warning, ()=>trocarPapel(u))}
                  {u && u.email !== usuarioLogado.email && botaoIcone("Remover acesso", "🚫", C.danger, ()=>removerAcesso(u))}
                  {botaoIcone("Remover cadastro", "🗑", C.danger, ()=>excluir(m))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {semCadastro.length > 0 && (
        <div style={{ marginTop:20 }}>
          <h3 style={{ fontSize:16, margin:"0 0 8px" }}>Acessos sem cadastro de missionário</h3>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 10px" }}>Essas pessoas entram no sistema, mas só podem responder pulsos depois de cadastradas como missionário (mesmo e-mail).</p>
          {semCadastro.map(u => (
            <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" }}>
              <span style={{ flex:1, minWidth:200 }}><b>{u.nome}</b> <span style={{ color:C.muted }}>· {u.email}</span></span>
              <Badge color={estadoDoAcesso(u)[1]}>{estadoDoAcesso(u)[0]}</Badge>
              <Btn small outline onClick={()=>{ setForm({ ...MISS_VAZIO, nome:u.nome, email:u.email }); setErroForm(""); setModal({ tipo:"form", dados:null }); }}>Cadastrar como missionário</Btn>
            </div>
          ))}
        </div>
      )}

      {modal?.tipo === "form" && (
        <Modal titulo={modal.dados ? `Editar — ${modal.dados.nome}` : "Novo missionário"} onClose={()=>setModal(null)}>
          <FieldInput label="Nome completo *" value={form.nome} onChange={e=>setForm(f=>({...f, nome:e.target.value}))}/>
          <FieldInput label="E-mail (@sepal.org.br) *" type="email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))}/>
          <FieldInput label="WhatsApp (com DDD e código do país)" value={form.whatsapp} placeholder="5511999990000" onChange={e=>setForm(f=>({...f, whatsapp:e.target.value}))}/>
          <FieldSelect label="Equipe" value={form.equipeId} onChange={e=>setForm(f=>({...f, equipeId:e.target.value}))} options={equipes.map(e => ({ value:e.id, label:`Equipe de ${e.lider}` }))}/>
          <FieldSelect label="Status" vazio={null} value={form.status} onChange={e=>setForm(f=>({...f, status:e.target.value}))} options={[{ value:"ativo", label:"Ativo" }, { value:"inativo", label:"Inativo" }]}/>
          <FieldInput label="Data de nascimento" type="date" value={form.nascimento} onChange={e=>setForm(f=>({...f, nascimento:e.target.value}))}/>
          {erroForm && <p style={{ color:C.danger, fontSize:14, margin:"0 0 8px" }}>⚠ {erroForm}</p>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={salvar} disabled={!form.nome || !form.email}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {modal?.tipo === "senha" && (() => {
        const d = modal.dados;
        const msg = `Olá, ${d.nome.split(" ")[0]}! Seu acesso ao Avalie360 está pronto.\nEndereço: ${URL_SITE}\nE-mail: ${d.email}\nSenha provisória: ${d.senha}\nNo primeiro acesso você vai criar uma senha só sua.`;
        return (
          <Modal titulo={d.nova ? "Acesso criado" : "Nova senha provisória"} onClose={()=>setModal(null)}>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.5, margin:"0 0 12px" }}>Esta senha aparece <b>só agora</b>. Repasse para {d.nome} por um canal pessoal; no primeiro acesso a pessoa cria a própria senha.</p>
            <div style={{ background:C.bg, border:`1px dashed ${C.accent}`, borderRadius:12, padding:16, textAlign:"center", fontSize:24, fontWeight:800, letterSpacing:2, marginBottom:14, fontFamily:"monospace" }}>{d.senha}</div>
            {MODO_DEMO && <Aviso cor={C.purple} style={{ marginBottom:12 }}>Na demonstração, as contas criadas não são reais.</Aviso>}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
              <Btn small outline onClick={()=>navigator.clipboard?.writeText(msg)}>📋 Copiar mensagem</Btn>
              {d.whatsapp && <Btn small color={C.success} onClick={()=>window.open(linkWA(d.whatsapp, msg), "_blank")}>💬 Enviar por WhatsApp</Btn>}
              <Btn small onClick={()=>setModal(null)}>Concluir</Btn>
            </div>
          </Modal>
        );
      })()}

      {modal?.tipo === "comunicar" && (
        <Modal titulo={modal.dados.titulo} onClose={()=>setModal(null)}>
          {fila === null && <>
            {modal.dados.lembrete && <p style={{ color:C.muted, fontSize:14, margin:"0 0 12px", lineHeight:1.5 }}>
              {modal.dados.destinatarios.length} missionário(s) ativo(s) ainda não participaram do ciclo. A lista mostra apenas quem não participou, nunca o que alguém respondeu.
            </p>}
            {!modal.dados.individual && (
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[...(modal.dados.lembrete ? [] : [["wa_grupo", "💬 Grupo WhatsApp", C.success]]), ["wa_individual", "📱 WhatsApp 1 a 1", C.purple], ["email", "📧 E-mail", C.accent]].map(([id, label, cor]) => (
                  <button key={id} onClick={()=>setCanal(id)} style={{ flex:1, minWidth:120, minHeight:48, borderRadius:12, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:14,
                    border:`2px solid ${canal === id ? cor : C.border}`, background:canal === id ? cor + "22" : C.card, color:canal === id ? cor : C.muted }}>{label}</button>
                ))}
              </div>
            )}
            {modal.dados.individual && (
              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                {[["wa_individual", "💬 WhatsApp", C.success], ["email", "📧 E-mail", C.accent]].map(([id, label, cor]) => (
                  <button key={id} onClick={()=>setCanal(id)} style={{ flex:1, minHeight:48, borderRadius:12, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:15,
                    border:`2px solid ${canal === id ? cor : C.border}`, background:canal === id ? cor + "22" : C.card, color:canal === id ? cor : C.muted }}>{label}</button>
                ))}
              </div>
            )}
            {canal === "wa_grupo" && <FieldInput label="Link do grupo do WhatsApp" value={grupoWA} onChange={e=>setGrupoWA(e.target.value)} placeholder="https://chat.whatsapp.com/..."/>}
            {canal === "email" && <FieldInput label="Assunto" value={assunto} onChange={e=>setAssunto(e.target.value)}/>}
            <FieldTexto label="Mensagem" value={texto} onChange={e=>setTexto(e.target.value)}/>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn onClick={iniciarEnvio} disabled={!texto || (canal === "wa_grupo" && !grupoWA) || modal.dados.destinatarios.length === 0}>
                {canal === "wa_grupo" ? "Abrir grupo →" : `Enviar para ${modal.dados.destinatarios.length} →`}
              </Btn>
            </div>
          </>}
          {Array.isArray(fila) && (
            <div style={{ textAlign:"center" }}>
              <div style={{ color:C.muted, fontSize:14, marginBottom:4 }}>{idx + 1} de {fila.length}</div>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:6 }}>{fila[idx].nome}</div>
              <div style={{ color:C.muted, fontSize:14, marginBottom:20 }}>{canal === "wa_individual" ? fila[idx].whatsapp || "sem WhatsApp" : fila[idx].email}</div>
              <Btn onClick={proximo}>{canal === "wa_individual" ? "Abrir WhatsApp →" : "Abrir e-mail →"}</Btn>
            </div>
          )}
          {fila === "fim" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:16 }}>Pronto!</div>
              <Btn onClick={()=>setModal(null)}>Fechar</Btn>
            </div>
          )}
        </Modal>
      )}

      {modal?.tipo === "importar" && (
        <Modal titulo="📥 Importar planilha (CSV)" onClose={()=>setModal(null)}>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 12px", lineHeight:1.5 }}>Salve a planilha como <b>CSV</b>. Colunas: <code style={{ color:C.accent }}>nome, email, whatsapp, equipeId, nascimento (AAAA-MM-DD), status</code>. Depois de importar, crie os acessos pela tabela.</p>
          <Btn outline onClick={()=>fileRef.current.click()} style={{ width:"100%", marginBottom:12 }}>📂 Selecionar arquivo</Btn>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={lerCsv}/>
          {erroCsv && <Aviso style={{ marginBottom:12 }}>{erroCsv}</Aviso>}
          {csv && <>
            <p style={{ color:C.success, fontSize:14 }}>✅ {csv.length} registros encontrados.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn onClick={importar}>Importar {csv.length}</Btn>
            </div>
          </>}
        </Modal>
      )}

      {modal?.tipo === "equipes" && (
        <Modal titulo="👥 Equipes" onClose={()=>setModal(null)}>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 16px" }}>Equipes são identificadas pelo nome do(a) líder.</p>
          {listaEquipes.map(e => (
            <div key={e.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <input value={e.lider} aria-label="Líder da equipe" onChange={ev=>setListaEquipes(l=>l.map(x=>x.id === e.id ? { ...x, lider:ev.target.value } : x))} style={{ ...selecao, flex:1, background:C.surface }}/>
              <button aria-label="Remover equipe" onClick={()=>setListaEquipes(l=>l.filter(x=>x.id !== e.id))} style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:20 }}>×</button>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, margin:"12px 0 20px" }}>
            <input value={novoLider} onChange={e=>setNovoLider(e.target.value)} placeholder="Nome do(a) novo(a) líder..." style={{ ...selecao, flex:1, background:C.surface }}/>
            <Btn onClick={()=>{ if (novoLider.trim()) { setListaEquipes(l=>[...l, { id:"novo" + Date.now(), lider:novoLider.trim() }]); setNovoLider(""); } }} disabled={!novoLider.trim()}>+ Adicionar</Btn>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={salvarEquipes}>Salvar equipes</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
