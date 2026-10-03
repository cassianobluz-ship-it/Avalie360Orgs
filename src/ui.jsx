// Componentes visuais compartilhados.
import { C, nivel } from "./tema";
import { SEPAL_LOGO } from "./logo";

export function Badge({ children, color, style }) {
  return (
    <span style={{
      background:color+"22", color, border:`1px solid ${color}44`,
      borderRadius:20, padding:"2px 10px", fontSize:14, fontWeight:700, letterSpacing:0.5,
      ...style,
    }}>{children}</span>
  );
}

export function Barra({ valor, max, cor=C.accent, h=6 }) {
  return (
    <div style={{ height:h, background:C.border, borderRadius:10, overflow:"hidden" }}>
      <div style={{
        height:"100%", borderRadius:10, transition:"width 1s ease",
        width:`${Math.max(0, Math.min((valor/max)*100,100))}%`,
        background:`linear-gradient(90deg,${cor},${cor}AA)`,
        boxShadow:`0 0 8px ${cor}80`,
      }}/>
    </div>
  );
}

export function Titulo({ children, style }) {
  return <h3 style={{ color:C.muted, fontSize:14, letterSpacing:2, textTransform:"uppercase", margin:"0 0 12px", ...style }}>{children}</h3>;
}

export function Cartao({ children, style, borda }) {
  return <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${borda || C.border}`, ...style }}>{children}</div>;
}

export function Aviso({ children, cor=C.danger, style }) {
  return (
    <div style={{ background:`${cor}18`, border:`1px solid ${cor}50`, borderRadius:12, color:cor, fontSize:14, padding:"10px 16px", ...style }}>
      {children}
    </div>
  );
}

export function Vazio({ children }) {
  return <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px dashed ${C.border}`, color:C.muted, fontSize:14, lineHeight:1.6 }}>{children}</div>;
}

// Concordância 1–5 com os rótulos sempre visíveis (não só depois do clique).
const ROTULOS_ESCALA = ["Discordo totalmente", "Discordo", "Nem concordo nem discordo", "Concordo", "Concordo totalmente"];
const CORES_ESCALA = [C.danger, "#F97316", C.warning, C.success, "#00D4AA"];
export function EscalaInput({ value, onChange, rotulos = ROTULOS_ESCALA }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {rotulos.map((r, i) => {
        const n = i + 1, ativo = value === n, cor = CORES_ESCALA[i];
        return (
          <button key={n} onClick={()=>onChange(n)} aria-pressed={ativo} style={{
            display:"flex", alignItems:"center", gap:12, minHeight:48, padding:"8px 14px", borderRadius:12,
            cursor:"pointer", fontFamily:"inherit", fontSize:16, textAlign:"left", boxSizing:"border-box",
            border:`2px solid ${ativo?cor:C.border}`, background:ativo?cor+"22":C.card, color:ativo?cor:C.text,
            transition:"all 0.15s",
          }}>
            <span style={{
              width:30, height:30, borderRadius:8, flexShrink:0, fontWeight:800, fontSize:15,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:ativo?cor:C.bg, color:ativo?"#fff":C.muted, border:`1px solid ${ativo?cor:C.border}`,
            }}>{n}</span>
            <span style={{ fontWeight:ativo?700:500 }}>{r}</span>
          </button>
        );
      })}
    </div>
  );
}

export function BinariaInput({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      {[["Sim",C.success,"👍"],["Não",C.danger,"👎"]].map(([op,cor,em])=>(
        <button key={op} onClick={()=>onChange(op)} aria-pressed={value===op} style={{
          minHeight:48, padding:"12px 32px", borderRadius:12, cursor:"pointer", fontWeight:600, fontSize:16, boxSizing:"border-box",
          border:`2px solid ${value===op?cor:C.border}`, fontFamily:"inherit",
          background:value===op?cor+"22":C.card, color:value===op?cor:C.muted,
          transform:value===op?"scale(1.05)":"scale(1)", transition:"all 0.15s",
        }}>{em} {op}</button>
      ))}
    </div>
  );
}

// NPS 0–10 (padrão de mercado para "recomendaria?").
export function NpsInput({ value, onChange }) {
  const cor = n => n <= 6 ? C.danger : n <= 8 ? C.warning : C.success;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(11, minmax(0,1fr))", gap:4 }}>
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} onClick={()=>onChange(n)} aria-pressed={value===n} style={{
            height:46, borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:15, padding:0,
            border:`2px solid ${value===n?cor(n):C.border}`, background:value===n?cor(n)+"25":C.card, color:value===n?cor(n):C.muted,
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, fontSize:13, marginTop:6 }}>
        <span>0 · nada provável</span><span>10 · extremamente provável</span>
      </div>
    </div>
  );
}

export function Toast({ titulo, texto }) {
  return (
    <div style={{
      position:"fixed", top:80, right:24, zIndex:999, maxWidth:"calc(100vw - 48px)",
      background:`linear-gradient(135deg,${C.accent},#EA580C)`,
      borderRadius:16, padding:"14px 22px", boxShadow:`0 8px 32px ${C.accent}60`,
      display:"flex", alignItems:"center", gap:12, animation:"fadeIn 0.4s ease",
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <span style={{ fontSize:28 }}>⚡</span>
      <div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>{titulo}</div>
        {texto && <div style={{ color:"#fff9", fontSize:14 }}>{texto}</div>}
      </div>
    </div>
  );
}

export function AppHeader({ papel, tl, onHome, onSair }) {
  const nv = nivel(tl || 0);
  return (
    <div className="nao-imprimir" style={{
      background:C.surface, borderBottom:`1px solid ${C.border}`,
      padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:100, flexWrap:"wrap", rowGap:8, columnGap:10,
    }}>
      <div onClick={onHome} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
        <img src={SEPAL_LOGO} alt="SEPAL" style={{ width:44, height:"auto", objectFit:"contain" }}/>
        <span style={{ fontWeight:700, fontSize:18, letterSpacing:-0.5, whiteSpace:"nowrap" }}>
          Avalie<span style={{ color:C.accent }}>360</span>
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", rowGap:6 }}>
        {tl !== null && tl !== undefined && (
          <div title="Seus Talentos" style={{
            background:C.card, border:`1px solid ${C.border}`, borderRadius:20, height:30, padding:"0 12px", boxSizing:"border-box",
            display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
          }}>
            <span style={{ fontSize:14, lineHeight:1 }}>{nv.icon}</span>
            <span style={{ fontSize:14, fontWeight:700, letterSpacing:0.5, color:nv.cor, lineHeight:1 }}>{tl} TL</span>
          </div>
        )}
        <Badge color={papel==="gestor"?C.accent:C.purple} style={{ height:30, padding:"0 12px", boxSizing:"border-box", display:"inline-flex", alignItems:"center", whiteSpace:"nowrap" }}>
          {papel==="gestor"?"Gestor":"Missionário"}
        </Badge>
        {onSair && (
          <button onClick={onSair} style={{
            background:"none", border:`1px solid ${C.border}`, color:C.muted, borderRadius:20, height:30, padding:"0 12px",
            boxSizing:"border-box", display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:700, letterSpacing:0.5, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
          }}>Sair</button>
        )}
      </div>
    </div>
  );
}

export function Modal({ titulo, onClose, children, largura=500 }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200, background:"#00000080",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={onClose}>
      <div role="dialog" aria-label={titulo} onClick={e=>e.stopPropagation()} style={{
        background:C.surface, borderRadius:16, padding:20, border:`1px solid ${C.border}`, maxWidth:largura, width:"100%",
        maxHeight:"90vh", overflowY:"auto", boxSizing:"border-box",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:12 }}>
          <h3 style={{ margin:0, fontSize:18, fontWeight:700 }}>{titulo}</h3>
          <button onClick={onClose} aria-label="Fechar" style={{ background:"none", border:"none", color:C.muted, fontSize:24, cursor:"pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Btn({ children, onClick, color=C.accent, outline, small, disabled, type="button", style }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding:small?"8px 16px":"12px 20px", borderRadius:12, minHeight:small?40:48,
      fontWeight:600, fontSize:small?14:16, cursor:disabled?"not-allowed":"pointer",
      fontFamily:"inherit", transition:"opacity 0.15s", opacity:disabled?0.5:1,
      border:outline?`1px solid ${color}`:"none",
      background:outline?color+"18":`linear-gradient(135deg,${color},${color}CC)`,
      color:outline?color:"#fff", boxSizing:"border-box", ...style,
    }}>{children}</button>
  );
}

const estiloCampo = disabled => ({
  width:"100%", height:48, padding:"0 14px", borderRadius:12, fontSize:16, fontFamily:"inherit",
  background:disabled?C.bg:C.surface, border:`1px solid ${C.border}`,
  color:disabled?C.muted:C.text, boxSizing:"border-box",
});

export function FieldInput({ label, value, onChange, type="text", disabled, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", color:C.muted, fontSize:14, marginBottom:5 }}>{label}
        <input type={type} value={value ?? ""} onChange={onChange} disabled={disabled} placeholder={placeholder} autoComplete={autoComplete}
          style={{ ...estiloCampo(disabled), marginTop:5, display:"block", cursor:disabled?"not-allowed":"text" }}/>
      </label>
    </div>
  );
}

export function FieldSelect({ label, value, onChange, options, disabled, vazio="Selecione..." }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", color:C.muted, fontSize:14, marginBottom:5 }}>{label}
        <select value={value ?? ""} onChange={onChange} disabled={disabled} style={{ ...estiloCampo(disabled), color:C.text, marginTop:5, display:"block", cursor:"pointer" }}>
          {vazio !== null && <option value="">{vazio}</option>}
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    </div>
  );
}

export function FieldTexto({ label, value, onChange, placeholder, minHeight=96 }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", color:C.muted, fontSize:14, marginBottom:5 }}>{label}
        <textarea value={value ?? ""} onChange={onChange} placeholder={placeholder} style={{
          width:"100%", minHeight, padding:14, borderRadius:12, fontSize:16, marginTop:5, display:"block",
          background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box",
        }}/>
      </label>
    </div>
  );
}

// Abas horizontais (rolam no celular).
export function Abas({ abas, atual, onTrocar }) {
  return (
    <div className="nao-imprimir" role="tablist" style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", padding:"0 20px", gap:4, overflowX:"auto" }}>
      {abas.map(t=>(
        <button key={t.id} role="tab" aria-selected={atual===t.id} onClick={()=>onTrocar(t.id)} style={{
          padding:"12px 16px", background:"none", fontWeight:600, fontSize:14, cursor:"pointer",
          fontFamily:"inherit", border:"none", whiteSpace:"nowrap",
          borderBottom:atual===t.id?`2px solid ${C.accent}`:"2px solid transparent",
          color:atual===t.id?C.accent:C.muted, transition:"all 0.15s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}
