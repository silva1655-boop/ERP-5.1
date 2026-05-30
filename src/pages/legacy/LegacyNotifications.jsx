import { AlertTriangle, CheckCircle, Clock, Bell, X } from 'lucide-react';
import { ST } from '../../utils/constants';

const fmtDT=d=>d?new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";

export default function LegacyNotifications({user,data}){
  const {wos,equip,requests}=data;
  const items=[
    ...equip.filter(e=>e.status==="falla").map(e=>({icon:AlertTriangle,cls:"text-red-600",bg:"bg-red-50 border-red-200",title:`Equipo en falla: ${e.name}`,sub:`${e.location} · Criticidad ${e.criticality}`,time:"Activo"})),
    ...requests.filter(r=>r.requestedBy===user.id).map(r=>{const eq=equip.find(e=>e.id===r.equipId);const linkedOT=wos.find(w=>w.id===r.otId);return{icon:r.status==="aprobada"?CheckCircle:r.status==="rechazada"?X:Clock,cls:r.status==="aprobada"?"text-emerald-600":r.status==="rechazada"?"text-red-600":"text-amber-600",bg:"bg-white border-gray-200",title:`Solicitud: ${r.title}`,sub:`${eq?.name||"—"} · ${ST[r.status]?.label}${linkedOT?` · ${linkedOT.code}`:""}`,time:fmtDT(r.requestedAt)};})
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
