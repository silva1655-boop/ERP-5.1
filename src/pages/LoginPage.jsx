import { useState } from "react";
import { Wrench } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { NV, iCls } from "../utils/constants";
import { Modal, ModalActions } from "../components/common/Modal";

function ChangePasswordModal({ user, onSave, onClose }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (!oldPwd || !newPwd || !conf) { setErr("Completa todos los campos"); return; }
    if (newPwd !== conf) { setErr("Las contraseñas nuevas no coinciden"); return; }
    if (newPwd.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres"); return; }
    const e = onSave(oldPwd, newPwd); if (e) setErr(e);
  };
  return (
    <Modal title="Cambiar Contraseña" onClose={onClose}>
      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">{err}</div>}
      <div className="space-y-3">
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">CONTRASEÑA ACTUAL</label><input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className={iCls}/></div>
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">NUEVA CONTRASEÑA</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className={iCls}/></div>
        <div><label className="text-gray-500 text-xs font-medium mb-1 block">CONFIRMAR NUEVA CONTRASEÑA</label><input type="password" value={conf} onChange={e => setConf(e.target.value)} className={iCls}/></div>
      </div>
      <ModalActions onSave={handle} onCancel={onClose} label="Cambiar Contraseña"/>
    </Modal>
  );
}

export { ChangePasswordModal };

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !pass) { setErr("Completa todos los campos"); return; }
    setLoading(true);
    setErr("");
    const result = await login(email, pass);
    if (!result.success) {
      setErr(result.error || "Credenciales incorrectas");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${NV.navy} 0%, ${NV.navyMid} 40%, ${NV.blue} 70%, ${NV.cyan} 100%)` }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-20" preserveAspectRatio="none">
          <path fill="white" d="M0,192L60,202.7C120,213,240,235,360,224C480,213,600,171,720,165.3C840,160,960,192,1080,197.3C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"/>
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-10" preserveAspectRatio="none">
          <path fill="white" d="M0,256L80,240C160,224,320,192,480,192C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"/>
        </svg>
      </div>

      <div className="w-full max-w-sm relative z-10">
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
          <p className="font-bold mb-6 text-sm" style={{ color: NV.navy }}>Iniciar Sesión</p>
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4">{err}</div>}
          <div className="space-y-4">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">CORREO</label>
              <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} className={iCls} placeholder="usuario@navimag.cl"/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">CONTRASEÑA</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} className={iCls + " pr-16"} placeholder="••••••"/>
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">{show ? "Ocultar" : "Mostrar"}</button>
              </div>
            </div>
            <button onClick={handle} disabled={loading}
              style={{ background: `linear-gradient(90deg, ${NV.navy}, ${NV.blue})` }}
              className="w-full text-white font-bold py-3 rounded-xl text-sm transition shadow-md hover:opacity-90 mt-2 disabled:opacity-60">
              {loading ? "VERIFICANDO..." : "INGRESAR"}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: NV.blue }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M3 12h18M3 6h18M3 18h18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <p className="text-gray-400 text-xs">Navimag · Departamento de Mantenimiento</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
