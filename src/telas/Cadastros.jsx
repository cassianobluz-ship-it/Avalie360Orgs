// Cadastros da gestão: ciclos (janela e rodízio de perguntas), eventos, lideranças e ações.
import { useEffect, useState } from "react";
import { api } from "../api";
import { C, fmtData } from "../tema";
import { Badge, Btn, Modal, FieldInput, FieldSelect, FieldTexto, Aviso, Titulo, Cartao, Vazio } from "../ui";
import { STATUS_ACAO } from "./Inicio";

const hoje = () => new Date().toISOString().slice(0, 10);
const somaDias = (iso, d) => { const x = new Date(iso + "T12:00:00"); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

function Linha({ children, ultima }) {
  return <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", borderBottom:ultima ? "none" : `1px solid ${C.border}` }}>{children}</div>;
}

export default function Cadastros({ token, banco, onAlterado }) {
  const [ciclos, setCiclos] = useState([]), [eventos, setEventos] = useState([]), [lideres, setLideres] = useState([]), [acoes, setAcoes] = useState([]);
  const [erro, setErro] = useState(""), [modal, setModal] = useState(null), [form, setForm] = useState({}), [erroForm, setErroForm] = useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try {
      const [c, e, l, a] = await Promise.all([api.listarCiclos(token), api.listarEventos(token), api.listarLiderancas(token), api.acoes(token)]);
      setCiclos(c); setEventos(e); setLideres(l); setAcoes(a); setErro("");
    } catch (er) { setErro(er.message); }
  }
  useEffect(() => { carregar(); }, [token]);

  async function salvar(fn) {
    try { await fn(); setModal(null); await carregar(); onAlterado?.(); }
    catch (er) { setErroForm(er.message); }
  }
  const abrir = (tipo, dados) => { setErroForm(""); setForm(dados); setModal(tipo); };

  const gruposPerguntas = [
    ...banco.areas.map(a => [a.nome, a.perguntas]),
    ["Liderança — Diretor", banco.lideranca.diretor.perguntas],
    ["Liderança — Coordenação", banco.lideranca.coordenacao.perguntas],
  ];
  const ultimoFim = ciclos.length ? ciclos[ciclos.length - 1].fim : null;
  const novoCiclo = () => {
    const inicio = ultimoFim && ultimoFim >= hoje() ? somaDias(ultimoFim, 1) : hoje();
    abrir("ciclo", { nome:"", inicio, fim:somaDias(inicio, 89), incluiLideranca:true, perguntasExcluidas:[] });
  };
  const nomesObjetos = [...banco.areas.map(a => a.nome), ...eventos.map(e => e.nome), ...lideres.map(l => l.nome), "Geral"];

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>🗂️ Ciclos, eventos, lideranças e ações</h2>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 18px" }}>O que a gestão configura para cada rodada de avaliação.</p>
      {erro && <Aviso style={{ marginBottom:16 }}>{erro}</Aviso>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Titulo>Ciclos de avaliação</Titulo>
        <Btn small onClick={novoCiclo}>+ Novo ciclo</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 10px" }}>Pulsos de Área e de Liderança só podem ser respondidos enquanto um ciclo está aberto. Cada pessoa responde cada área e cada liderança uma vez por ciclo.</p>
      {ciclos.length === 0 ? <Vazio>Nenhum ciclo cadastrado.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden", marginBottom:24 }}>
          {[...ciclos].reverse().map((c, i) => (
            <Linha key={c.id} ultima={i === ciclos.length - 1}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700 }}>{c.nome} {c.aberto && <Badge color={C.success}>Aberto</Badge>}</div>
                <div style={{ color:C.muted, fontSize:14 }}>{fmtData(c.inicio)} a {fmtData(c.fim)} · {c.inclui_lideranca ? "com Pulso de Liderança" : "sem Pulso de Liderança"}
                  {c.perguntas_excluidas.length ? ` · ${c.perguntas_excluidas.length} pergunta(s) fora deste ciclo` : ""}</div>
              </div>
              <Btn small outline onClick={()=>abrir("ciclo", { id:c.id, nome:c.nome, inicio:c.inicio, fim:c.fim, incluiLideranca:c.inclui_lideranca, perguntasExcluidas:c.perguntas_excluidas })}>Editar</Btn>
              <Btn small outline color={C.danger} onClick={()=>{ if (window.confirm(`Remover o ciclo ${c.nome}?`)) api.removerCiclo(token, c.id).then(carregar).catch(e=>setErro(e.message)); }}>Remover</Btn>
            </Linha>
          ))}
        </Cartao>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Titulo>Eventos</Titulo>
        <Btn small onClick={()=>abrir("evento", { nome:"", data:"", abreEm:hoje(), fechaEm:somaDias(hoje(), 14) })}>+ Novo evento</Btn>
      </div>
      {eventos.length === 0 ? <Vazio>Nenhum evento cadastrado. Cadastre retiros e encontros para que sejam avaliados.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden", marginBottom:24 }}>
          {eventos.map((e, i) => (
            <Linha key={e.id} ultima={i === eventos.length - 1}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700 }}>📅 {e.nome} {e.aberto ? <Badge color={C.success}>Avaliação aberta</Badge> : !e.ativo ? <Badge color={C.muted}>Arquivado</Badge> : null}</div>
                <div style={{ color:C.muted, fontSize:14 }}>{e.data ? `Evento em ${fmtData(e.data)} · ` : ""}avaliação de {fmtData(e.abre_em)} a {fmtData(e.fecha_em)}</div>
              </div>
              <Btn small outline onClick={()=>abrir("evento", { id:e.id, nome:e.nome, data:e.data || "", abreEm:e.abre_em, fechaEm:e.fecha_em, ativo:e.ativo })}>Editar</Btn>
            </Linha>
          ))}
        </Cartao>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Titulo>Lideranças avaliadas</Titulo>
        <Btn small onClick={()=>abrir("lider", { nome:"", tipo:"coordenacao", emailLider:"" })}>+ Nova liderança</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 10px" }}>Informe o e-mail do líder para que ele responda como autoavaliação (360).</p>
      {lideres.length === 0 ? <Vazio>Nenhuma liderança cadastrada.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden", marginBottom:24 }}>
          {lideres.map((l, i) => (
            <Linha key={l.id} ultima={i === lideres.length - 1}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700 }}>{l.tipo === "diretor" ? "🏆" : "🤝"} {l.nome} {!l.ativo && <Badge color={C.muted}>Inativa</Badge>}</div>
                <div style={{ color:C.muted, fontSize:14 }}>{l.tipo === "diretor" ? "Diretor Executivo" : "Coordenação"} · {l.email_lider || "sem e-mail (sem autoavaliação)"}</div>
              </div>
              <Btn small outline onClick={()=>abrir("lider", { id:l.id, nome:l.nome, tipo:l.tipo, emailLider:l.email_lider || "", ativo:l.ativo })}>Editar</Btn>
            </Linha>
          ))}
        </Cartao>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Titulo>Vocês disseram, nós fizemos</Titulo>
        <Btn small onClick={()=>abrir("acao", { titulo:"", area:"", descricao:"", status:"planejada", cicloId:ciclos.find(c=>c.aberto)?.id || "" })}>+ Nova ação</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 10px" }}>Ações que a liderança assume a partir dos resultados. Todos os missionários veem esta lista na tela inicial.</p>
      {acoes.length === 0 ? <Vazio>Nenhuma ação registrada.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden" }}>
          {acoes.map((a, i) => (
            <Linha key={a.id} ultima={i === acoes.length - 1}>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700 }}>{a.titulo} <Badge color={STATUS_ACAO[a.status][1]}>{STATUS_ACAO[a.status][0]}</Badge></div>
                <div style={{ color:C.muted, fontSize:14 }}>{a.area}{a.ciclo_nome ? ` · ciclo ${a.ciclo_nome}` : ""}</div>
              </div>
              <Btn small outline onClick={()=>abrir("acao", { id:a.id, titulo:a.titulo, area:a.area, descricao:a.descricao || "", status:a.status, cicloId:a.ciclo_id || "" })}>Editar</Btn>
              <Btn small outline color={C.danger} onClick={()=>{ if (window.confirm("Remover esta ação?")) api.removerAcao(token, a.id).then(carregar).catch(e=>setErro(e.message)); }}>Remover</Btn>
            </Linha>
          ))}
        </Cartao>
      )}

      {modal === "ciclo" && (
        <Modal titulo={form.id ? `Editar ciclo ${form.nome}` : "Novo ciclo"} largura={640} onClose={()=>setModal(null)}>
          <FieldInput label="Nome (ex.: T1 2027)" value={form.nome} onChange={e=>setF("nome", e.target.value)}/>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}><FieldInput label="Abre em" type="date" value={form.inicio} onChange={e=>setF("inicio", e.target.value)}/></div>
            <div style={{ flex:1 }}><FieldInput label="Fecha em" type="date" value={form.fim} onChange={e=>setF("fim", e.target.value)}/></div>
          </div>
          <label style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, cursor:"pointer" }}>
            <input type="checkbox" checked={form.incluiLideranca} onChange={e=>setF("incluiLideranca", e.target.checked)} style={{ width:20, height:20 }}/>
            Incluir o Pulso de Liderança neste ciclo (recomendado: um ciclo sim, outro não = semestral)
          </label>
          <details style={{ marginBottom:14 }}>
            <summary style={{ cursor:"pointer", fontWeight:600 }}>Rodízio de perguntas ({form.perguntasExcluidas.length} fora deste ciclo)</summary>
            <p style={{ color:C.muted, fontSize:14 }}>Desmarque perguntas para deixá-las fora deste ciclo e encurtar os pulsos. As perguntas abertas são sempre opcionais.</p>
            {gruposPerguntas.map(([nome, pergs]) => (
              <div key={nome} style={{ marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{nome}</div>
                {pergs.filter(p => p.tipo !== "aberta").map(p => (
                  <label key={p.codigo} style={{ display:"flex", gap:8, fontSize:14, marginBottom:4, cursor:"pointer", alignItems:"flex-start" }}>
                    <input type="checkbox" checked={!form.perguntasExcluidas.includes(p.codigo)}
                      onChange={e=>setF("perguntasExcluidas", e.target.checked ? form.perguntasExcluidas.filter(c=>c !== p.codigo) : [...form.perguntasExcluidas, p.codigo])}/>
                    <span><b>{p.codigo}</b> {p.texto}</span>
                  </label>
                ))}
              </div>
            ))}
          </details>
          {erroForm && <Aviso style={{ marginBottom:12 }}>{erroForm}</Aviso>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn disabled={!form.nome || !form.inicio || !form.fim} onClick={()=>salvar(()=> form.id ? api.atualizarCiclo(token, form.id, form) : api.criarCiclo(token, form))}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {modal === "evento" && (
        <Modal titulo={form.id ? "Editar evento" : "Novo evento"} onClose={()=>setModal(null)}>
          <FieldInput label="Nome do evento" value={form.nome} onChange={e=>setF("nome", e.target.value)}/>
          <FieldInput label="Data do evento (opcional)" type="date" value={form.data} onChange={e=>setF("data", e.target.value)}/>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}><FieldInput label="Avaliação abre em" type="date" value={form.abreEm} onChange={e=>setF("abreEm", e.target.value)}/></div>
            <div style={{ flex:1 }}><FieldInput label="Avaliação fecha em" type="date" value={form.fechaEm} onChange={e=>setF("fechaEm", e.target.value)}/></div>
          </div>
          {form.id && (
            <label style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, cursor:"pointer" }}>
              <input type="checkbox" checked={form.ativo} onChange={e=>setF("ativo", e.target.checked)} style={{ width:20, height:20 }}/> Ativo (desmarque para arquivar)
            </label>
          )}
          {erroForm && <Aviso style={{ marginBottom:12 }}>{erroForm}</Aviso>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn disabled={!form.nome || !form.abreEm || !form.fechaEm} onClick={()=>salvar(()=> form.id ? api.atualizarEvento(token, form.id, form) : api.criarEvento(token, form))}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {modal === "lider" && (
        <Modal titulo={form.id ? "Editar liderança" : "Nova liderança"} onClose={()=>setModal(null)}>
          <FieldInput label="Nome exibido (ex.: Coordenação de Cuidado Missionário)" value={form.nome} onChange={e=>setF("nome", e.target.value)}/>
          <FieldSelect label="Tipo" vazio={null} value={form.tipo} onChange={e=>setF("tipo", e.target.value)}
            options={[{ value:"diretor", label:"Diretor Executivo" }, { value:"coordenacao", label:"Coordenação" }]}/>
          <FieldInput label="E-mail do líder (para a autoavaliação)" type="email" value={form.emailLider} onChange={e=>setF("emailLider", e.target.value)}/>
          {form.id && (
            <label style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, cursor:"pointer" }}>
              <input type="checkbox" checked={form.ativo} onChange={e=>setF("ativo", e.target.checked)} style={{ width:20, height:20 }}/> Ativa (aparece no Pulso de Liderança)
            </label>
          )}
          {erroForm && <Aviso style={{ marginBottom:12 }}>{erroForm}</Aviso>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn disabled={!form.nome} onClick={()=>salvar(()=> form.id ? api.atualizarLideranca(token, form.id, form) : api.criarLideranca(token, form))}>Salvar</Btn>
          </div>
        </Modal>
      )}

      {modal === "acao" && (
        <Modal titulo={form.id ? "Editar ação" : "Nova ação"} onClose={()=>setModal(null)}>
          <FieldInput label="Ação (o que será feito)" value={form.titulo} onChange={e=>setF("titulo", e.target.value)}/>
          <FieldSelect label="Área, evento ou liderança relacionada" value={form.area} onChange={e=>setF("area", e.target.value)} options={nomesObjetos.map(n => ({ value:n, label:n }))}/>
          <FieldSelect label="Ciclo que originou a ação" value={form.cicloId} onChange={e=>setF("cicloId", e.target.value ? Number(e.target.value) : "")} vazio="—" options={ciclos.map(c => ({ value:c.id, label:c.nome }))}/>
          <FieldSelect label="Situação" vazio={null} value={form.status} onChange={e=>setF("status", e.target.value)} options={Object.entries(STATUS_ACAO).map(([v, [l]]) => ({ value:v, label:l }))}/>
          <FieldTexto label="Detalhes (opcional)" value={form.descricao} onChange={e=>setF("descricao", e.target.value)}/>
          {erroForm && <Aviso style={{ marginBottom:12 }}>{erroForm}</Aviso>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn outline color={C.muted} onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn disabled={!form.titulo || !form.area} onClick={()=>salvar(()=> form.id ? api.atualizarAcao(token, form.id, form) : api.criarAcao(token, form))}>Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
