// Avalie360 — estrutura do app: acesso (login → senha própria → aviso de privacidade), abas por papel e dados.
import { useCallback, useEffect, useState } from "react";
import { api, salvarSessao, limparSessao, carregarSessao, MODO_DEMO } from "./api";
import { C, FONTE } from "./tema";
import { AppHeader, Abas, Aviso, Btn, Vazio } from "./ui";
import { Login, TrocaSenha, Privacidade } from "./telas/Acesso";
import Inicio from "./telas/Inicio";
import Avaliacao from "./telas/Avaliacao";
import { Perfil, Participacao } from "./telas/Pessoal";
import { Resultados, Sugestoes } from "./telas/Resultados";
import { Kpis, Relatorio } from "./telas/Indicadores";
import Missionarios from "./telas/Missionarios";
import Cadastros from "./telas/Cadastros";
import { cicloPadrao } from "./indicadores";

const ESTILO_GLOBAL = `
  @media print {
    .nao-imprimir { display: none !important; }
    html, body, #root { background: #fff !important; }
    .conteudo { padding: 0 !important; max-width: none !important; }
    #relatorio { border-radius: 0 !important; padding: 0 !important; }
    @page { margin: 14mm; }
  }
`;

// Selo fixo lembrando que a tela mostra dados fictícios (só no modo demonstração)
function SeloDemo() {
  return (
    <div className="nao-imprimir" style={{
      position:"fixed", left:12, bottom:12, zIndex:1000, pointerEvents:"none",
      background:C.purple, color:"#fff", borderRadius:999, padding:"6px 12px",
      fontFamily:FONTE, fontSize:12, fontWeight:700, letterSpacing:0.5, boxShadow:"0 4px 16px #0008",
    }}>DEMONSTRAÇÃO · dados fictícios</div>
  );
}

const ABAS_TODOS = [
  { id:"inicio", label:"Início" },
  { id:"perfil", label:"Meu Perfil" },
  { id:"participacao", label:"🤝 Participação" },
];
const ABAS_GESTOR = [
  { id:"resultados", label:"📊 Resultados" },
  { id:"sugestoes", label:"💬 Sugestões" },
  { id:"kpis", label:"📈 KPIs" },
  { id:"relatorio", label:"🧾 Relatório" },
  { id:"missionarios", label:"👥 Missionários" },
  { id:"cadastros", label:"🗂️ Ciclos e ações" },
];
const PRECISA_KPIS = new Set(["resultados", "sugestoes", "kpis", "relatorio"]);

export default function App() {
  return <>
    <style>{ESTILO_GLOBAL}</style>
    {MODO_DEMO && <SeloDemo/>}
    <Telas/>
  </>;
}

function Telas() {
  const [sessao, setSessao] = useState(() => carregarSessao());
  const [dados, setDados] = useState(null);          // { me, banco, participacao, acoes }
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("inicio");
  const [avaliando, setAvaliando] = useState(null);  // tipo de pulso em andamento
  const [kpis, setKpis] = useState(null), [sugestoes, setSugestoes] = useState(null), [cicloId, setCicloId] = useState(null);

  const token = sessao?.token;
  const usuario = sessao?.usuario;
  const pronto = usuario && !usuario.trocaSenha && !usuario.consentimentoPendente;

  function entrar(u, t) { salvarSessao(t, u); setSessao({ token:t, usuario:u }); setAba("inicio"); }
  const sair = useCallback(() => {
    limparSessao(); setSessao(null); setDados(null); setKpis(null); setSugestoes(null); setErro(""); setAvaliando(null); setCicloId(null);
  }, []);

  const tratarErro = useCallback((e) => {
    if (e.status === 401) { sair(); return; }
    setErro(e.message || "Não foi possível carregar os dados.");
  }, [sair]);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const [me, banco, participacao, acoes] = await Promise.all([api.me(token), api.perguntas(token), api.participacao(token), api.acoes(token)]);
      setDados({ me, banco, participacao, acoes });
      // Os indicadores de troca de senha/aceite vêm sempre do servidor.
      if (me.usuario.trocaSenha !== usuario.trocaSenha || me.usuario.consentimentoPendente !== usuario.consentimentoPendente || me.usuario.papel !== usuario.papel) {
        entrar(me.usuario, token);
      }
      setErro("");
    } catch (e) { tratarErro(e); }
  }, [token, usuario, tratarErro]);

  const carregarKpis = useCallback(async () => {
    try {
      const [k, s] = await Promise.all([api.kpis(token), api.sugestoes(token)]);
      setKpis(k); setSugestoes(s);
      setCicloId(id => id ?? cicloPadrao(k)?.id ?? null);
    } catch (e) { tratarErro(e); }
  }, [token, tratarErro]);

  useEffect(() => { if (pronto) carregar(); }, [pronto, token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (pronto && usuario.papel === "gestor" && PRECISA_KPIS.has(aba) && !kpis) carregarKpis(); }, [aba, pronto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sessao) return <Login onLogin={entrar}/>;
  if (usuario.trocaSenha) return <TrocaSenha token={token} usuario={usuario} onConcluir={entrar} onSair={sair}/>;
  if (usuario.consentimentoPendente) return <Privacidade token={token} onAceite={u=>entrar(u, token)} onSair={sair}/>;

  if (!dados) return (
    <div style={{ fontFamily:FONTE, background:C.bg, minHeight:"100vh", color:C.text, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      {erro ? <div style={{ maxWidth:420 }}><Aviso style={{ marginBottom:12 }}>{erro}</Aviso><Btn onClick={carregar}>Tentar de novo</Btn> <Btn outline color={C.muted} onClick={sair}>Sair</Btn></div>
        : <span style={{ color:C.muted }}>Carregando...</span>}
    </div>
  );

  const { me, banco, participacao, acoes } = dados;
  const gestor = usuario.papel === "gestor";

  if (avaliando) return (
    <Avaliacao tipo={avaliando} me={me} banco={banco} token={token} papel={usuario.papel}
      onVoltar={()=>{ setAvaliando(null); carregar(); }} onConcluido={()=>{ carregar(); if (kpis) carregarKpis(); }}/>
  );

  const abas = gestor ? [...ABAS_TODOS, ...ABAS_GESTOR] : ABAS_TODOS;
  const larga = ["missionarios", "relatorio"].includes(aba);
  const precisaKpis = gestor && PRECISA_KPIS.has(aba);

  return (
    <div style={{ fontFamily:FONTE, background:C.bg, minHeight:"100vh", color:C.text }}>
      <AppHeader papel={usuario.papel} tl={me.missionario ? me.missionario.tl : null} onHome={()=>setAba("inicio")} onSair={sair}/>
      <Abas abas={abas} atual={aba} onTrocar={setAba}/>
      <div className="conteudo" style={{ maxWidth:larga ? 1040 : 880, margin:"0 auto", padding:"24px 20px 60px", boxSizing:"border-box" }}>
        {erro && <Aviso style={{ marginBottom:16 }}>⚠ {erro} <button onClick={()=>{ setErro(""); carregar(); }} style={{ marginLeft:8, background:"none", border:"none", color:C.accent, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>Tentar de novo</button></Aviso>}

        {aba === "inicio" && <Inicio me={me} banco={banco} papel={usuario.papel} acoes={acoes} participacao={participacao} onAvaliar={setAvaliando} onIr={setAba}/>}
        {aba === "perfil" && <Perfil me={me} token={token} onSenhaTrocada={entrar}/>}
        {aba === "participacao" && <Participacao participacao={participacao}/>}

        {precisaKpis && !kpis && <Vazio>Carregando resultados...</Vazio>}
        {precisaKpis && kpis && <>
          {aba === "resultados" && <Resultados kpis={kpis} banco={banco} cicloId={cicloId} onTrocarCiclo={setCicloId}/>}
          {aba === "sugestoes" && <Sugestoes dados={sugestoes} kpis={kpis} banco={banco}/>}
          {aba === "kpis" && <Kpis kpis={kpis} cicloId={cicloId} onTrocarCiclo={setCicloId} token={token} onAtualizar={carregarKpis}/>}
          {aba === "relatorio" && <Relatorio kpis={kpis} banco={banco} cicloId={cicloId} onTrocarCiclo={setCicloId} acoes={acoes} participacao={participacao} sugestoes={sugestoes}/>}
        </>}
        {gestor && aba === "missionarios" && <Missionarios token={token} usuarioLogado={usuario}/>}
        {gestor && aba === "cadastros" && <Cadastros token={token} banco={banco} onAlterado={()=>{ carregar(); if (kpis) carregarKpis(); }}/>}
      </div>
    </div>
  );
}
