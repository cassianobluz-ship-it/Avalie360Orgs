// Login, troca obrigatória da senha provisória e aviso de privacidade (LGPD).
import { useState } from "react";
import { api, MODO_DEMO } from "../api";
import { USUARIOS_DEMO } from "../apiDemo";
import { C, FONTE } from "../tema";
import { SEPAL_LOGO } from "../logo";
import { Btn, FieldInput, Aviso } from "../ui";

function Moldura({ children, largura=420 }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONTE, color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ maxWidth:largura, padding:"32px 20px", width:"100%", boxSizing:"border-box" }}>{children}</div>
    </div>
  );
}

function Marca() {
  return (
    <div style={{ textAlign:"center" }}>
      <img src={SEPAL_LOGO} alt="SEPAL" style={{ width:160, height:"auto", display:"block", margin:"0 auto 16px" }}/>
      <h1 style={{ fontSize:22, fontWeight:700, margin:"0 0 6px", letterSpacing:-0.5 }}>Avalie<span style={{ color:C.accent }}>360</span></h1>
      <p style={{ marginBottom:4, fontSize:16 }}>Medindo Nosso Pulso Organizacional</p>
      <p style={{ fontSize:16, marginBottom:28 }}>Sua voz transforma a missão ✦</p>
    </div>
  );
}

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e, emailDemo) {
    e?.preventDefault();
    setErro("");
    if (!emailDemo && (!email || !senha)) { setErro("Informe e-mail e senha."); return; }
    setCarregando(true);
    try {
      const { usuario, token } = await api.login(emailDemo || email.trim(), senha);
      onLogin(usuario, token);
    } catch (err) {
      setErro(err.message || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Moldura>
      <Marca/>
      {MODO_DEMO && (
        <div style={{ background:C.card, border:`1px solid ${C.purple}60`, borderRadius:16, padding:20, marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Modo demonstração</div>
          <p style={{ color:C.muted, fontSize:14, margin:"0 0 14px" }}>Dados fictícios. Nada do que for feito aqui é gravado no sistema real.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { u:USUARIOS_DEMO.gestor,      rotulo:"Entrar como Gestor",      sub:"Resultados, KPIs, sugestões, relatório e cadastros", cor:C.purple },
              { u:USUARIOS_DEMO.missionario, rotulo:"Entrar como Missionário", sub:"Responder pulsos, Talentos e participação",          cor:C.accent },
            ].map(({ u, rotulo, sub, cor }) => (
              <button key={u.papel} type="button" disabled={carregando} onClick={()=>entrar(null, u.email)} style={{
                minHeight:48, padding:"12px 16px", borderRadius:12, cursor:"pointer", textAlign:"left",
                background:`${cor}22`, border:`1px solid ${cor}80`, color:C.text, fontFamily:"inherit",
              }}>
                <div style={{ fontSize:16, fontWeight:600 }}>{rotulo}</div>
                <div style={{ fontSize:14, color:C.muted }}>{u.nome} · {sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {!MODO_DEMO && (
        <form onSubmit={entrar} style={{ display:"flex", flexDirection:"column", gap:2 }}>
          <FieldInput label="E-mail (@sepal.org.br)" value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="voce@sepal.org.br" autoComplete="username"/>
          <FieldInput label="Senha" value={senha} onChange={e=>setSenha(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password"/>
          {erro && <p role="alert" style={{ color:C.danger, fontSize:14, margin:"0 0 8px" }}>{erro}</p>}
          <Btn type="submit" disabled={carregando} style={{ width:"100%", boxShadow:`0 4px 24px ${C.accent}50` }}>{carregando ? "Entrando..." : "Entrar"}</Btn>
          <p style={{ color:C.muted, fontSize:14, marginTop:16, lineHeight:1.5, textAlign:"center" }}>
            O acesso é criado pela gestão da SEPAL. Esqueceu a senha? Peça à gestão uma nova senha provisória.
          </p>
        </form>
      )}
      {MODO_DEMO && erro && <Aviso>{erro}</Aviso>}
    </Moldura>
  );
}

// Primeiro acesso (ou senha redefinida pela gestão): a senha provisória precisa ser trocada.
export function TrocaSenha({ token, usuario, onConcluir, onSair }) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    if (nova.length < 8) return setErro("A nova senha precisa ter pelo menos 8 caracteres.");
    if (nova !== confirma) return setErro("A confirmação não confere com a nova senha.");
    setSalvando(true);
    try {
      const r = await api.trocarSenha(token, atual, nova);
      onConcluir(r.usuario, r.token);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Moldura>
      <Marca/>
      <h2 style={{ fontSize:20, margin:"0 0 6px" }}>Crie a sua senha</h2>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 18px", lineHeight:1.5 }}>
        Olá, {usuario.nome.split(" ")[0]}! Você entrou com uma senha provisória. Para proteger os seus dados, crie uma senha só sua.
      </p>
      <form onSubmit={salvar}>
        <FieldInput label="Senha provisória" type="password" value={atual} onChange={e=>setAtual(e.target.value)} autoComplete="current-password"/>
        <FieldInput label="Nova senha (mínimo 8 caracteres)" type="password" value={nova} onChange={e=>setNova(e.target.value)} autoComplete="new-password"/>
        <FieldInput label="Repita a nova senha" type="password" value={confirma} onChange={e=>setConfirma(e.target.value)} autoComplete="new-password"/>
        {erro && <p role="alert" style={{ color:C.danger, fontSize:14, margin:"0 0 8px" }}>{erro}</p>}
        <Btn type="submit" disabled={salvando} style={{ width:"100%" }}>{salvando ? "Salvando..." : "Salvar e continuar"}</Btn>
      </form>
      <button onClick={onSair} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, marginTop:16, width:"100%", fontFamily:"inherit" }}>Sair</button>
    </Moldura>
  );
}

// Texto do aviso de privacidade. Ao mudar o texto, mudar também VERSAO_PRIVACIDADE no servidor.
export function TextoPrivacidade() {
  const s = { margin:"0 0 12px", lineHeight:1.6, fontSize:15 };
  const h = { fontSize:16, margin:"18px 0 6px", color:C.text };
  return (
    <div style={{ color:C.text }}>
      <p style={s}>O Avalie360 é o sistema de avaliação organizacional da SEPAL. Este aviso explica, de forma simples, quais dados são usados, para quê e como a sua participação é protegida, conforme a Lei Geral de Proteção de Dados (LGPD).</p>
      <h4 style={h}>Suas respostas são confidenciais</h4>
      <p style={s}>O registro de que você participou e o conteúdo das suas respostas ficam guardados <b>separados e sem ligação entre si</b>. Ninguém, nem a gestão, consegue ver como você respondeu. Os resultados aparecem apenas como médias de grupos com <b>no mínimo 5 respostas</b> (3 na avaliação de liderança). As sugestões escritas aparecem sem nome; evite colocar no texto informações que identifiquem você.</p>
      <h4 style={h}>Quais dados são usados e para quê</h4>
      <p style={s}><b>Cadastro</b> (nome, e-mail, WhatsApp, equipe e data de nascimento): para o seu acesso e para a comunicação da gestão com você. <b>Participação</b> (quais pulsos você respondeu e quando): para seus Talentos, seu histórico, lembretes e a taxa de participação das equipes. <b>Respostas</b>: guardadas sem identificação, para os resultados da organização.</p>
      <h4 style={h}>Quem vê o quê</h4>
      <p style={s}>Você vê os seus próprios dados. A gestão vê o cadastro e se você já participou do ciclo, nunca as suas respostas. Outros missionários não veem os seus dados.</p>
      <h4 style={h}>Por quanto tempo</h4>
      <p style={s}>O cadastro é mantido enquanto você fizer parte da SEPAL. As respostas, por não identificarem ninguém, podem ser mantidas para comparar os resultados ao longo do tempo.</p>
      <h4 style={h}>Seus direitos</h4>
      <p style={s}>Você pode pedir acesso, correção ou exclusão dos seus dados e retirar este aceite a qualquer momento, falando com a gestão da SEPAL. Responder aos pulsos é voluntário.</p>
    </div>
  );
}

export function Privacidade({ token, onAceite, onSair }) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  async function aceitar() {
    setSalvando(true);
    try {
      const r = await api.consentir(token);
      onAceite(r.usuario);
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }
  return (
    <Moldura largura={620}>
      <h2 style={{ fontSize:22, margin:"0 0 4px" }}>🔒 Aviso de privacidade</h2>
      <p style={{ color:C.muted, fontSize:14, margin:"0 0 10px" }}>Leia antes de começar. Leva cerca de 2 minutos.</p>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:16, maxHeight:"55vh", overflowY:"auto" }}>
        <TextoPrivacidade/>
      </div>
      {erro && <Aviso style={{ marginBottom:12 }}>{erro}</Aviso>}
      <Btn onClick={aceitar} disabled={salvando} style={{ width:"100%" }}>{salvando ? "Registrando..." : "Li e concordo"}</Btn>
      <button onClick={onSair} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, marginTop:14, width:"100%", fontFamily:"inherit" }}>Não concordo — sair</button>
    </Moldura>
  );
}
