// Resultados por ciclo (áreas, eNPS, liderança 360, eventos) e painel de sugestões. Só dados agregados.
import { useState } from "react";
import { C, VISUAL_AREA, classificar, fmtNota, fmtPct, fmtData } from "../tema";
import { Badge, Barra, Titulo, Cartao, Vazio, FieldSelect } from "../ui";
import * as I from "../indicadores";

export function textoDaPergunta(banco, codigo) {
  const todas = [
    ...banco.areas.flatMap(a => a.perguntas), ...banco.evento.perguntas,
    ...banco.lideranca.diretor.perguntas, ...banco.lideranca.coordenacao.perguntas, banco.ancora,
  ];
  return todas.find(p => p.codigo === codigo)?.texto || `${codigo} (pergunta fora do questionário em uso)`;
}

export function SeletorCiclo({ kpis, cicloId, onTrocar }) {
  const ciclos = I.ciclosIniciados(kpis);
  if (!ciclos.length) return null;
  return (
    <div style={{ maxWidth:280 }}>
      <FieldSelect label="Ciclo" value={cicloId ?? ""} vazio={null} onChange={e=>onTrocar(Number(e.target.value))}
        options={[...ciclos].reverse().map(c => ({ value:c.id, label:`${c.nome}${c.aberto ? " (aberto)" : ""}` }))}/>
    </div>
  );
}

const Delta = ({ atual, anterior, sufixo="", casas=1 }) => {
  if (atual === null || anterior === null || atual === undefined || anterior === undefined) return null;
  const d = atual - anterior;
  const limiar = casas === 0 ? 0.5 : 0.05;
  if (Math.abs(d) < limiar) return <Badge color={C.muted}>= estável</Badge>;
  return <Badge color={d > 0 ? C.success : C.danger}>{d > 0 ? "↑ +" : "↓ "}{d.toFixed(casas).replace(".", ",")}{sufixo}</Badge>;
};

const Suprimido = ({ r }) => (
  <div style={{ color:C.muted, fontSize:14, lineHeight:1.5 }}>
    🔒 Aguardando o mínimo de {r.minimo} respostas para mostrar o resultado ({r.respondentes} até agora).
  </div>
);

export function Resultados({ kpis, banco, cicloId, onTrocarCiclo }) {
  const [aberta, setAberta] = useState(null);
  const ciclo = kpis.ciclos.find(c => c.id === cicloId);
  if (!ciclo) return <Vazio>Os resultados aparecem aqui quando o primeiro ciclo de avaliação começar.</Vazio>;
  const anterior = I.cicloAnterior(kpis, cicloId);

  const areas = I.resultadosAreas(kpis, banco, cicloId);
  const areasAnt = anterior ? I.resultadosAreas(kpis, banco, anterior.id) : [];
  const geral = I.mediaGeral(areas), geralAnt = anterior ? I.mediaGeral(areasAnt) : null;
  const enps = I.enpsDoCiclo(kpis, cicloId), enpsAnt = anterior ? I.enpsDoCiclo(kpis, anterior.id) : { valor: null };
  const comMedia = areas.filter(a => a.media !== null);
  const fortes = [...comMedia].sort((a, b) => b.media - a.media).filter(a => a.media >= 4).slice(0, 3);
  const atencao = [...comMedia].sort((a, b) => a.media - b.media).filter(a => a.media < 4).slice(0, 3);
  const lideres = I.resultadosLideranca(kpis, cicloId);
  const eventos = I.resultadosEventos(kpis).filter(e => !e.semDados && e.abre_em >= ciclo.inicio && e.abre_em <= ciclo.fim);
  const respondentes = Math.max(0, ...areas.map(a => a.respondentes || 0));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:12, flexWrap:"wrap", marginBottom:6 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>📊 Resultados do ciclo {ciclo.nome}</h2>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 14px" }}>{fmtData(ciclo.inicio)} a {fmtData(ciclo.fim)}{anterior ? ` · comparação com ${anterior.nome}` : ""}</p>
        </div>
        <SeletorCiclo kpis={kpis} cicloId={cicloId} onTrocar={onTrocarCiclo}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12, marginBottom:16 }}>
        <Cartao borda={`${C.accent}30`} style={{ background:`linear-gradient(135deg,${C.accent}18,${C.purple}18)`, display:"flex", alignItems:"center", gap:18 }}>
          <div style={{ width:78, height:78, borderRadius:"50%", fontSize:26, fontWeight:900, color:"#fff", flexShrink:0,
            background:`linear-gradient(135deg,${C.accent},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center" }}>{fmtNota(geral)}</div>
          <div>
            <div style={{ fontSize:18, fontWeight:700 }}>Saúde organizacional</div>
            <div style={{ color:C.muted, fontSize:14, margin:"3px 0 8px" }}>
              Média das {comMedia.length === areas.length ? `${areas.length} áreas` : `${comMedia.length} áreas com resultado`}{respondentes ? ` · até ${respondentes} respondentes por área` : ""}
            </div>
            <Delta atual={geral} anterior={geralAnt}/>
          </div>
        </Cartao>
        <Cartao>
          <div style={{ fontSize:18, fontWeight:700 }}>Recomendaria a SEPAL (eNPS)</div>
          <div style={{ color:C.muted, fontSize:14, margin:"3px 0 8px" }}>Pergunta-âncora do ciclo, de −100 a +100</div>
          {enps.suprimido ? <Suprimido r={{ minimo: kpis.minimos.geral, respondentes: enps.n }}/> : enps.valor === null ? <span style={{ color:C.muted }}>Sem respostas</span> : (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:32, fontWeight:900, color:enps.valor >= 30 ? C.success : enps.valor >= 0 ? C.warning : C.danger }}>{enps.valor > 0 ? "+" : ""}{Math.round(enps.valor)}</span>
              <Delta atual={enps.valor} anterior={enpsAnt.valor} casas={0}/>
              <span style={{ color:C.muted, fontSize:14 }}>{enps.n} respostas</span>
            </div>
          )}
        </Cartao>
      </div>

      <Titulo>Áreas</Titulo>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:10, marginBottom:16 }}>
        {areas.map(a => {
          const v = VISUAL_AREA[a.id];
          const ant = areasAnt.find(x => x.id === a.id);
          const [status, cor] = a.media === null ? [a.suprimido ? "Aguardando" : "Sem respostas", C.muted] : classificar(a.media);
          return (
            <Cartao key={a.id} style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:18 }}>{v.icon}</span><Badge color={cor}>{status}</Badge>
              </div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{a.nome}</div>
              {a.suprimido ? <Suprimido r={a}/> : a.media === null ? <div style={{ color:C.muted, fontSize:14 }}>Sem respostas neste ciclo.</div> : <>
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0" }}>
                  <span style={{ fontSize:26, fontWeight:900, color:v.cor }}>{fmtNota(a.media)}<span style={{ fontSize:14, color:C.muted, fontWeight:400 }}>/5</span></span>
                  <Delta atual={a.media} anterior={ant?.media ?? null}/>
                </div>
                <Barra valor={a.media} max={5} cor={v.cor}/>
                <div style={{ color:C.muted, fontSize:14, marginTop:6 }}>{a.respondentes} respondentes</div>
                <button onClick={()=>setAberta(aberta === a.id ? null : a.id)} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:14, fontWeight:600, padding:"8px 0 0", fontFamily:"inherit" }}>
                  {aberta === a.id ? "Ocultar perguntas" : "Ver por pergunta"}
                </button>
                {aberta === a.id && (
                  <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:8 }}>
                    {a.perguntas.map(p => (
                      <div key={p.codigo} style={{ fontSize:14, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
                        <div style={{ color:C.muted }}>{p.codigo} · {textoDaPergunta(banco, p.codigo)}</div>
                        <b>{p.tipo === "binaria" ? `${fmtPct(p.media * 100)} responderam Sim` : `${fmtNota(p.media)}/5`}</b>
                      </div>
                    ))}
                  </div>
                )}
              </>}
            </Cartao>
          );
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:10, marginBottom:20 }}>
        <Cartao borda={`${C.success}30`}>
          <div style={{ color:C.success, fontWeight:700, marginBottom:8 }}>✅ Pontos fortes</div>
          <ul style={{ margin:0, paddingLeft:18, color:C.muted, fontSize:14, lineHeight:1.9 }}>
            {fortes.length ? fortes.map(a => <li key={a.id}>{a.nome} ({fmtNota(a.media)})</li>) : <li>Nenhuma área com média 4,0 ou mais</li>}
          </ul>
        </Cartao>
        <Cartao borda={`${C.danger}30`}>
          <div style={{ color:C.danger, fontWeight:700, marginBottom:8 }}>⚠️ Pedem atenção</div>
          <ul style={{ margin:0, paddingLeft:18, color:C.muted, fontSize:14, lineHeight:1.9 }}>
            {atencao.length ? atencao.map((a, i) => <li key={a.id}>{a.nome} ({fmtNota(a.media)}){i === 0 ? " — maior lacuna" : ""}</li>) : <li>Nenhuma área abaixo de 4,0</li>}
          </ul>
        </Cartao>
      </div>

      <Titulo>Liderança (visão da equipe x autoavaliação)</Titulo>
      {!ciclo.inclui_lideranca ? <Vazio>Este ciclo não incluiu o Pulso de Liderança.</Vazio> : lideres.length === 0 ? <Vazio>Sem avaliações de liderança neste ciclo.</Vazio> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:10, marginBottom:20 }}>
          {lideres.map(l => {
            const pergs = banco.lideranca[l.tipo].perguntas.filter(p => p.tipo === "escala");
            return (
              <Cartao key={l.id}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:8, marginBottom:10 }}>
                  <span style={{ fontWeight:700 }}>{l.tipo === "diretor" ? "🏆" : "🤝"} {l.nome}</span>
                  {l.media !== null && <Badge color={classificar(l.media)[1]}>{fmtNota(l.media)}/5</Badge>}
                </div>
                {l.suprimido && <div style={{ marginBottom:8 }}><Suprimido r={l}/></div>}
                {pergs.map(p => {
                  const eq = l.equipe?.[p.codigo.slice(-1)] ?? null, au = l.auto?.[p.codigo.slice(-1)] ?? null;
                  return (
                    <div key={p.codigo} style={{ marginBottom:10 }}>
                      <div style={{ fontSize:14, color:C.muted, marginBottom:4 }}>{p.dimensao}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 40px", gap:8, alignItems:"center", fontSize:13 }}>
                        <span>Equipe</span><Barra valor={eq || 0} max={5} cor={C.accent}/><b>{fmtNota(eq)}</b>
                        <span>Líder</span><Barra valor={au || 0} max={5} cor={C.purple}/><b>{fmtNota(au)}</b>
                      </div>
                    </div>
                  );
                })}
                <div style={{ color:C.muted, fontSize:13 }}>{l.respondentes} avaliações da equipe{l.auto ? " · autoavaliação registrada" : " · sem autoavaliação"}</div>
              </Cartao>
            );
          })}
        </div>
      )}

      <Titulo>Eventos do ciclo</Titulo>
      {eventos.length === 0 ? <Vazio>Nenhum evento avaliado no período deste ciclo.</Vazio> : (
        <Cartao style={{ padding:0, overflow:"hidden" }}>
          {eventos.map((e, i) => (
            <div key={e.id} style={{ padding:"14px 18px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", borderBottom:i < eventos.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ fontWeight:600 }}>📅 {e.nome}</div>
                <div style={{ color:C.muted, fontSize:14 }}>{e.respondentes} respostas</div>
              </div>
              {e.suprimido ? <Suprimido r={e}/> : <>
                <Badge color={C.accent}>Satisfação {fmtNota(e.satisfacao)}/5</Badge>
                <Badge color={e.nps >= 30 ? C.success : e.nps >= 0 ? C.warning : C.danger}>NPS {e.nps === null ? "—" : `${e.nps > 0 ? "+" : ""}${Math.round(e.nps)}`}</Badge>
              </>}
            </div>
          ))}
        </Cartao>
      )}
    </div>
  );
}

export function Sugestoes({ dados, kpis, banco }) {
  const [filtro, setFiltro] = useState("");
  if (!dados) return <Vazio>Carregando sugestões...</Vazio>;
  const nomeCiclo = id => kpis?.ciclos.find(c => c.id === id)?.nome;
  const grupos = {};
  for (const s of dados.sugestoes) {
    const chave = `${s.objetoNome}|${s.codigo}|${s.cicloId || ""}|${s.eventoId || ""}`;
    (grupos[chave] ||= { ...s, textos: [] }).textos.push(s.texto);
  }
  const lista = Object.values(grupos).filter(g => !filtro || g.objetoNome === filtro);
  const objetos = [...new Set(dados.sugestoes.map(s => s.objetoNome))].sort();
  const palavras = I.palavrasMaisCitadas(lista.flatMap(g => g.textos));

  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:700, margin:"0 0 4px" }}>💬 Sugestões</h2>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 16px", lineHeight:1.5 }}>
        Respostas abertas, sem identificação e em ordem alfabética. Só aparecem as de grupos com o mínimo de respondentes
        {dados.retidas ? ` (${dados.retidas} aguardando o mínimo)` : ""}.
      </p>
      {objetos.length > 1 && (
        <div style={{ maxWidth:320 }}>
          <FieldSelect label="Filtrar por área, evento ou liderança" value={filtro} onChange={e=>setFiltro(e.target.value)} vazio="Todas" options={objetos.map(o => ({ value:o, label:o }))}/>
        </div>
      )}
      {palavras.length > 0 && (
        <Cartao style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, marginBottom:10 }}>Palavras mais citadas</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {palavras.map(([p, n]) => <Badge key={p} color={C.purple} style={{ fontSize:13 + Math.min(n, 6) }}>{p} · {n}</Badge>)}
          </div>
        </Cartao>
      )}
      {lista.length === 0 ? <Vazio>Ainda não há sugestões liberadas.</Vazio> : lista.map(g => (
        <Cartao key={`${g.objetoNome}${g.codigo}${g.cicloId}${g.eventoId}`} style={{ marginBottom:12 }}>
          <div style={{ fontWeight:700 }}>{g.objetoNome}{g.cicloId ? ` · ciclo ${nomeCiclo(g.cicloId) || ""}` : ""}</div>
          <div style={{ color:C.muted, fontSize:14, margin:"2px 0 10px" }}>{g.codigo} · {textoDaPergunta(banco, g.codigo)}</div>
          <ul style={{ margin:0, paddingLeft:18, lineHeight:1.7, fontSize:15 }}>
            {Object.entries(g.textos.reduce((c, t) => ({ ...c, [t]: (c[t] || 0) + 1 }), {})).map(([t, n]) => (
              <li key={t}>{t}{n > 1 && <span style={{ color:C.muted }}> (×{n})</span>}</li>
            ))}
          </ul>
        </Cartao>
      ))}
    </div>
  );
}
