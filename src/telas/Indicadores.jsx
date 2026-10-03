// Painel de KPIs (índice estratégico 45/35/20) e relatório trimestral para o Conselho (imprimível em PDF).
import { useRef, useState } from "react";
import { api } from "../api";
import { C, VISUAL_AREA, classificar, fmtNota, fmtData, fmtBRL } from "../tema";
import { Badge, Titulo, Cartao, Vazio, Btn, Aviso } from "../ui";
import { SeletorCiclo } from "./Resultados";
import { STATUS_ACAO } from "./Inicio";
import { SEPAL_LOGO } from "../logo";
import * as I from "../indicadores";

function lerCsvFinanceiro(texto) {
  const linhas = texto.trim().split(/\r?\n/).map(l => l.split(/[;,](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, "")));
  // Aceita "1.234,56" (padrão brasileiro) e "1234.56".
  const num = c => {
    const s = String(c || "").replace(/[^0-9.,-]/g, "");
    return parseFloat(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  };
  return linhas.slice(1).map(([desc, orc, real]) => ({ desc, orcado: num(orc), realizado: num(real) }))
    .filter(l => l.desc && Number.isFinite(l.orcado) && Number.isFinite(l.realizado) && l.orcado >= 0);
}

export function Kpis({ kpis, cicloId, onTrocarCiclo, token, onAtualizar }) {
  const fileRef = useRef();
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [msg, setMsg] = useState(null);
  const [manuais, setManuais] = useState({});
  const ciclo = kpis.ciclos.find(c => c.id === cicloId);
  const r = I.calcularKpis(kpis, cicloId);
  const corIndice = I.corDoIndice(r.indice, C);

  async function salvarManual(k) {
    const valor = manuais[k.chave];
    if (valor === undefined || valor === "") return;
    try {
      await api.gravarIndicadoresManuais(token, { [k.chave]: Number(valor) });
      setMsg([`KPI ${k.num} salvo.`, C.success]);
      setManuais(m => ({ ...m, [k.chave]: undefined }));
      onAtualizar();
    } catch (e) { setMsg([e.message, C.danger]); }
  }

  function importar(e) {
    const arquivo = e.target.files[0]; if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = async ev => {
      const linhas = lerCsvFinanceiro(ev.target.result);
      if (!linhas.length) return setMsg(["Nenhuma linha válida. Use CSV com as colunas: descrição, orçado, realizado.", C.danger]);
      try {
        await api.gravarFinanceiro(token, mes, linhas);
        setMsg([`Relatório de ${mes} salvo (${linhas.length} linhas).`, C.success]);
        onAtualizar();
      } catch (er) { setMsg([er.message, C.danger]); }
    };
    leitor.readAsText(arquivo, "UTF-8");
    e.target.value = "";
  }

  const fin = kpis.financeiro;
  const totOrc = fin ? fin.linhas.reduce((t, l) => t + l.orcado, 0) : 0;
  const totReal = fin ? fin.linhas.reduce((t, l) => t + l.realizado, 0) : 0;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>📈 Painel de KPIs</h2>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 14px" }}>10 indicadores estratégicos e índice ponderado (45/35/20){ciclo ? ` · ciclo ${ciclo.nome}` : ""}</p>
        </div>
        <SeletorCiclo kpis={kpis} cicloId={cicloId} onTrocar={onTrocarCiclo}/>
      </div>

      {msg && <Aviso cor={msg[1]} style={{ marginBottom:14 }}>{msg[0]}</Aviso>}

      <Cartao borda={`${corIndice}50`} style={{ marginBottom:20 }}>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ textAlign:"center", minWidth:120 }}>
            <div style={{ fontSize:44, fontWeight:900, color:corIndice, lineHeight:1 }}>{r.indice === null ? "—" : Math.round(r.indice)}</div>
            <div style={{ color:C.muted, fontSize:14 }}>de 100</div>
          </div>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Índice estratégico</div>
            <div style={{ color:C.muted, fontSize:14, marginBottom:10 }}>
              Média ponderada do quanto cada meta foi atingida · {r.cobertura} de 10 indicadores com dado
            </div>
            {r.dimensoes.map(d => (
              <div key={d.id} style={{ display:"flex", justifyContent:"space-between", fontSize:14, gap:10, marginBottom:4 }}>
                <span>{d.icon} {d.nome} <span style={{ color:C.muted }}>({d.peso}%)</span></span>
                <b style={{ color:I.corDoIndice(d.nota, C) }}>{d.nota === null ? "—" : Math.round(d.nota)}</b>
              </div>
            ))}
          </div>
        </div>
      </Cartao>

      <Cartao style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>💰 Relatório financeiro mensal</div>
            <div style={{ color:C.muted, fontSize:14, lineHeight:1.5 }}>
              CSV com as colunas <code style={{ color:C.accent }}>descrição, orçado, realizado</code>. Escreva "missão" na descrição das linhas da atividade-fim.
              {fin && <> Último enviado: <b style={{ color:C.text }}>{fin.mes}</b>.</>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <input type="month" value={mes} onChange={e=>setMes(e.target.value)} aria-label="Mês do relatório"
              style={{ height:40, borderRadius:10, background:C.surface, color:C.text, border:`1px solid ${C.border}`, padding:"0 10px", fontFamily:"inherit", fontSize:14 }}/>
            <Btn small onClick={()=>fileRef.current.click()}>📥 Enviar CSV</Btn>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={importar}/>
          </div>
        </div>
        {fin && (
          <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap" }}>
            {[["Orçado", fmtBRL(totOrc)], ["Realizado", fmtBRL(totReal)], ["Linhas", fin.linhas.length]].map(([l, v]) => (
              <div key={l} style={{ background:C.bg, borderRadius:10, padding:"10px 16px", border:`1px solid ${C.border}`, flex:1, minWidth:110, textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{v}</div><div style={{ color:C.muted, fontSize:14 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </Cartao>

      {r.dimensoes.map(d => (
        <div key={d.id} style={{ marginBottom:16 }}>
          <Titulo style={{ letterSpacing:1.5 }}>{d.icon} {d.nome} ({d.peso}%)</Titulo>
          <Cartao style={{ padding:0, overflow:"hidden" }}>
            {d.itens.map((k, i) => {
              const cor = k.ok === null ? C.muted : k.ok ? C.success : C.danger;
              return (
                <div key={k.num} style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", borderBottom:i < d.itens.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", fontSize:14, fontWeight:800, background:cor + "22", color:cor,
                    display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${cor}44`, flexShrink:0 }}>{k.num}</div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{k.nome}</div>
                    <div style={{ color:C.muted, fontSize:14, marginTop:2 }}>Fonte: {k.fonte} · Meta: {k.metaTexto}
                      {k.manual && k.atualizadoEm ? ` · atualizado em ${fmtData(k.atualizadoEm)}` : ""}</div>
                  </div>
                  {k.manual ? (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input type="number" min="0" max={k.unidade === "%" ? 100 : undefined} aria-label={`Valor do KPI ${k.num}`}
                        value={manuais[k.chave] ?? (k.valor ?? "")} onChange={e=>setManuais(m=>({ ...m, [k.chave]: e.target.value }))}
                        style={{ width:70, padding:"6px 8px", borderRadius:8, fontSize:14, fontWeight:700, textAlign:"center", background:C.bg, border:`1px solid ${C.border}`, color:C.text, fontFamily:"inherit" }}/>
                      <span style={{ color:C.muted, fontSize:14 }}>{k.unidade || "proj."}</span>
                      {manuais[k.chave] !== undefined && <Btn small onClick={()=>salvarManual(k)}>Salvar</Btn>}
                    </div>
                  ) : (
                    <div style={{ fontWeight:800, fontSize:18, color:cor, minWidth:70, textAlign:"right" }}>{I.formatarKpi(k)}</div>
                  )}
                  <div style={{ minWidth:130, textAlign:"right" }}>
                    <Badge color={cor}>{k.ok === null ? "Sem dado" : k.ok ? "✅ Meta atingida" : "⚠️ Abaixo da meta"}</Badge>
                  </div>
                </div>
              );
            })}
          </Cartao>
        </div>
      ))}
      <p style={{ color:C.muted, fontSize:14, textAlign:"center", lineHeight:1.6 }}>
        KPIs 1 e 2: cadastro · 3, 6, 7 e 8: pulsos do ciclo (só grupos com o mínimo de respondentes) · 4 e 5: diretoria · 9 e 10: relatório financeiro.
        Metas a validar pelo Conselho.
      </p>
    </div>
  );
}

// ── Relatório trimestral para o Conselho (página clara, pronta para imprimir ou salvar em PDF) ──
const P = { texto:"#1b1f3a", suave:"#5b6275", linha:"#d5dbe6", fundo:"#f3f5f9", laranja:"#ea580c" };

export function Relatorio({ kpis, banco, cicloId, onTrocarCiclo, acoes, participacao, sugestoes }) {
  const ciclo = kpis.ciclos.find(c => c.id === cicloId);
  if (!ciclo) return <Vazio>O relatório fica disponível quando o primeiro ciclo começar.</Vazio>;
  const anterior = I.cicloAnterior(kpis, cicloId);
  const r = I.calcularKpis(kpis, cicloId);
  const areas = I.resultadosAreas(kpis, banco, cicloId);
  const areasAnt = anterior ? I.resultadosAreas(kpis, banco, anterior.id) : [];
  const geral = I.mediaGeral(areas);
  const enps = I.enpsDoCiclo(kpis, cicloId);
  const lideres = I.resultadosLideranca(kpis, cicloId);
  const eventos = I.resultadosEventos(kpis).filter(e => !e.semDados && e.abre_em >= ciclo.inicio && e.abre_em <= ciclo.fim);
  const part = participacao?.atual?.cicloId === cicloId ? participacao.atual : participacao?.anterior?.cicloId === cicloId ? participacao.anterior : null;
  const sug = (sugestoes?.sugestoes || []).filter(s => s.cicloId === cicloId);
  const palavras = I.palavrasMaisCitadas(sug.map(s => s.texto), 8);
  const acoesCiclo = acoes.filter(a => a.ciclo_id === cicloId || a.status !== "concluida");

  const th = { textAlign:"left", padding:"6px 8px", borderBottom:`2px solid ${P.texto}`, fontSize:12, textTransform:"uppercase", letterSpacing:0.5 };
  const td = { padding:"6px 8px", borderBottom:`1px solid ${P.linha}`, fontSize:13, verticalAlign:"top" };
  const h2 = { fontSize:16, color:P.texto, margin:"22px 0 8px", borderBottom:`2px solid ${P.laranja}`, paddingBottom:4 };

  return (
    <div>
      <div className="nao-imprimir" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:12, flexWrap:"wrap", marginBottom:14 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>🧾 Relatório para o Conselho</h2>
          <p style={{ color:C.muted, fontSize:14, margin:0 }}>Resumo do ciclo, pronto para imprimir ou salvar em PDF.</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
          <SeletorCiclo kpis={kpis} cicloId={cicloId} onTrocar={onTrocarCiclo}/>
          <div style={{ marginBottom:14 }}><Btn onClick={()=>window.print()}>🖨️ Imprimir / salvar PDF</Btn></div>
        </div>
      </div>

      <div id="relatorio" style={{ background:"#fff", color:P.texto, borderRadius:12, padding:"28px 32px", fontFamily:"'Segoe UI',Inter,sans-serif", lineHeight:1.45 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16, borderBottom:`3px solid ${P.texto}`, paddingBottom:12 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800 }}>Avalie<span style={{ color:P.laranja }}>360</span> · Relatório do ciclo {ciclo.nome}</div>
            <div style={{ color:P.suave, fontSize:13 }}>{fmtData(ciclo.inicio)} a {fmtData(ciclo.fim)} · emitido em {fmtData(new Date().toISOString())} · Conselho de Governança da SEPAL</div>
          </div>
          <img src={SEPAL_LOGO} alt="SEPAL" style={{ width:90 }}/>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:16 }}>
          {[
            ["Índice estratégico", r.indice === null ? "—" : `${Math.round(r.indice)}/100`],
            ["Saúde organizacional", geral === null ? "—" : `${fmtNota(geral)}/5`],
            ["eNPS (recomendaria a SEPAL)", enps.valor === null ? "—" : `${enps.valor > 0 ? "+" : ""}${Math.round(enps.valor)}`],
            ["Participação", part ? `${part.pct ?? 0}% (${part.participantes}/${part.ativos})` : "—"],
          ].map(([l, v]) => (
            <div key={l} style={{ background:P.fundo, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:20, fontWeight:800 }}>{v}</div><div style={{ fontSize:12, color:P.suave }}>{l}</div>
            </div>
          ))}
        </div>

        <h3 style={h2}>1. Indicadores estratégicos</h3>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><th style={th}>#</th><th style={th}>Indicador</th><th style={th}>Resultado</th><th style={th}>Meta</th><th style={th}>Situação</th></tr></thead>
          <tbody>{r.lista.map(k => (
            <tr key={k.num}><td style={td}>{k.num}</td><td style={td}>{k.nome}</td><td style={{ ...td, fontWeight:700 }}>{I.formatarKpi(k)}</td>
              <td style={td}>{k.metaTexto}</td><td style={{ ...td, color:k.ok === null ? P.suave : k.ok ? "#0f9f6e" : "#c0262d", fontWeight:700 }}>{k.ok === null ? "Sem dado" : k.ok ? "Atingida" : "Abaixo"}</td></tr>
          ))}</tbody>
        </table>
        <p style={{ fontSize:12, color:P.suave }}>Índice = média do atingimento das metas em cada dimensão, ponderada: Impacto 45%, Capacidade 35%, Eficiência 20%. {r.cobertura} de 10 indicadores com dado.</p>

        <h3 style={h2}>2. Resultados por área (escala de concordância 1–5)</h3>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr><th style={th}>Área</th><th style={th}>Média</th><th style={th}>Ciclo anterior</th><th style={th}>Classificação</th><th style={th}>Respondentes</th></tr></thead>
          <tbody>{areas.map(a => {
            const ant = areasAnt.find(x => x.id === a.id);
            return (
              <tr key={a.id}><td style={td}>{VISUAL_AREA[a.id].icon} {a.nome}</td>
                <td style={{ ...td, fontWeight:700 }}>{a.suprimido ? "abaixo do mínimo" : fmtNota(a.media)}</td>
                <td style={td}>{fmtNota(ant?.media ?? null)}</td>
                <td style={td}>{a.media === null ? "—" : classificar(a.media)[0]}</td>
                <td style={td}>{a.respondentes || 0}</td></tr>
            );
          })}</tbody>
        </table>

        {ciclo.inclui_lideranca && lideres.length > 0 && <>
          <h3 style={h2}>3. Liderança</h3>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={th}>Liderança</th><th style={th}>Média da equipe</th><th style={th}>Autoavaliação</th><th style={th}>Avaliações</th></tr></thead>
            <tbody>{lideres.map(l => {
              const auto = l.auto ? Object.values(l.auto) : [];
              return (
                <tr key={l.id}><td style={td}>{l.nome}</td><td style={{ ...td, fontWeight:700 }}>{l.suprimido ? "abaixo do mínimo" : fmtNota(l.media)}</td>
                  <td style={td}>{auto.length ? fmtNota(auto.reduce((t, v) => t + v, 0) / auto.length) : "—"}</td><td style={td}>{l.respondentes}</td></tr>
              );
            })}</tbody>
          </table>
        </>}

        {eventos.length > 0 && <>
          <h3 style={h2}>{ciclo.inclui_lideranca && lideres.length ? "4" : "3"}. Eventos</h3>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={th}>Evento</th><th style={th}>Satisfação</th><th style={th}>NPS</th><th style={th}>Respostas</th></tr></thead>
            <tbody>{eventos.map(e => (
              <tr key={e.id}><td style={td}>{e.nome}</td><td style={td}>{e.suprimido ? "abaixo do mínimo" : `${fmtNota(e.satisfacao)}/5`}</td>
                <td style={td}>{e.suprimido || e.nps === null ? "—" : `${e.nps > 0 ? "+" : ""}${Math.round(e.nps)}`}</td><td style={td}>{e.respondentes}</td></tr>
            ))}</tbody>
          </table>
        </>}

        <h3 style={h2}>Escuta: sugestões do ciclo</h3>
        <p style={{ fontSize:13, margin:"0 0 6px" }}>{sug.length} sugestões liberadas (grupos com o mínimo de respondentes).
          {palavras.length ? ` Temas mais citados: ${palavras.map(([p, n]) => `${p} (${n})`).join(", ")}.` : ""}</p>

        <h3 style={h2}>Vocês disseram, nós fizemos</h3>
        {acoesCiclo.length === 0 ? <p style={{ fontSize:13, color:P.suave }}>Nenhuma ação registrada.</p> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={th}>Ação</th><th style={th}>Área</th><th style={th}>Situação</th></tr></thead>
            <tbody>{acoesCiclo.map(a => (
              <tr key={a.id}><td style={td}><b>{a.titulo}</b>{a.descricao ? <div style={{ color:P.suave }}>{a.descricao}</div> : null}</td><td style={td}>{a.area}</td><td style={td}>{STATUS_ACAO[a.status][0]}</td></tr>
            ))}</tbody>
          </table>
        )}

        <p style={{ fontSize:11, color:P.suave, marginTop:22, borderTop:`1px solid ${P.linha}`, paddingTop:8 }}>
          Confidencialidade: as respostas são guardadas sem identificação, e só são exibidos resultados de grupos com no mínimo {kpis.minimos.geral} respondentes ({kpis.minimos.lideranca} em liderança).
        </p>
      </div>
    </div>
  );
}
