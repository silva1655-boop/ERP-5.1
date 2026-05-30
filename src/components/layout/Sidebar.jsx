import { Wrench, Wifi, WifiOff, LogOut, Key } from "lucide-react";
import { NAV_ITEMS, ROLE_CFG, NV } from "../../utils/constants";

export function Sidebar({ user, active, onNav, onLogout, onChangePassword, notifications, devBadge, online }) {
  const cfg = ROLE_CFG[user.role] || ROLE_CFG.operador;
  const RoleIcon = cfg.icon;
  return (
    <div className="w-56 flex flex-col h-screen sticky top-0 flex-shrink-0 shadow-xl" style={{ background: NV.navy }}>
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
                ? <><Wifi size={9} className="text-emerald-400"/><p className="text-emerald-400 text-xs">En línea</p></>
                : <><WifiOff size={9} className="text-red-400"/><p className="text-red-400 text-xs">Sin conexión</p></>}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {cfg.nav.map(key => {
          const item = NAV_ITEMS[key]; if (!item) return null;
          const Icon = item.icon;
          const isActive = active === key;
          const badge = ((key === "requests" || key === "notifications") && notifications > 0) || (key === "deviaciones" && devBadge > 0);
          return (
            <button key={key} onClick={() => onNav(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? "text-white font-semibold" : "text-blue-200 hover:text-white hover:bg-white/10"}`}
              style={isActive ? { background: `${NV.blue}cc` } : {}}>
              <Icon size={15}/><span className="flex-1 text-left">{item.label}</span>
              {badge && <span className="bg-amber-400 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">{key === "deviaciones" ? devBadge : notifications}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{user.avatar}</div>
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

export default Sidebar;
