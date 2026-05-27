import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Wrench, BarChart2, Package,
  Users, FileText, Bell, LogOut, ChevronRight, Plus, X,
  Calendar, Zap, Shield, Search, ClipboardList, AlertCircle,
  Check, RefreshCw, Activity, ArrowRight, Edit2, Trash2,
  TrendingUp, Layers, Info, Wifi, WifiOff, Gauge, Key, FileWarning
} from "lucide-react";
import { db } from "./firebase.js";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

// ─── USUARIOS ─────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:"u1", name:"Christopher Silva", role:"supervisor",  email:"csilva@navimag.cl",  password:"Navimag2026", avatar:"CS" },
  { id:"u2", name:"José Muñoz",        role:"supervisor",  email:"jmunoz@navimag.cl",  password:"Navimag2026", avatar:"JM" },
  { id:"u3", name:"Felipe Stein",      role:"operaciones", email:"fstein@navimag.cl",  password:"Navimag2026", avatar:"FS" },
  { id:"u4", name:"Jorge Soto",        role:"operaciones", email:"jsoto@navimag.cl",   password:"Navimag2026", avatar:"JS" },
];

// ─── EQUIPOS NAVIMAG ──────────────────────────────────────────────────────────
const SEED_EQUIPMENT = [
  { id:"mol1",   code:"MOL-01",  name:"Mol 1",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol2",   code:"MOL-02",  name:"Mol 2",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol3",   code:"MOL-03",  name:"Mol 3",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol4",   code:"MOL-04",  name:"Mol 4",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal69",  code:"KAL-69",  name:"Kalmar 69",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal71",  code:"KAL-71",  name:"Kalmar 71",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal72",  code:"KAL-72",  name:"Kalmar 72",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal73",  code:"KAL-73",  name:"Kalmar 73",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal75",  code:"KAL-75",  name:"Kalmar 75",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal76",  code:"KAL-76",  name:"Kalmar 76",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter648", code:"TER-648", name:"Terberg 648", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter659", code:"TER-659", name:"Terberg 659", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter779", code:"TER-779", name:"Terberg 779", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter789", code:"TER-789", name:"Terberg 789", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter73",  code:"TER-73",  name:"Terberg 73",  type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter74",  code:"TER-74",  name:"Terberg 74",  type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif1",   code:"LIF-01",  name:"Liftec 1",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif2",   code:"LIF-02",  name:"Liftec 2",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif3",   code:"LIF-03",  name:"Liftec 3",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru39",  code:"GRU-39",  name:"Grúa 39",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru40",  code:"GRU-40",  name:"Grúa 40",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru41",  code:"GRU-41",  name:"Grúa 41",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
];

const SEED_PM_PLANS    = [];
const SEED_REQUESTS    = [];
const SEED_WORK_ORDERS = [];
const SEED_DEVIATIONS  = [];

// ─── COLECCIÓN NUEVA (fuerza reinicio de datos en Firebase) ──────────────────
const COLL = "mantek_v2";

async function saveData(key, arr) {
  try { await setDoc(doc(db,COLL,key),{data:arr}); } catch(e) { console.error("Save:",e); }
}
async function initIfEmpty(key, seed) {
  try { const s=await getDoc(doc(db,COLL,key)); if(!s.exists()) await setDoc(doc(db,COLL,key),{data:seed}); } catch(e) { console.error("Init:",e); }
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt   = d => d ? new Date(d).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
const fmtDT = d => d ? new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const uid = () => Math.random().toString(36).slice(2,10);
const nextOTCode = wos => `OT-${new Date().getFullYear()}-${String(wos.length+1).padStart(3,"0")}`;
const CRIT_LABEL = { A:"Crítico", B:"Importante", C:"Rutinario" };

// ─── NAVIMAG COLORS ───────────────────────────────────────────────────────────
// Primary navy: #002060  Secondary blue: #0055A4  Accent: #00AEEF
const NV = {
  navy:    "#002060",
  blue:    "#0055A4",
  cyan:    "#00AEEF",
  navyMid: "#003087",
  light:   "#E8F2FB",
};

// ─── THEME ───────────────────────────────────────────────────────────────────
const ST = {
  pendiente:     {label:"Pendiente",     cls:"text-gray-600    bg-gray-100    border-gray-300"   },
  asignada:      {label:"Asignada",      cls:"text-blue-700    bg-blue-50     border-blue-200"   },
  en_proceso:    {label:"En Proceso",    cls:"text-amber-700   bg-amber-50    border-amber-200"  },
  completada:    {label:"Completada",    cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  cancelada:     {label:"Cancelada",     cls:"text-red-700     bg-red-50      border-red-200"    },
  aprobada:      {label:"Aprobada",      cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  rechazada:     {label:"Rechazada",     cls:"text-red-700     bg-red-50      border-red-200"    },
  revisado:      {label:"Revisado",      cls:"text-blue-700    bg-blue-50     border-blue-200"   },
  operativo:     {label:"Operativo",     cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  mantenimiento: {label:"Mantenimiento", cls:"text-amber-700   bg-amber-50    border-amber-200"  },
  falla:         {label:"Falla",         cls:"text-red-700     bg-red-50      border-red-200"    },
};
const CRIT_CLS={A:"text-red-700 bg-red-50 border-red-200",B:"text-amber-700 bg-amber-50 border-amber-200",C:"text-emerald-700 bg-emerald-50 border-emerald-200"};
const PRI_CLS ={alta:"text-red-700 bg-red-50 border-red-200",media:"text-amber-700 bg-amber-50 border-amber-200",baja:"text-emerald-700 bg-emerald-50 border-emerald-200"};

const Badge=({s,label})=>{const c=ST[s]||{label:s,cls:"text-gray-600 bg-gray-100 border-gray-300"};return<span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${c.cls}`}>{label||c.label}</span>;};

const ROLE_CFG={
  supervisor: {label:"Supervisor", color:"text-cyan-300",  bg:"bg-cyan-900/40",   icon:Shield,   nav:["dashboard","workorders","equipment","plans","indicadores","requests","deviaciones","reports","users"]},
  mecanico:   {label:"Mecánico",   color:"text-amber-300", bg:"bg-amber-900/30",  icon:Wrench,   nav:["dashboard","workorders","deviaciones","reports"]},
  operaciones:{label:"Operaciones",color:"text-sky-300",   bg:"bg-sky-900/30",    icon:Activity, nav:["dashboard","requests","notifications"]},
};

const iCls="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
const sCls="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-400";
const card="bg-white border border-gray-200 rounded-xl shadow-sm";
const btnPrimary="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm hover:opacity-90";

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({title,onClose,children,wide=false}){
  return(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-bold text-base">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({onSave,onCancel,label="Guardar"}){
  return(
    <div className="flex gap-2 mt-5">
      <button onClick={onSave}   style={{background:NV.blue}} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button>
      <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
    </div>
  );
}

// ─── CHANGE PASSWORD MODAL ───────────────────────────────────────────────────
function ChangePasswordModal({user,onSave,onClose}){
  const [oldPwd,setOldPwd]=useState(""); const [newPwd,setNewPwd]=useState(""); const [conf,setConf]=useState(""); const [err,setErr]=useState("");
  const handle=()=>{
    if(!oldPwd||!newPwd||!conf){setErr("Completa todos los campos");return;}
    if(newPwd!==conf){setErr("Las contraseñas nuevas no coinciden");return;}
    if(newPwd.length<6){setErr("La contraseña debe tener al menos 6 caracteres");return;}
    const e=onSave(oldPwd,newPwd); if(e)setErr(e);
  };
  return(
    <Modal title="Cambiar Contraseña" onClose={onClose}>
      {err&&<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">{err}</div>}
      <div className="space-y-3">
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">CONTRASEÑA ACTUAL</label><input type="password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} className={iCls}/></div>
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">NUEVA CONTRASEÑA</label><input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className={iCls}/></div>
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">CONFIRMAR NUEVA CONTRASEÑA</label><input type="password" value={conf} onChange={e=>setConf(e.target.value)} className={iCls}/></div>
      </div>
      <ModalActions onSave={handle} onCancel={onClose} label="Cambiar Contraseña"/>
    </Modal>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({icon:Icon,label,value,sub,color="navy"}){
  const m={
    navy:   "border-blue-200 bg-blue-50   text-blue-800",
    blue:   "border-blue-200 bg-blue-50   text-blue-700",
    red:    "border-red-200  bg-red-50    text-red-600",
    amber:  "border-amber-200 bg-amber-50 text-amber-700",
    emerald:"border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan:   "border-cyan-200 bg-cyan-50   text-cyan-700",
  };
  return(
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${m[color]||m.navy}`}><Icon size={20}/></div>
      <div>
        <p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p>
        <p className="text-gray-900 font-bold text-2xl leading-none">{value}</p>
        {sub&&<p className="text-gray-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({users,onLogin}){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  const handle=()=>{const u=users.find(x=>x.email.toLowerCase()===email.trim().toLowerCase()&&x.password===pass);if(u)onLogin(u);else setErr("Credenciales incorrectas");};
  return(
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{background:`linear-gradient(160deg, ${NV.navy} 0%, ${NV.navyMid} 40%, ${NV.blue} 70%, ${NV.cyan} 100%)`}}>

      {/* Wave decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-20" preserveAspectRatio="none">
          <path fill="white" d="M0,192L60,202.7C120,213,240,235,360,224C480,213,600,171,720,165.3C840,160,960,192,1080,197.3C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-10" preserveAspectRatio="none">
          <path fill="white" d="M0,256L80,240C160,224,320,192,480,192C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"/>
        </svg>
        {/* Ship silhouette */}
        <svg viewBox="0 0 800 200" className="absolute bottom-8 right-0 w-96 opacity-10">
          <path fill="white" d="M50,150 L100,140 L100,100 L120,100 L120,80 L140,80 L140,100 L200,100 L200,60 L220,60 L220,100 L400,100 L420,100 L420,80 L440,80 L440,100 L700,120 L750,150 Z"/>
          <rect x="120" y="40" width="20" height="60" fill="white"/>
          <rect x="420" y="30" width="20" height="70" fill="white"/>
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <Wrench size={32} className="text-white"/>
            </div>
            <div>
              <p className="text-white font-bold text-2xl tracking-wide">MANTEK ERP</p>
              <p className="text-blue-200 text-xs tracking-widest font-medium">NAVIMAG · MANTENIMIENTO</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50">
          <p className="font-bold mb-6 text-sm" style={{color:NV.navy}}>Iniciar Sesión</p>
          {err&&<div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">{err}</div>}
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">CORREO</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} className={iCls} placeholder="usuario@navimag.cl"/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">CONTRASEÑA</label>
              <div className="relative">
                <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} className={iCls+" pr-16"} placeholder="••••••"/>
                <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">{show?"Ocultar":"Mostrar"}</button>
              </div>
            </div>
            <button onClick={handle} style={{background:`linear-gradient(90deg, ${NV.navy}, ${NV.blue})`}}
              className="w-full text-white font-bold py-3 rounded-xl text-sm transition shadow-md hover:opacity-90 mt-2">
              INGRESAR
            </button>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{background:NV.blue}}>
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M3 12h18M3 6h18M3 18h18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <p className="text-gray-400 text-xs">Navimag · Departamento de Mantenimiento</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV_ITEMS={
  dashboard:     {label:"Dashboard",          icon:BarChart2},
  workorders:    {label:"Órdenes de Trabajo", icon:ClipboardList},
  equipment:     {label:"Equipos",            icon:Package},
  plans:         {label:"Plan Preventivo",    icon:Calendar},
  indicadores:   {label:"Indicadores KPI",    icon:TrendingUp},
  requests:      {label:"Solicitudes",        icon:Bell},
  notifications: {label:"Notificaciones",     icon:Bell},
  deviaciones:   {label:"Rep. Inspección",    icon:FileWarning},
  reports:       {label:"Informes",           icon:FileText},
  users:         {label:"Usuarios",           icon:Users},
};
function Sidebar({user,active,onNav,onLogout,onChangePassword,notifications,devBadge,online}){
  const cfg=ROLE_CFG[user.role]; const RoleIcon=cfg.icon;
  return(
    <div className="w-56 flex flex-col h-screen sticky top-0 flex-shrink-0 shadow-xl" style={{background:NV.navy}}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20">
            <Wrench size={15} className="text-white"/>
          </div>
          <div>
            <p className="text-white font-bold text-sm">MANTEK ERP</p>
            <div className="flex items-center gap-1">
              {online
                ?<><Wifi size={9} className="text-emerald-400"/><p className="text-emerald-400 text-xs">En línea</p></>
                :<><WifiOff size={9} className="text-red-400"/><p className="text-red-400 text-xs">Sin conexión</p></>}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {cfg.nav.map(key=>{
          const item=NAV_ITEMS[key]; if(!item) return null;
          const Icon=item.icon; const isActive=active===key;
          const badge=((key==="requests"||key==="notifications")&&notifications>0)||(key==="deviaciones"&&devBadge>0);
          return(
            <button key={key} onClick={()=>onNav(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive?"text-white font-semibold":"text-blue-200 hover:text-white hover:bg-white/10"}`}
              style={isActive?{background:`${NV.blue}cc`}:{}}>
              <Icon size={15}/><span className="flex-1 text-left">{item.label}</span>
              {badge&&<span className="bg-amber-400 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{key==="deviaciones"?devBadge:notifications}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white`}>{user.avatar}</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className={`text-xs ${cfg.color} flex items-center gap-1`}><RoleIcon size={10}/>{cfg.label}</p>
          </div>
        </div>
        <button onClick={onChangePassword} className="w-full flex items-center gap-2 px-3 py-2 text-blue-300 hover:text-white text-sm rounded-lg hover:bg-white/10 transition-all">
          <Key size={14}/><span>Cambiar Contraseña</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-blue-300 hover:text-red-400 text-sm rounded-lg hover:bg-red-400/10 transition-all">
          <LogOut size={14}/><span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({user,data,onNav}){
  const {wos,equip,requests}=data; const role=user.role;
  const pendingWOs=wos.filter(w=>w.status!=="completada"&&w.status!=="cancelada");
  const myWOs=wos.filter(w=>w.assignedTo===user.id&&w.status!=="completada");
  const fallas=equip.filter(e=>e.status==="falla");
  const completed=wos.filter(w=>w.status==="completada").length;
  return(
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-gray-900 font-bold text-xl">Dashboard</h1>
        <p className="text-gray-500 text-sm">Bienvenido, {user.name} · {ROLE_CFG[role].label}</p>
      </div>
      {role==="supervisor"&&<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="OT Activas"            value={pendingWOs.length} sub={`${pendingWOs.filter(w=>w.priority==="alta").length} críticas`} color="navy"/>
          <StatCard icon={AlertTriangle} label="Equipos en Falla"      value={fallas.length} color="red"/>
          <StatCard icon={Bell}          label="Solicitudes Pendientes" value={requests.filter(r=>r.status==="pendiente").length} color="cyan"/>
          <StatCard icon={CheckCircle}   label="OT Completadas"         value={completed} sub="este mes" color="emerald"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{color:NV.navy}}>OT Recientes</h2>
              <button onClick={()=>onNav("workorders")} className="text-xs hover:underline flex items-center gap-1" style={{color:NV.blue}}>Ver todo<ChevronRight size={12}/></button>
            </div>
            {wos.length===0&&<p className="text-gray-400 text-xs text-center py-4">Sin órdenes de trabajo</p>}
            {wos.slice(0,5).map(w=>(
              <div key={w.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                <Badge s={w.status}/><span className="text-gray-700 text-xs flex-1 truncate">{w.title}</span>
              </div>
            ))}
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{color:NV.navy}}>Estado de Equipos</h2>
              <button onClick={()=>onNav("equipment")} className="text-xs hover:underline flex items-center gap-1" style={{color:NV.blue}}>Ver todo<ChevronRight size={12}/></button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              {[["operativo","bg-emerald-500","Operativos"],["mantenimiento","bg-amber-400","En Mant."],["falla","bg-red-500","En Falla"]].map(([s,c,l])=>(
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${c}`}/>
                  <span className="text-gray-600 text-xs">{equip.filter(e=>e.status===s).length} {l}</span>
                </div>
              ))}
            </div>
            {fallas.length>0&&fallas.map(e=>(
              <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-red-100 last:border-0">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>
                <span className="text-gray-700 text-xs flex-1">{e.name}</span>
                <span className="text-gray-400 text-xs">{e.code}</span>
              </div>
            ))}
            {fallas.length===0&&<p className="text-emerald-600 text-xs text-center py-2">✅ Todos los equipos operativos</p>}
          </div>
        </div>
      </>}
      {role==="mecanico"&&<>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={ClipboardList} label="Mis OT Pendientes" value={myWOs.length} color="navy"/>
          <StatCard icon={CheckCircle}   label="Completadas"       value={wos.filter(w=>w.assignedTo===user.id&&w.status==="completada").length} color="emerald"/>
        </div>
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-sm mb-4" style={{color:NV.navy}}>Mis Órdenes de Trabajo</h2>
          {myWOs.length===0&&<p className="text-gray-400 text-sm text-center py-6">No tienes órdenes asignadas</p>}
          {myWOs.map(w=>{const eq=data.equip.find(e=>e.id===w.equipId);return(
            <div key={w.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-2 last:mb-0">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-mono font-bold mb-1" style={{color:NV.blue}}>{w.code}</p>
                  <p className="text-gray-800 text-sm font-semibold">{w.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{eq?.name} · {fmt(w.scheduledDate)}</p></div>
                <Badge s={w.status}/>
              </div>
            </div>
          );})}
        </div>
      </>}
      {role==="operaciones"&&<>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={AlertTriangle} label="Equipos en Falla" value={fallas.length} color="red"/>
          <StatCard icon={Bell}          label="Mis Solicitudes"  value={requests.filter(r=>r.requestedBy===user.id).length} color="cyan"/>
        </div>
        {fallas.length>0&&(
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="text-red-700 font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle size={15}/>Equipos con Falla Activa</h2>
            {fallas.map(e=>(
              <div key={e.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0 border border-red-100">
                <p className="text-gray-800 text-sm font-semibold">{e.name}</p>
                <p className="text-gray-500 text-xs">{e.location} · Criticidad {e.criticality}</p>
              </div>
            ))}
          </div>
        )}
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-sm mb-4" style={{color:NV.navy}}>Mis Solicitudes Recientes</h2>
          {requests.filter(r=>r.requestedBy===user.id).slice(0,5).map(r=>{
            const eq=equip.find(e=>e.id===r.equipId);
            return<div key={r.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
              <Badge s={r.status}/><span className="text-gray-700 text-xs flex-1 truncate">{r.title}</span><span className="text-gray-400 text-xs">{eq?.code}</span>
            </div>;
          })}
          {requests.filter(r=>r.requestedBy===user.id).length===0&&<p className="text-gray-400 text-sm text-center py-6">Sin solicitudes registradas</p>}
        </div>
      </>}
    </div>
  );
}

// ─── WORK ORDERS ─────────────────────────────────────────────────────────────
function WorkOrders({user,data,setData}){
  const {wos,equip,users,requests}=data;
  const [filter,setFilter]=useState("all"); const [search,setSearch]=useState("");
  const [sel,setSel]=useState(null); const [showRep,setShowRep]=useState(false);
  const [rep,setRep]=useState({actualHours:"",observations:"",status:"completada"});
  const role=user.role;
  const visible=wos.filter(w=>{
    if(role==="mecanico"&&w.assignedTo!==user.id) return false;
    if(filter!=="all"&&w.status!==filter) return false;
    if(search&&!w.title.toLowerCase().includes(search.toLowerCase())&&!w.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const updWO=(id,patch)=>{const u=wos.map(w=>w.id===id?{...w,...patch}:w);setData(d=>({...d,wos:u}));saveData("workOrders",u);if(sel?.id===id)setSel(s=>({...s,...patch}));};
  const submitRep=()=>{
    if(!rep.actualHours)return;
    updWO(sel.id,{status:rep.status,actualHours:parseFloat(rep.actualHours),observations:rep.observations});
    if(rep.status==="completada"&&sel.reqId){
      const updR=requests.map(r=>r.id===sel.reqId?{...r,status:"completada"}:r);
      setData(d=>({...d,requests:updR}));saveData("requests",updR);
    }
    setShowRep(false);setRep({actualHours:"",observations:"",status:"completada"});
  };
  const cur=sel?wos.find(w=>w.id===sel.id):null;
  const curEq=cur?equip.find(e=>e.id===cur.equipId):null;
  const curAs=cur?users.find(u=>u.id===cur.assignedTo):null;
  return(
    <div className="p-6 flex gap-5 h-full">
      <div className="flex-1 min-w-0">
        <div className="mb-5"><h1 className="text-gray-900 font-bold text-xl">Órdenes de Trabajo</h1><p className="text-gray-500 text-sm">{visible.length} registros</p></div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar OT..." className={iCls+" pl-9"}/>
          </div>
          {["all","pendiente","asignada","en_proceso","completada"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)}
              style={filter===s?{background:NV.blue}:{}}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${filter===s?"text-white border-transparent":"bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {s==="all"?"Todas":ST[s]?.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {visible.map(w=>{
            const eq=equip.find(e=>e.id===w.equipId); const asn=users.find(u=>u.id===w.assignedTo);
            return(
              <div key={w.id} onClick={()=>setSel(w)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${sel?.id===w.id?"shadow-sm":"border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}
                style={sel?.id===w.id?{borderColor:NV.blue,background:"#EBF4FF"}:{}}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold" style={{color:NV.blue}}>{w.code}</span>
                      <Badge s={w.type==="preventivo"?"asignada":"en_proceso"} label={w.type==="preventivo"?"Preventivo":"Correctivo"}/>
                      <Badge s={w.status}/>
                    </div>
                    <p className="text-gray-800 text-sm font-semibold truncate">{w.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-gray-400 text-xs flex items-center gap-1"><Package size={10}/>{eq?.code}</span>
                      <span className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={10}/>{fmt(w.scheduledDate)}</span>
                      {asn&&<span className="text-gray-400 text-xs flex items-center gap-1"><Users size={10}/>{asn.name}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold flex-shrink-0 ${PRI_CLS[w.priority]}`}>{w.priority.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
          {visible.length===0&&<div className="text-center py-12 text-gray-400 text-sm">No se encontraron órdenes</div>}
        </div>
      </div>
      {cur&&(
        <div className={`w-80 flex-shrink-0 ${card} p-5 h-fit sticky top-6 overflow-y-auto max-h-[calc(100vh-6rem)]`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold" style={{color:NV.blue}}>{cur.code}</span>
            <button onClick={()=>setSel(null)}><X size={16} className="text-gray-400 hover:text-gray-700"/></button>
          </div>
          <h3 className="text-gray-900 font-semibold text-sm mb-3">{cur.title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge s={cur.status}/>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[cur.priority]}`}>{cur.priority.toUpperCase()}</span>
          </div>
          <div className="space-y-2 mb-4 text-xs">
            {[["Equipo",curEq?.name||"—"],["Código",curEq?.code||"—"],["Tipo",cur.type],["Fuente",cur.source==="plan"?"Plan Preventivo":cur.source==="inspeccion"?"Inspección":"Solicitud"],["Programado",fmt(cur.scheduledDate)],["Horas Est.",`${cur.estimatedHours}h`],["Asignado a",curAs?.name||"—"]].map(([k,v])=>(
              <div key={k} className="flex justify-between gap-2"><span className="text-gray-400">{k}</span><span className="text-gray-700 text-right">{v}</span></div>
            ))}
            {cur.actualHours&&<div className="flex justify-between"><span className="text-gray-400">Horas Reales</span><span className="text-emerald-600 font-semibold">{cur.actualHours}h</span></div>}
          </div>
          {cur.description&&<div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3 text-gray-600 text-xs">{cur.description}</div>}
          {cur.observations&&<div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3 text-xs"><span className="text-emerald-700 font-semibold">Obs: </span>{cur.observations}</div>}
          <div className="space-y-2 mt-4">
            {role==="mecanico"&&cur.assignedTo===user.id&&cur.status!=="completada"&&<>
              {cur.status==="asignada"&&<button onClick={()=>updWO(cur.id,{status:"en_proceso"})} className="w-full border text-sm py-2 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.light,borderColor:NV.blue,color:NV.blue}}>Iniciar Trabajo</button>}
              <button onClick={()=>setShowRep(true)} className="w-full text-white text-sm py-2 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.blue}}>Reportar Trabajo</button>
            </>}
            {role==="supervisor"&&cur.status!=="completada"&&cur.status!=="cancelada"&&(
              <select value={cur.status} onChange={e=>{
                const s=e.target.value;
                updWO(cur.id,{status:s});
                if(s==="completada"&&cur.reqId){
                  const updR=requests.map(r=>r.id===cur.reqId?{...r,status:"completada"}:r);
                  setData(d=>({...d,requests:updR}));saveData("requests",updR);
                }
              }} className={sCls}>
                <option value="pendiente">Pendiente</option><option value="asignada">Asignada</option>
                <option value="en_proceso">En Proceso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option>
              </select>
            )}
          </div>
        </div>
      )}
      {showRep&&(
        <Modal title={`Reportar — ${cur?.code}`} onClose={()=>setShowRep(false)}>
          <div className="space-y-4">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">HORAS REALES *</label><input type="number" step="0.5" value={rep.actualHours} onChange={e=>setRep(r=>({...r,actualHours:e.target.value}))} className={iCls} placeholder="ej: 3.5"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">OBSERVACIONES</label><textarea value={rep.observations} onChange={e=>setRep(r=>({...r,observations:e.target.value}))} rows={3} className={iCls+" resize-none"}/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ESTADO FINAL</label><select value={rep.status} onChange={e=>setRep(r=>({...r,status:e.target.value}))} className={sCls}><option value="completada">Completada</option><option value="en_proceso">En Proceso (parcial)</option></select></div>
          </div>
          <ModalActions onSave={submitRep} onCancel={()=>setShowRep(false)} label="Enviar Reporte"/>
        </Modal>
      )}
    </div>
  );
}

// ─── EQUIPMENT ───────────────────────────────────────────────────────────────
const EMPTY_EQ={code:"",name:"",type:"",location:"",criticality:"B",status:"operativo",hours:"",lastMaint:"",nextMaint:""};
const EQ_GROUPS=["Mol","Kalmar","Terberg","Liftec","Grúa","Otros"];
const getGroup=e=>{
  if(e.code.startsWith("MOL")) return "Mol";
  if(e.code.startsWith("KAL")) return "Kalmar";
  if(e.code.startsWith("TER")) return "Terberg";
  if(e.code.startsWith("LIF")) return "Liftec";
  if(e.code.startsWith("GRU")) return "Grúa";
  return "Otros";
};
function Equipment({user,data,setData}){
  const {equip}=data; const isSup=user.role==="supervisor";
  const [search,setSearch]=useState(""); const [showForm,setShowForm]=useState(false);
  const [editTarget,setEditTarget]=useState(null); const [form,setForm]=useState(EMPTY_EQ);
  const [confirmDel,setConfirmDel]=useState(null); const [editingHours,setEditingHours]=useState(null);
  const visible=equip.filter(e=>!search||e.name.toLowerCase().includes(search.toLowerCase())||e.code.toLowerCase().includes(search.toLowerCase()));
  const grouped=EQ_GROUPS.map(g=>({group:g,items:visible.filter(e=>getGroup(e)===g)})).filter(g=>g.items.length>0);
  const openNew=()=>{setForm(EMPTY_EQ);setEditTarget(null);setShowForm(true);};
  const openEdit=e=>{setForm({...e,hours:String(e.hours)});setEditTarget(e);setShowForm(true);};
  const saveEquip=()=>{
    if(!form.code||!form.name)return;
    const updated=editTarget?equip.map(e=>e.id===editTarget.id?{...e,...form,hours:parseInt(form.hours)||0}:e):[...equip,{id:uid(),...form,hours:parseInt(form.hours)||0,lastMaint:form.lastMaint||new Date().toISOString().slice(0,10)}];
    setData(d=>({...d,equip:updated}));saveData("equipment",updated);setShowForm(false);
  };
  const deleteEquip=id=>{const updated=equip.filter(e=>e.id!==id);setData(d=>({...d,equip:updated}));saveData("equipment",updated);setConfirmDel(null);};
  const saveHours=()=>{if(!editingHours)return;const val=parseInt(editingHours.val)||0;const updated=equip.map(e=>e.id===editingHours.id?{...e,hours:val}:e);setData(d=>({...d,equip:updated}));saveData("equipment",updated);setEditingHours(null);};
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Equipos</h1><p className="text-gray-500 text-sm">{equip.length} equipos registrados</p></div>
        {isSup&&<button onClick={openNew} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nuevo Equipo</button>}
      </div>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o código..." className={iCls+" pl-9 max-w-xs"}/>
      </div>
      <div className="space-y-6">
        {grouped.map(({group,items})=>(
          <div key={group}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-5 rounded-full" style={{background:NV.blue}}/>
              <h2 className="font-bold text-sm" style={{color:NV.navy}}>{group}</h2>
              <span className="text-gray-400 text-xs">({items.length} equipos)</span>
            </div>
            <div className={`${card} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-white font-semibold uppercase tracking-wider" style={{background:NV.navyMid}}>
                    <th className="text-left px-4 py-2.5">Código</th>
                    <th className="text-left px-4 py-2.5">Nombre</th>
                    <th className="text-left px-4 py-2.5 hidden md:table-cell">Ubicación</th>
                    <th className="text-left px-4 py-2.5">Criticidad</th>
                    <th className="text-left px-4 py-2.5">Estado</th>
                    <th className="text-left px-4 py-2.5"><span className="flex items-center gap-1"><Gauge size={11}/>Horómetro</span></th>
                    <th className="text-left px-4 py-2.5 hidden lg:table-cell">Próx. Mant.</th>
                    {isSup&&<th className="px-4 py-2.5 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((e,i)=>{
                    const isEditingThis=editingHours?.id===e.id;
                    return(
                      <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                        <td className="px-4 py-2.5"><span className="font-mono font-bold text-xs" style={{color:NV.blue}}>{e.code}</span></td>
                        <td className="px-4 py-2.5 text-gray-800 font-medium text-sm">{e.name}</td>
                        <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">{e.location}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{CRIT_LABEL[e.criticality]}</span></td>
                        <td className="px-4 py-2.5"><Badge s={e.status}/></td>
                        <td className="px-4 py-2.5">
                          {isEditingThis?(
                            <div className="flex items-center gap-1">
                              <input type="number" value={editingHours.val} onChange={e2=>setEditingHours(h=>({...h,val:e2.target.value}))}
                                onKeyDown={e2=>{if(e2.key==="Enter")saveHours();if(e2.key==="Escape")setEditingHours(null);}}
                                className="w-24 border border-blue-400 rounded-lg px-2 py-1 text-gray-900 text-xs focus:outline-none" autoFocus/>
                              <button onClick={saveHours} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{background:NV.blue}}><Check size={11} className="text-white"/></button>
                              <button onClick={()=>setEditingHours(null)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><X size={11} className="text-gray-600"/></button>
                            </div>
                          ):(
                            <div className="flex items-center gap-2 group">
                              <span className="text-gray-700 font-mono text-sm font-semibold">{e.hours.toLocaleString()}<span className="text-gray-400 text-xs ml-0.5">h</span></span>
                              {isSup&&<button onClick={()=>setEditingHours({id:e.id,val:String(e.hours)})} className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-blue-50"><Edit2 size={11} style={{color:NV.blue}}/></button>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500 text-xs">{fmt(e.nextMaint)}</td>
                        {isSup&&(
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={()=>openEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 transition" style={{color:NV.blue}}><Edit2 size={13}/></button>
                              <button onClick={()=>setConfirmDel(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={13}/></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <Modal title={editTarget?"Editar Equipo":"Nuevo Equipo"} onClose={()=>setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            {[["code","CÓDIGO"],["name","NOMBRE"],["type","TIPO"],["location","UBICACIÓN"]].map(([k,l])=>(
              <div key={k}><label className="text-gray-500 text-xs font-medium mb-1 block">{l}</label><input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className={iCls}/></div>
            ))}
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">CRITICIDAD</label>
              <select value={form.criticality} onChange={e=>setForm(f=>({...f,criticality:e.target.value}))} className={sCls}>
                <option value="A">A — Crítico</option><option value="B">B — Importante</option><option value="C">C — Rutinario</option>
              </select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ESTADO</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className={sCls}>
                <option value="operativo">Operativo</option><option value="mantenimiento">Mantenimiento</option><option value="falla">Falla</option>
              </select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">HORÓMETRO (h)</label><input type="number" value={form.hours} onChange={e=>setForm(f=>({...f,hours:e.target.value}))} className={iCls}/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRÓX. MANTENCIÓN</label><input type="date" value={form.nextMaint} onChange={e=>setForm(f=>({...f,nextMaint:e.target.value}))} className={iCls}/></div>
            <div className="col-span-2"><label className="text-gray-500 text-xs font-medium mb-1 block">ÚLTIMO MANTENCIÓN</label><input type="date" value={form.lastMaint} onChange={e=>setForm(f=>({...f,lastMaint:e.target.value}))} className={iCls}/></div>
          </div>
          <ModalActions onSave={saveEquip} onCancel={()=>setShowForm(false)} label={editTarget?"Guardar Cambios":"Crear Equipo"}/>
        </Modal>
      )}
      {confirmDel&&(
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0"><Trash2 size={18} className="text-red-600"/></div>
              <div><p className="text-gray-900 font-bold text-sm">Eliminar {confirmDel.code}</p><p className="text-gray-500 text-xs">{confirmDel.name}</p></div>
            </div>
            <p className="text-gray-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={()=>deleteEquip(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm transition">Eliminar</button>
              <button onClick={()=>setConfirmDel(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PLANS ───────────────────────────────────────────────────────────────────
const EMPTY_PLAN={name:"",frequency:"",unit:"días",nextDate:"",estimatedHours:"",technician:"",tasks:""};
function Plans({user,data,setData}){
  const {plans,equip,users,wos}=data;
  const [showForm,setShowForm]=useState(false); const [showMasivo,setShowMasivo]=useState(false);
  const [form,setForm]=useState({equipId:"",...EMPTY_PLAN});
  const [mForm,setMForm]=useState(EMPTY_PLAN); const [selEquips,setSelEquips]=useState([]); const [mName,setMName]=useState("");
  const genOT=(plan,allWOs)=>{
    const eq=equip.find(e=>e.id===plan.equipId);if(!eq)return null;
    const priority=eq.criticality==="A"?"alta":eq.criticality==="B"?"media":"baja";
    return {id:uid(),code:nextOTCode(allWOs),type:"preventivo",equipId:plan.equipId,planId:plan.id,title:plan.name,priority,status:"asignada",assignedTo:plan.technician,createdAt:new Date().toISOString(),scheduledDate:plan.nextDate,estimatedHours:parseFloat(plan.estimatedHours)||0,actualHours:null,description:`OT automática. Tareas: ${Array.isArray(plan.tasks)?plan.tasks.join(", "):plan.tasks}`,observations:"",parts:[],source:"plan"};
  };
  const addPlan=()=>{
    if(!form.equipId||!form.name)return;
    const np={id:uid(),...form,frequency:parseInt(form.frequency)||0,estimatedHours:parseFloat(form.estimatedHours)||0,tasks:form.tasks.split("\n").filter(Boolean)};
    const updP=[...plans,np];const newOT=genOT(np,wos);const updW=newOT?[...wos,newOT]:wos;
    setData(d=>({...d,plans:updP,wos:updW}));saveData("plans",updP);saveData("workOrders",updW);
    setShowForm(false);if(newOT)alert(`✅ OT ${newOT.code} generada`);
  };
  const addMasivo=()=>{
    if(selEquips.length===0||!mName)return;
    let allWOs=[...wos];let newPlans=[...plans];
    selEquips.forEach(eqId=>{const eq=equip.find(e=>e.id===eqId);if(!eq)return;
      const planName=mName.replace("{equipo}",eq.name).replace("{codigo}",eq.code);
      const np={id:uid(),equipId:eqId,name:planName,frequency:parseInt(mForm.frequency)||0,unit:mForm.unit,nextDate:mForm.nextDate,tasks:mForm.tasks.split("\n").filter(Boolean),estimatedHours:parseFloat(mForm.estimatedHours)||0,technician:mForm.technician};
      newPlans.push(np);const newOT=genOT(np,allWOs);if(newOT)allWOs.push(newOT);
    });
    setData(d=>({...d,plans:newPlans,wos:allWOs}));saveData("plans",newPlans);saveData("workOrders",allWOs);
    setShowMasivo(false);setSelEquips([]);setMForm(EMPTY_PLAN);setMName("");
    alert(`✅ ${selEquips.length} planes creados`);
  };
  const generateOT=plan=>{const newOT=genOT(plan,wos);if(!newOT)return;const updW=[...wos,newOT];setData(d=>({...d,wos:updW}));saveData("workOrders",updW);alert(`✅ OT ${newOT.code} — Prioridad ${newOT.priority.toUpperCase()}`);};
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Plan de Mantenimiento Preventivo</h1><p className="text-gray-500 text-sm">Programación automática de OT</p></div>
        {user.role==="supervisor"&&<div className="flex gap-2">
          <button onClick={()=>setShowMasivo(true)} className={btnPrimary} style={{background:`linear-gradient(90deg,${NV.navy},${NV.blue})`}}><Layers size={15}/>Plan Masivo</button>
          <button onClick={()=>setShowForm(true)}   className={btnPrimary} style={{background:NV.blue}}><Plus size={15}/>Nuevo Plan</button>
        </div>}
      </div>
      {plans.length===0&&<div className="text-center py-16 text-gray-400"><Calendar size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin planes de mantenimiento</p><p className="text-sm mt-1">Crea un plan individual o aplica un plan masivo a múltiples equipos</p></div>}
      <div className="space-y-4">
        {plans.map(p=>{
          const eq=equip.find(e=>e.id===p.equipId);const tech=users.find(u=>u.id===p.technician);
          const linked=wos.filter(w=>w.planId===p.id);const daysLeft=Math.ceil((new Date(p.nextDate)-new Date())/86400000);
          return(
            <div key={p.id} className={`${card} p-5 hover:shadow-md transition`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-bold text-xs" style={{color:NV.blue}}>{eq?.code}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${daysLeft<=0?"text-red-700 bg-red-50 border-red-200":daysLeft<=7?"text-red-700 bg-red-50 border-red-200":daysLeft<=30?"text-amber-700 bg-amber-50 border-amber-200":"text-emerald-700 bg-emerald-50 border-emerald-200"}`}>
                      {daysLeft<=0?"VENCIDO":`En ${daysLeft}d`}
                    </span>
                  </div>
                  <p className="text-gray-800 font-semibold text-sm mb-2">{p.name}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><RefreshCw size={10}/>Cada {p.frequency} {p.unit}</span>
                    <span className="flex items-center gap-1"><Calendar size={10}/>Prox: {fmt(p.nextDate)}</span>
                    <span className="flex items-center gap-1"><Clock size={10}/>{p.estimatedHours}h est.</span>
                    {tech&&<span className="flex items-center gap-1"><Users size={10}/>{tech.name}</span>}
                  </div>
                  {Array.isArray(p.tasks)&&p.tasks.length>0&&<div className="flex flex-wrap gap-1.5 mt-3">{p.tasks.map((t,i)=><span key={i} className="text-xs border px-2 py-0.5 rounded-full" style={{background:NV.light,borderColor:"#BFD9F2",color:NV.navy}}>{t}</span>)}</div>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-gray-400 text-xs">{linked.length} OT</span>
                  {user.role==="supervisor"&&<button onClick={()=>generateOT(p)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium text-white" style={{background:NV.blue}}><Zap size={12}/>Generar OT</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showForm&&(
        <Modal title="Nuevo Plan de Mantenimiento" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label><select value={form.equipId} onChange={e=>setForm(f=>({...f,equipId:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{equip.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE DEL PLAN</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={iCls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">FRECUENCIA</label><input type="number" value={form.frequency} onChange={e=>setForm(f=>({...f,frequency:e.target.value}))} className={iCls}/></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">UNIDAD</label><select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className={sCls}><option value="días">Días</option><option value="horas">Horas</option><option value="semanas">Semanas</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRÓXIMA FECHA</label><input type="date" value={form.nextDate} onChange={e=>setForm(f=>({...f,nextDate:e.target.value}))} className={iCls}/></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">HRS ESTIMADAS</label><input type="number" value={form.estimatedHours} onChange={e=>setForm(f=>({...f,estimatedHours:e.target.value}))} className={iCls}/></div>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÉCNICO ASIGNADO</label><select value={form.technician} onChange={e=>setForm(f=>({...f,technician:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{users.filter(u=>u.role==="mecanico").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TAREAS (una por línea)</label><textarea value={form.tasks} onChange={e=>setForm(f=>({...f,tasks:e.target.value}))} rows={4} className={iCls+" resize-none"} placeholder={"Cambio aceite motor\nFiltro hidráulico\nRevisión frenos"}/></div>
          </div>
          <ModalActions onSave={addPlan} onCancel={()=>setShowForm(false)} label="Guardar y Generar OT"/>
        </Modal>
      )}
      {showMasivo&&(
        <Modal title="Plan Masivo — Múltiples equipos" onClose={()=>setShowMasivo(false)} wide={true}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-700 text-xs flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5"/>
            <span>Usa <strong>{"{equipo}"}</strong> o <strong>{"{codigo}"}</strong> en el nombre para personalizarlo por equipo.</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-gray-700 font-semibold text-sm mb-2">Equipos <span style={{color:NV.blue}}>({selEquips.length})</span></p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {equip.map(e=>{const checked=selEquips.includes(e.id);return(
                  <label key={e.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${checked?"border-blue-300":"bg-gray-50 border-gray-200 hover:border-gray-300"}`} style={checked?{background:NV.light}:{}}>
                    <input type="checkbox" checked={checked} onChange={()=>setSelEquips(s=>s.includes(e.id)?s.filter(x=>x!==e.id):[...s,e.id])} className="w-4 h-4" style={{accentColor:NV.blue}}/>
                    <div><p className="text-gray-800 text-xs font-semibold">{e.name}</p><p className="text-gray-400 text-xs">{e.code}</p></div>
                  </label>
                );})}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>setSelEquips(equip.map(e=>e.id))} className="flex-1 text-xs hover:underline py-1" style={{color:NV.blue}}>Todos</button>
                <button onClick={()=>setSelEquips([])} className="flex-1 text-xs text-gray-400 hover:underline py-1">Limpiar</button>
              </div>
            </div>
            <div className="space-y-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE</label><input value={mName} onChange={e=>setMName(e.target.value)} className={iCls} placeholder="Servicio 250h - {equipo}"/></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-gray-500 text-xs font-medium mb-1 block">FRECUENCIA</label><input type="number" value={mForm.frequency} onChange={e=>setMForm(f=>({...f,frequency:e.target.value}))} className={iCls}/></div>
                <div><label className="text-gray-500 text-xs font-medium mb-1 block">UNIDAD</label><select value={mForm.unit} onChange={e=>setMForm(f=>({...f,unit:e.target.value}))} className={sCls}><option value="días">Días</option><option value="horas">Horas</option><option value="semanas">Semanas</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRÓXIMA FECHA</label><input type="date" value={mForm.nextDate} onChange={e=>setMForm(f=>({...f,nextDate:e.target.value}))} className={iCls}/></div>
                <div><label className="text-gray-500 text-xs font-medium mb-1 block">HRS ESTIMADAS</label><input type="number" value={mForm.estimatedHours} onChange={e=>setMForm(f=>({...f,estimatedHours:e.target.value}))} className={iCls}/></div>
              </div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÉCNICO</label><select value={mForm.technician} onChange={e=>setMForm(f=>({...f,technician:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{users.filter(u=>u.role==="mecanico").map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">TAREAS (una por línea)</label><textarea value={mForm.tasks} onChange={e=>setMForm(f=>({...f,tasks:e.target.value}))} rows={3} className={iCls+" resize-none"} placeholder={"Cambio aceite\nFiltros\nRevisión general"}/></div>
            </div>
          </div>
          {selEquips.length>0&&mName&&(
            <div className="mt-4 rounded-lg p-3 text-xs border" style={{background:NV.light,borderColor:"#BFD9F2",color:NV.navy}}>
              <p className="font-semibold mb-1">Vista previa:</p>
              {selEquips.slice(0,3).map(id=>{const eq=equip.find(e=>e.id===id);return<p key={id}>• {mName.replace("{equipo}",eq?.name||"").replace("{codigo}",eq?.code||"")}</p>;})}
              {selEquips.length>3&&<p className="opacity-60">... y {selEquips.length-3} más</p>}
            </div>
          )}
          <ModalActions onSave={addMasivo} onCancel={()=>setShowMasivo(false)} label={`Crear ${selEquips.length} Planes`}/>
        </Modal>
      )}
    </div>
  );
}

// ─── INDICADORES ─────────────────────────────────────────────────────────────
function Indicadores({data}){
  const {wos,equip}=data;
  const calc=eqId=>{const eq=equip.find(e=>e.id===eqId);const corr=wos.filter(w=>w.equipId===eqId&&w.type==="correctivo");const comp=corr.filter(w=>w.status==="completada"&&w.actualHours);const n=corr.length;const mttr=comp.length>0?(comp.reduce((s,w)=>s+(w.actualHours||0),0)/comp.length):null;const mtbf=n>0&&eq?(eq.hours/n):null;const disp=(mtbf!==null&&mttr!==null&&(mtbf+mttr)>0)?(mtbf/(mtbf+mttr)*100):null;return {n,mttr,mtbf,disp};};
  const gC=wos.filter(w=>w.type==="correctivo");const gCo=gC.filter(w=>w.status==="completada"&&w.actualHours);
  const gMTTR=gCo.length>0?(gCo.reduce((s,w)=>s+(w.actualHours||0),0)/gCo.length):null;
  const tH=equip.reduce((s,e)=>s+e.hours,0);const gMTBF=gC.length>0?(tH/gC.length):null;const gD=(gMTBF!==null&&gMTTR!==null&&(gMTBF+gMTTR)>0)?(gMTBF/(gMTBF+gMTTR)*100):null;
  const fH=v=>v===null?"N/D":`${v.toFixed(1)}h`;const fP=v=>v===null?"N/D":`${v.toFixed(1)}%`;const dC=v=>v===null?"text-gray-400":v>=90?"text-emerald-600":v>=70?"text-amber-600":"text-red-600";
  return(
    <div className="p-6 space-y-6">
      <div><h1 className="text-gray-900 font-bold text-xl">Indicadores de Mantenimiento</h1><p className="text-gray-500 text-sm">MTBF · MTTR · Disponibilidad</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock}         label="MTBF Global"    value={fH(gMTBF)}    sub="horas entre fallas"         color="blue"/>
        <StatCard icon={Wrench}        label="MTTR Global"    value={fH(gMTTR)}    sub="horas por reparación"       color="amber"/>
        <StatCard icon={TrendingUp}    label="Disponibilidad" value={fP(gD)}       sub="de la flota"                color="emerald"/>
        <StatCard icon={AlertTriangle} label="Total Fallas"   value={gC.length}    sub="OT correctivas registradas" color="red"/>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 text-xs text-white font-semibold uppercase tracking-wider flex items-center gap-2" style={{background:NV.navyMid}}>
          <BarChart2 size={14}/>KPIs por Equipo
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <th className="text-left px-4 py-3">Equipo</th><th className="text-left px-4 py-3">Crit.</th>
            <th className="text-right px-4 py-3">Horas</th><th className="text-right px-4 py-3">Fallas</th>
            <th className="text-right px-4 py-3">MTBF</th><th className="text-right px-4 py-3">MTTR</th><th className="text-center px-4 py-3">Disponib.</th>
          </tr></thead>
          <tbody>{equip.map((e,i)=>{const m=calc(e.id);return(
            <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
              <td className="px-4 py-2.5"><p className="text-gray-800 font-medium text-sm">{e.name}</p><p className="font-mono text-xs" style={{color:NV.blue}}>{e.code}</p></td>
              <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{e.criticality}</span></td>
              <td className="px-4 py-2.5 text-right text-gray-600 text-xs font-mono">{e.hours.toLocaleString()}h</td>
              <td className="px-4 py-2.5 text-right"><span className={`font-bold text-sm ${m.n>0?"text-red-600":"text-gray-400"}`}>{m.n}</span></td>
              <td className="px-4 py-2.5 text-right font-semibold text-sm" style={{color:NV.blue}}>{fH(m.mtbf)}</td>
              <td className="px-4 py-2.5 text-right text-amber-700 font-semibold text-sm">{fH(m.mttr)}</td>
              <td className="px-4 py-2.5 text-center">
                {m.disp!==null?(<div className="flex flex-col items-center gap-1">
                  <span className={`font-bold text-sm ${dC(m.disp)}`}>{fP(m.disp)}</span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.disp>=90?"bg-emerald-500":m.disp>=70?"bg-amber-400":"bg-red-500"}`} style={{width:`${Math.min(100,m.disp)}%`}}/>
                  </div>
                </div>):<span className="text-gray-400 text-xs">Sin datos</span>}
              </td>
            </tr>
          );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REQUESTS ────────────────────────────────────────────────────────────────
function Requests({user,data,setData}){
  const {requests,equip,users,wos}=data;
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({equipId:"",title:"",description:"",priority:"media",subsistema:"",componente:""});
  const canCreate=user.role==="operaciones"||user.role==="supervisor";
  const visible=(user.role==="supervisor"||user.role==="operaciones")?requests:requests.filter(r=>r.requestedBy===user.id);
  const createReq=()=>{if(!form.equipId||!form.title)return;const nr={id:uid(),...form,status:"pendiente",source:"solicitud",requestedBy:user.id,requestedAt:new Date().toISOString(),approvedBy:null,otId:null};const updated=[...requests,nr];setData(d=>({...d,requests:updated}));saveData("requests",updated);setShowForm(false);setForm({equipId:"",title:"",description:"",priority:"media",subsistema:"",componente:""});};
  const approve=req=>{const eq=equip.find(e=>e.id===req.equipId);const priority=req.priority==="alta"||eq?.criticality==="A"?"alta":req.priority;const mec=users.find(u=>u.role==="mecanico");const isInsp=req.source==="inspeccion";const newOT={id:uid(),code:nextOTCode(wos),type:"correctivo",equipId:req.equipId,planId:null,title:`${isInsp?"Inspección":"Reparación"} ${eq?.name||""} - ${req.title}`,priority,status:"asignada",assignedTo:mec?.id||"",createdAt:new Date().toISOString(),scheduledDate:new Date().toISOString().slice(0,10),estimatedHours:priority==="alta"?4:2,actualHours:null,description:req.description,observations:"",parts:[],source:req.source||"solicitud",reqId:req.id};const updW=[...wos,newOT];const updR=requests.map(r=>r.id===req.id?{...r,status:"aprobada",approvedBy:user.id,otId:newOT.id}:r);setData(d=>({...d,wos:updW,requests:updR}));saveData("workOrders",updW);saveData("requests",updR);alert(`✅ OT ${newOT.code} generada — Prioridad ${priority.toUpperCase()}`);};
  const reject=req=>{const updated=requests.map(r=>r.id===req.id?{...r,status:"rechazada",approvedBy:user.id}:r);setData(d=>({...d,requests:updated}));saveData("requests",updated);};
  const markRevised=req=>{const updated=requests.map(r=>r.id===req.id?{...r,status:"revisado",approvedBy:user.id}:r);setData(d=>({...d,requests:updated}));saveData("requests",updated);};
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Solicitudes de Reparación</h1><p className="text-gray-500 text-sm">{visible.length} solicitudes</p></div>
        {canCreate&&<button onClick={()=>setShowForm(true)} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nueva Solicitud</button>}
      </div>
      {visible.length===0&&<div className="text-center py-16 text-gray-400"><Bell size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin solicitudes</p></div>}
      <div className="space-y-4">
        {visible.map(r=>{
          const eq=equip.find(e=>e.id===r.equipId);const reqBy=users.find(u=>u.id===r.requestedBy);const linkedOT=wos.find(w=>w.id===r.otId);
          const SUBSIST={electrico:"Eléctrico",hidraulico:"Hidráulico",mecanico:"Mecánico",neumatico:"Neumático"};
          const DEV_TYPE={fuera_de_programa:"Fuera de Programa",anomalia:"Anomalía Detectada",desgaste:"Desgaste / Deterioro",otro:"Otro"};
          return(
            <div key={r.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${r.status==="pendiente"?r.source==="inspeccion"?"border-amber-300":"border-blue-300":r.status==="completada"?"border-emerald-300":"border-gray-200"}`}>
              {/* ── Header ── */}
              <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap ${r.status==="completada"?"bg-emerald-50/60 border-emerald-100":"bg-gray-50/60 border-gray-100"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge s={r.status}/>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[r.priority]}`}>{r.priority.toUpperCase()}</span>
                  {r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">Reporte Inspección</span>}
                  {r.type&&r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-medium text-gray-600 bg-white border-gray-200">{DEV_TYPE[r.type]||r.type}</span>}
                  {eq?.criticality&&<span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[eq.criticality]}`}>Equipo {CRIT_LABEL[eq.criticality]}</span>}
                </div>
                {user.role==="supervisor"&&r.status==="pendiente"&&(
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={()=>approve(r)} className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.blue}}><Check size={12}/>Aprobar + OT</button>
                    {r.source==="inspeccion"
                      ?<button onClick={()=>markRevised(r)} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"><Check size={12}/>Revisado</button>
                      :<button onClick={()=>reject(r)}  className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"><X size={12}/>Rechazar</button>
                    }
                  </div>
                )}
              </div>

              {/* ── Body ── */}
              <div className="p-5 space-y-3">
                {/* Equipo */}
                <div className="flex items-center gap-2">
                  <Package size={13} className="text-gray-400 flex-shrink-0"/>
                  <span className="text-gray-800 text-sm font-semibold">{eq?.name||"—"}</span>
                  {eq?.code&&<span className="font-mono text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{eq.code}</span>}
                  {eq?.location&&<span className="text-gray-400 text-xs">{eq.location}</span>}
                </div>

                {/* Título / Falla */}
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-0.5">Falla Detectada</p>
                  <p className="text-gray-900 font-bold text-sm">{r.title}</p>
                </div>

                {/* Subsistema + Componente */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Subsistema</p>
                    <p className={`text-sm font-semibold ${r.subsistema?"text-gray-800":"text-gray-400"}`}>{SUBSIST[r.subsistema]||"—"}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Componente en Falla</p>
                    <p className={`text-sm font-semibold ${r.componente?"text-gray-800":"text-gray-400"}`}>{r.componente||"—"}</p>
                  </div>
                </div>

                {/* Descripción */}
                {r.description&&(
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Descripción de la Falla</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{r.description}</p>
                  </div>
                )}

                {/* Meta: quién reportó y cuándo */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                  <Users size={11}/>
                  <span>Reportado por <span className="font-medium text-gray-600">{reqBy?.name||"—"}</span></span>
                  <span>·</span>
                  <span>{fmtDT(r.requestedAt)}</span>
                </div>

                {/* OT vinculada */}
                {linkedOT&&(
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold"><CheckCircle size={12}/>OT Generada: {linkedOT.code}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-400 uppercase tracking-wide text-xs">Estado</span><div className="mt-0.5"><Badge s={linkedOT.status}/></div></div>
                      <div><span className="text-gray-400 uppercase tracking-wide text-xs">Mecánico</span><p className="text-gray-700 font-medium mt-0.5">{users.find(u=>u.id===linkedOT.assignedTo)?.name||"—"}</p></div>
                      {linkedOT.scheduledDate&&<div><span className="text-gray-400 uppercase tracking-wide text-xs">Programado</span><p className="text-gray-700 font-medium mt-0.5">{fmt(linkedOT.scheduledDate)}</p></div>}
                      {linkedOT.actualHours&&<div><span className="text-gray-400 uppercase tracking-wide text-xs">Horas Reales</span><p className="text-emerald-700 font-bold mt-0.5">{linkedOT.actualHours}h</p></div>}
                    </div>
                    {linkedOT.observations&&(
                      <div className="border-t border-emerald-100 pt-2">
                        <p className="text-gray-400 uppercase tracking-wide text-xs mb-0.5">Observaciones del Mecánico</p>
                        <p className="text-gray-700 text-xs leading-relaxed">{linkedOT.observations}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showForm&&(
        <Modal title="Nueva Solicitud de Reparación" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label><select value={form.equipId} onChange={e=>setForm(f=>({...f,equipId:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{equip.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label>
              <select value={form.subsistema} onChange={e=>setForm(f=>({...f,subsistema:e.target.value}))} className={sCls}>
                <option value="">Seleccionar...</option>
                <option value="electrico">Eléctrico</option>
                <option value="hidraulico">Hidráulico</option>
                <option value="mecanico">Mecánico</option>
                <option value="neumatico">Neumático</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label><input value={form.componente} onChange={e=>setForm(f=>({...f,componente:e.target.value}))} className={iCls} placeholder="ej: Motor, Válvula, Sensor, Cilindro..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">FALLA DETECTADA *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={iCls} placeholder="Descripción breve de la falla"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN DE LA FALLA</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} className={iCls+" resize-none"} placeholder="Detalla síntomas, condiciones, frecuencia..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={sCls}><option value="alta">Alta — Detiene operaciones</option><option value="media">Media — Afecta rendimiento</option><option value="baja">Baja — Sin impacto inmediato</option></select></div>
          </div>
          <ModalActions onSave={createReq} onCancel={()=>setShowForm(false)} label="Enviar Solicitud"/>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports({data}){
  const {wos,equip}=data;
  const completed=wos.filter(w=>w.status==="completada");const prev=wos.filter(w=>w.type==="preventivo");const corr=wos.filter(w=>w.type==="correctivo");
  const totalHrs=completed.reduce((s,w)=>s+(w.actualHours||0),0);
  const byEquip=equip.map(e=>({...e,totalWOs:wos.filter(w=>w.equipId===e.id).length,completedWOs:completed.filter(w=>w.equipId===e.id).length,hrs:completed.filter(w=>w.equipId===e.id).reduce((s,w)=>s+(w.actualHours||0),0)})).sort((a,b)=>b.totalWOs-a.totalWOs);
  return(
    <div className="p-6 space-y-6">
      <div><h1 className="text-gray-900 font-bold text-xl">Informes y Análisis</h1></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle}   label="OT Completadas" value={completed.length}         color="emerald"/>
        <StatCard icon={Wrench}        label="Preventivas"    value={prev.length}               color="blue"/>
        <StatCard icon={AlertTriangle} label="Correctivas"    value={corr.length}               color="red"/>
        <StatCard icon={Clock}         label="Horas Totales"  value={`${totalHrs.toFixed(1)}h`} color="amber"/>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 text-xs text-white font-semibold uppercase tracking-wider" style={{background:NV.navyMid}}>OT por Equipo</div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
            <th className="text-left px-4 py-3">Equipo</th><th className="text-left px-4 py-3">Crit.</th>
            <th className="text-right px-4 py-3">Total OT</th><th className="text-right px-4 py-3">Completadas</th><th className="text-right px-4 py-3">Horas</th>
          </tr></thead>
          <tbody>{byEquip.filter(e=>e.totalWOs>0).map((e,i)=>(
            <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
              <td className="px-4 py-2.5"><p className="text-gray-800 font-medium text-sm">{e.name}</p><p className="font-mono text-xs" style={{color:NV.blue}}>{e.code}</p></td>
              <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{e.criticality}</span></td>
              <td className="px-4 py-2.5 text-right text-gray-700 font-medium">{e.totalWOs}</td>
              <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{e.completedWOs}</td>
              <td className="px-4 py-2.5 text-right text-gray-600">{e.hrs.toFixed(1)}h</td>
            </tr>
          ))}
          {byEquip.filter(e=>e.totalWOs>0).length===0&&<tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Sin OT registradas aún</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── USERS ───────────────────────────────────────────────────────────────────
function UsersPage({data,setData}){
  const {users}=data;const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"mecanico"});
  const addUser=()=>{if(!form.name||!form.email||!form.password)return;const nu={id:uid(),...form,avatar:form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()};const updated=[...users,nu];setData(d=>({...d,users:updated}));saveData("users",updated);setShowForm(false);setForm({name:"",email:"",password:"",role:"mecanico"});};
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Gestión de Usuarios</h1><p className="text-gray-500 text-sm">{users.length} usuarios</p></div>
        <button onClick={()=>setShowForm(true)} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nuevo Usuario</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map(u=>{const cfg=ROLE_CFG[u.role];const RoleIcon=cfg.icon;return(
          <div key={u.id} className={`${card} p-5 flex items-center gap-4 hover:shadow-md transition`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{background:NV.navyMid}}>{u.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold text-sm">{u.name}</p>
              <p className="text-gray-400 text-xs">{u.email}</p>
              <p className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${cfg.color.replace("text-","text-").replace("300","700")}`} style={{color:u.role==="supervisor"?NV.navy:u.role==="operaciones"?NV.blue:"#92400e"}}><RoleIcon size={11}/>{cfg.label}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{background:NV.blue}}>{ROLE_CFG[u.role].label}</span>
          </div>
        );})}
      </div>
      {showForm&&(
        <Modal title="Nuevo Usuario" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            {[["name","NOMBRE COMPLETO","text"],["email","CORREO NAVIMAG","email"],["password","CONTRASEÑA","text"]].map(([k,l,t])=>(
              <div key={k}><label className="text-gray-500 text-xs font-medium mb-1 block">{l}</label><input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className={iCls}/></div>
            ))}
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ROL</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className={sCls}>
                <option value="supervisor">Supervisor — Acceso completo</option>
                <option value="mecanico">Mecánico — Reportar trabajos</option>
                <option value="operaciones">Operaciones — Solicitudes y notificaciones</option>
              </select></div>
          </div>
          <ModalActions onSave={addUser} onCancel={()=>setShowForm(false)} label="Crear Usuario"/>
        </Modal>
      )}
    </div>
  );
}

// ─── DEVIATION REPORTS ───────────────────────────────────────────────────────
function DeviationReports({user,data,setData}){
  const {requests:allReqs,equip,users,wos}=data;
  const deviations=allReqs.filter(r=>r.source==="inspeccion");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({equipId:"",title:"",type:"fuera_de_programa",subsistema:"",componente:"",description:"",priority:"media"});
  const role=user.role;
  const visible=role==="supervisor"?deviations:deviations.filter(d=>d.requestedBy===user.id);

  const createDev=()=>{
    if(!form.equipId||!form.title)return;
    const nd={id:uid(),...form,status:"pendiente",source:"inspeccion",requestedBy:user.id,requestedAt:new Date().toISOString(),approvedBy:null,otId:null};
    const updated=[...allReqs,nd];
    setData(d=>({...d,requests:updated}));saveData("requests",updated);
    setShowForm(false);setForm({equipId:"",title:"",type:"fuera_de_programa",subsistema:"",componente:"",description:"",priority:"media"});
  };

  const DEV_TYPE_LABEL={fuera_de_programa:"Fuera de Programa",anomalia:"Anomalía",desgaste:"Desgaste",otro:"Otro"};

  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Mis Reportes de Inspección</h1>
          <p className="text-gray-500 text-sm">{visible.length} reportes · {visible.filter(d=>d.status==="pendiente").length} pendientes</p>
        </div>
        {role==="mecanico"&&<button onClick={()=>setShowForm(true)} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nuevo Reporte</button>}
      </div>
      {visible.length===0&&<div className="text-center py-16 text-gray-400"><FileWarning size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin reportes de inspección</p></div>}
      <div className="space-y-3">
        {visible.map(d=>{
          const eq=equip.find(e=>e.id===d.equipId);const repBy=users.find(u=>u.id===d.requestedBy);const linkedOT=wos.find(w=>w.id===d.otId);
          return(
            <div key={d.id} className={`bg-white border rounded-xl p-5 shadow-sm ${d.status==="pendiente"?"border-amber-300":"border-gray-200"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge s={d.status}/>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[d.priority]}`}>{d.priority.toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded-full border text-xs font-medium text-gray-600 bg-gray-50 border-gray-200">{DEV_TYPE_LABEL[d.type]||d.type}</span>
                </div>
                <p className="text-gray-800 font-semibold text-sm mb-1">{d.title}</p>
                {(d.subsistema||d.componente)&&<div className="flex items-center gap-3 mb-1 text-xs"><span className="text-gray-400">Subsistema:</span><span className="font-medium text-gray-700">{({electrico:"Eléctrico",hidraulico:"Hidráulico",mecanico:"Mecánico",neumatico:"Neumático"})[d.subsistema]||d.subsistema||"—"}</span>{d.componente&&<><span className="text-gray-300">|</span><span className="text-gray-400">Componente:</span><span className="font-medium text-gray-700">{d.componente}</span></>}</div>}
                <p className="text-gray-500 text-xs mb-2">{d.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  <span>{eq?.name||"—"}</span><span>·</span><span>{repBy?.name||"—"}</span><span>·</span><span>{fmtDT(d.requestedAt)}</span>
                </div>
                {linkedOT&&(
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1"><CheckCircle size={11}/>OT Generada: {linkedOT.code}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span><span className="text-gray-400">Estado: </span><Badge s={linkedOT.status}/></span>
                      {users.find(u=>u.id===linkedOT.assignedTo)&&<span><span className="text-gray-400">Mecánico: </span>{users.find(u=>u.id===linkedOT.assignedTo)?.name}</span>}
                      {linkedOT.actualHours&&<span><span className="text-gray-400">Horas reales: </span><span className="font-semibold text-emerald-700">{linkedOT.actualHours}h</span></span>}
                    </div>
                    {linkedOT.observations&&<p className="text-xs text-gray-600 pt-1 border-t border-emerald-100 mt-1"><span className="text-gray-400 font-medium">Observaciones: </span>{linkedOT.observations}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showForm&&(
        <Modal title="Nuevo Reporte de Inspección" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label>
              <select value={form.equipId} onChange={e=>setForm(f=>({...f,equipId:e.target.value}))} className={sCls}>
                <option value="">Seleccionar...</option>{equip.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TIPO DE DESVIACIÓN</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={sCls}>
                <option value="fuera_de_programa">Fuera de Programa</option>
                <option value="anomalia">Anomalía Detectada</option>
                <option value="desgaste">Desgaste / Deterioro</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label>
              <select value={form.subsistema} onChange={e=>setForm(f=>({...f,subsistema:e.target.value}))} className={sCls}>
                <option value="">Seleccionar...</option>
                <option value="electrico">Eléctrico</option>
                <option value="hidraulico">Hidráulico</option>
                <option value="mecanico">Mecánico</option>
                <option value="neumatico">Neumático</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label>
              <input value={form.componente} onChange={e=>setForm(f=>({...f,componente:e.target.value}))} className={iCls} placeholder="ej: Motor, Válvula, Sensor, Cilindro..."/>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÍTULO / HALLAZGO *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={iCls} placeholder="Descripción breve del hallazgo"/>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN DE LA FALLA</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} className={iCls+" resize-none"} placeholder="Describe la desviación encontrada..."/>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={sCls}>
                <option value="alta">Alta — Requiere atención inmediata</option>
                <option value="media">Media — Afecta rendimiento</option>
                <option value="baja">Baja — Sin impacto inmediato</option>
              </select>
            </div>
          </div>
          <ModalActions onSave={createDev} onCancel={()=>setShowForm(false)} label="Enviar Reporte"/>
        </Modal>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
function Notifications({user,data}){
  const {wos,equip,requests}=data;
  const items=[
    ...equip.filter(e=>e.status==="falla").map(e=>({icon:AlertTriangle,cls:"text-red-600",bg:"bg-red-50 border-red-200",title:`Equipo en falla: ${e.name}`,sub:`${e.location} · Criticidad ${e.criticality}`,time:"Activo"})),
    ...requests.filter(r=>r.requestedBy===user.id).map(r=>{const eq=equip.find(e=>e.id===r.equipId);const linkedOT=wos.find(w=>w.id===r.otId);return {icon:r.status==="aprobada"?CheckCircle:r.status==="rechazada"?X:Clock,cls:r.status==="aprobada"?"text-emerald-600":r.status==="rechazada"?"text-red-600":"text-amber-600",bg:"bg-white border-gray-200",title:`Solicitud: ${r.title}`,sub:`${eq?.name||"—"} · ${ST[r.status]?.label}${linkedOT?` · ${linkedOT.code}`:""}`,time:fmtDT(r.requestedAt)};})
  ];
  return(
    <div className="p-6">
      <div className="mb-5"><h1 className="text-gray-900 font-bold text-xl">Notificaciones</h1></div>
      {items.length===0&&<div className="text-center py-16 text-gray-400"><Bell size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin notificaciones</p></div>}
      <div className="space-y-3">
        {items.map((n,i)=>(
          <div key={i} className={`border rounded-xl p-4 flex items-start gap-3 shadow-sm ${n.bg}`}>
            <n.icon size={16} className={`${n.cls} flex-shrink-0 mt-0.5`}/>
            <div className="flex-1"><p className={`font-semibold text-sm ${n.cls}`}>{n.title}</p><p className="text-gray-500 text-xs mt-0.5">{n.sub}</p></div>
            <span className="text-gray-400 text-xs">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);const [page,setPage]=useState("dashboard");
  const [online,setOnline]=useState(true);const [loading,setLoading]=useState(true);const [showChangePwd,setShowChangePwd]=useState(false);
  const [data,setData]=useState({users:SEED_USERS,equip:SEED_EQUIPMENT,plans:SEED_PM_PLANS,requests:SEED_REQUESTS,wos:SEED_WORK_ORDERS});
  const unsubs=useRef([]);

  useEffect(()=>{
    const keys=["users","equipment","plans","requests","workOrders"];
    const seeds={users:SEED_USERS,equipment:SEED_EQUIPMENT,plans:SEED_PM_PLANS,requests:SEED_REQUESTS,workOrders:SEED_WORK_ORDERS};
    const dk={users:"users",equipment:"equip",plans:"plans",requests:"requests",workOrders:"wos"};
    (async()=>{
      for(const k of keys) await initIfEmpty(k,seeds[k]);
      unsubs.current=keys.map(k=>onSnapshot(doc(db,COLL,k),
        snap=>{setOnline(true);if(snap.exists())setData(d=>({...d,[dk[k]]:snap.data().data}));},
        ()=>setOnline(false)
      ));
      setLoading(false);
    })();
    return()=>unsubs.current.forEach(u=>u());
  },[]);

  if(loading) return(
    <div className="min-h-screen flex items-center justify-center" style={{background:`linear-gradient(160deg,${NV.navy},${NV.blue})`}}>
      <div className="text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30"><Wrench size={32} className="text-white animate-pulse"/></div>
        <p className="text-white font-bold text-lg">MANTEK ERP</p>
        <p className="text-blue-200 text-sm mt-1">Conectando con la base de datos...</p>
      </div>
    </div>
  );

  const pendingReqs=data.requests.filter(r=>r.status==="pendiente").length;
  const devBadge=user?.role==="supervisor"?data.requests.filter(r=>r.source==="inspeccion"&&r.status==="pendiente").length:0;

  const handleChangePwd=(oldPwd,newPwd)=>{
    if(user.password!==oldPwd)return "La contraseña actual es incorrecta";
    const updated=data.users.map(u=>u.id===user.id?{...u,password:newPwd}:u);
    setData(d=>({...d,users:updated}));saveData("users",updated);
    setUser(u=>({...u,password:newPwd}));setShowChangePwd(false);return null;
  };

  if(!user) return <LoginPage users={data.users} onLogin={u=>{setUser(u);setPage("dashboard");}}/>;

  const PAGES={
    dashboard:     <Dashboard     user={user} data={data} onNav={setPage}/>,
    workorders:    <WorkOrders    user={user} data={data} setData={setData}/>,
    equipment:     <Equipment     user={user} data={data} setData={setData}/>,
    plans:         <Plans         user={user} data={data} setData={setData}/>,
    indicadores:   <Indicadores   data={data}/>,
    requests:      <Requests      user={user} data={data} setData={setData}/>,
    notifications: <Notifications user={user} data={data}/>,
    reports:       <Reports       data={data}/>,
    deviaciones:   <DeviationReports user={user} data={data} setData={setData}/>,
    users:         <UsersPage     data={data} setData={setData}/>,
  };

  return(
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} active={page} onNav={setPage} onLogout={()=>{setUser(null);setPage("dashboard");}} onChangePassword={()=>setShowChangePwd(true)} notifications={pendingReqs} devBadge={devBadge} online={online}/>
      <main className="flex-1 min-h-screen overflow-y-auto">{PAGES[page]||PAGES.dashboard}</main>
      {showChangePwd&&<ChangePasswordModal user={user} onSave={handleChangePwd} onClose={()=>setShowChangePwd(false)}/>}
    </div>
  );
}
