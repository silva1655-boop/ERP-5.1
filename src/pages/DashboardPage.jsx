import { AlertTriangle, CheckCircle, Bell, ClipboardList, AlertCircle, ChevronRight } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";
import { ROLE_CFG, CHECKLIST_TEMPLATES, NV, card } from "../utils/constants";
import { fmt } from "../utils/helpers";

export function DashboardPage({ user, data, onNav }) {
  const { wos, equip, requests, checklists } = data;
  const role = user.role;
  const allCL = checklists || [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthCL = allCL.filter(c => c.createdAt?.startsWith(thisMonth));
  const clByEquip = equip.map(e => ({
    eq: e,
    count: monthCL.filter(c => c.equipId === e.id).length,
    issues: monthCL.filter(c => c.equipId === e.id && c.hasIssues).length
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
  const pendingWOs = wos.filter(w => w.status !== "completada" && w.status !== "cancelada");
  const myWOs = wos.filter(w => w.assignedTo === user.id && w.status !== "completada");
  const fallas = equip.filter(e => e.status === "falla");
  const completed = wos.filter(w => w.status === "completada").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-gray-900 font-bold text-xl">Dashboard</h1>
        <p className="text-gray-500 text-sm">Bienvenido, {user.name} · {ROLE_CFG[role]?.label}</p>
      </div>

      {role === "supervisor" && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="OT Activas" value={pendingWOs.length} sub={`${pendingWOs.filter(w => w.priority === "alta").length} críticas`} color="navy"/>
          <StatCard icon={AlertTriangle} label="Equipos en Falla" value={fallas.length} color="red"/>
          <StatCard icon={Bell} label="Solicitudes Pendientes" value={requests.filter(r => r.status === "pendiente").length} color="cyan"/>
          <StatCard icon={CheckCircle} label="OT Completadas" value={completed} sub="este mes" color="emerald"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: NV.navy }}>OT Recientes</h2>
              <button onClick={() => onNav("workorders")} className="text-xs hover:underline flex items-center gap-1" style={{ color: NV.blue }}>Ver todo<ChevronRight size={12}/></button>
            </div>
            {wos.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Sin órdenes de trabajo</p>}
            {wos.slice(0, 5).map(w => (
              <div key={w.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                <Badge s={w.status}/><span className="text-gray-700 text-xs flex-1 truncate">{w.title}</span>
              </div>
            ))}
          </div>
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: NV.navy }}>Estado de Equipos</h2>
              <button onClick={() => onNav("equipment")} className="text-xs hover:underline flex items-center gap-1" style={{ color: NV.blue }}>Ver todo<ChevronRight size={12}/></button>
            </div>
            <div className="flex items-center gap-4 mb-3">
              {[["operativo","bg-emerald-500","Operativos"],["mantenimiento","bg-amber-400","En Mant."],["falla","bg-red-500","En Falla"]].map(([s, c, l]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${c}`}/>
                  <span className="text-gray-600 text-xs">{equip.filter(e => e.status === s).length} {l}</span>
                </div>
              ))}
            </div>
            {fallas.length > 0 && fallas.map(e => (
              <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-red-100 last:border-0">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>
                <span className="text-gray-700 text-xs flex-1">{e.name}</span>
                <span className="text-gray-400 text-xs">{e.code}</span>
              </div>
            ))}
            {fallas.length === 0 && <p className="text-emerald-600 text-xs text-center py-2">Todos los equipos operativos</p>}
          </div>
        </div>
      </>}

      {role === "mecanico" && <>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={ClipboardList} label="Mis OT Pendientes" value={myWOs.length} color="navy"/>
          <StatCard icon={CheckCircle} label="Completadas" value={wos.filter(w => w.assignedTo === user.id && w.status === "completada").length} color="emerald"/>
        </div>
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: NV.navy }}>Mis Órdenes de Trabajo</h2>
          {myWOs.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No tienes órdenes asignadas</p>}
          {myWOs.map(w => { const eq = data.equip.find(e => e.id === w.equipId); return (
            <div key={w.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-2 last:mb-0">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-mono font-bold mb-1" style={{ color: NV.blue }}>{w.code}</p>
                  <p className="text-gray-800 text-sm font-semibold">{w.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{eq?.name} · {fmt(w.scheduledDate)}</p></div>
                <Badge s={w.status}/>
              </div>
            </div>
          );})}
        </div>
      </>}

      {role === "operaciones" && <>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={AlertTriangle} label="Equipos en Falla" value={fallas.length} color="red"/>
          <StatCard icon={Bell} label="Mis Solicitudes" value={requests.filter(r => r.requestedBy === user.id).length} color="cyan"/>
        </div>
        {fallas.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="text-red-700 font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle size={15}/>Equipos con Falla Activa</h2>
            {fallas.map(e => (
              <div key={e.id} className="bg-white rounded-lg p-3 mb-2 last:mb-0 border border-red-100">
                <p className="text-gray-800 text-sm font-semibold">{e.name}</p>
                <p className="text-gray-500 text-xs">{e.location} · Criticidad {e.criticality}</p>
              </div>
            ))}
          </div>
        )}
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: NV.navy }}>Mis Solicitudes Recientes</h2>
          {requests.filter(r => r.requestedBy === user.id).slice(0, 5).map(r => {
            const eq = equip.find(e => e.id === r.equipId);
            return <div key={r.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
              <Badge s={r.status}/><span className="text-gray-700 text-xs flex-1 truncate">{r.title}</span><span className="text-gray-400 text-xs">{eq?.code}</span>
            </div>;
          })}
          {requests.filter(r => r.requestedBy === user.id).length === 0 && <p className="text-gray-400 text-sm text-center py-6">Sin solicitudes registradas</p>}
        </div>
      </>}

      {role === "operador" && <>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={CheckCircle} label="Mis Checklists" value={allCL.filter(c => c.operatorId === user.id && c.createdAt?.startsWith(thisMonth)).length} sub="este mes" color="emerald"/>
          <StatCard icon={AlertTriangle} label="Obs. Reportadas" value={allCL.filter(c => c.operatorId === user.id && c.hasIssues && c.createdAt?.startsWith(thisMonth)).length} sub="este mes" color="amber"/>
        </div>
        <div className={`${card} p-5`}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: NV.navy }}>Mis Checklists Recientes</h2>
          {allCL.filter(c => c.operatorId === user.id).slice(-5).reverse().map(c => {
            const eq = equip.find(e => e.id === c.equipId);
            return <div key={c.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.hasIssues ? "bg-amber-400" : "bg-emerald-500"}`}/>
              <span className="text-gray-700 text-xs flex-1">{eq?.code} — {CHECKLIST_TEMPLATES[c.type]?.label || c.type}</span>
              <span className="text-gray-400 text-xs">{c.hasIssues ? `${c.issueCount} obs.` : "OK"}</span>
            </div>;
          })}
          {allCL.filter(c => c.operatorId === user.id).length === 0 && <p className="text-gray-400 text-sm text-center py-6">No has completado ningún checklist</p>}
        </div>
      </>}

      {monthCL.length > 0 && (
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: NV.navy }}><CheckCircle size={15}/>Checklists del Mes</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-gray-500">{monthCL.length} total</span>
              <span className="text-emerald-600 font-medium">{monthCL.filter(c => !c.hasIssues).length} sin obs.</span>
              <span className="text-amber-600 font-medium">{monthCL.filter(c => c.hasIssues).length} con obs.</span>
            </div>
          </div>
          {clByEquip.length === 0 ? <p className="text-gray-400 text-xs text-center py-2">Sin datos este mes</p> : (
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-1.5 font-medium">Equipo</th>
                <th className="text-right py-1.5 font-medium">Checklists</th>
                <th className="text-right py-1.5 font-medium">Con Obs.</th>
                <th className="text-right py-1.5 font-medium">Estado</th>
              </tr></thead>
              <tbody>{clByEquip.slice(0, 8).map(({ eq, count, issues }) => (
                <tr key={eq.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5"><span className="font-mono font-semibold" style={{ color: NV.blue }}>{eq.code}</span> <span className="text-gray-500">{eq.name}</span></td>
                  <td className="py-1.5 text-right text-gray-700 font-semibold">{count}</td>
                  <td className="py-1.5 text-right"><span className={issues > 0 ? "text-amber-600 font-semibold" : "text-gray-400"}>{issues}</span></td>
                  <td className="py-1.5 text-right">
                    <div className="flex justify-end gap-0.5">{Array.from({ length: count }, (_, i) => <span key={i} className={`inline-block w-2 h-2 rounded-sm ${i < issues ? "bg-amber-400" : "bg-emerald-400"}`}/>)}</div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
