import { useState } from 'react';
import { Plus, X, CheckCircle, FileWarning } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NV, ST, PRI_CLS, card, btnPrimary, iCls, sCls, COLL } from '../../utils/constants';

const uid=()=>Math.random().toString(36).slice(2,10);
const fmtDT=d=>d?new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const saveData=async(key,arr)=>{try{await setDoc(doc(db,COLL,key),{data:arr});}catch(e){console.error("Save:",e);}};
const Badge=({s,label})=>{const c=ST[s]||{label:s,cls:"text-gray-600 bg-gray-100 border-gray-300"};return<span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${c.cls}`}>{label||c.label}</span>;};

function Modal({title,onClose,children}){
  return(<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-5"><h3 className="text-gray-900 font-bold text-base">{title}</h3><button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button></div>{children}</div></div>);
}
function ModalActions({onSave,onCancel,label="Guardar"}){
  return(<div className="flex gap-2 mt-5"><button onClick={onSave} style={{background:NV.blue}} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button><button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button></div>);
}

export default function LegacyDeviations({user,data,setData}){
  const {requests:allReqs,equip,users,wos}=data;
  const deviations=allReqs.filter(r=>r.source==="inspeccion");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({equipId:"",title:"",type:"fuera_de_programa",subsistema:"",componente:"",description:"",priority:"media"});
  const role=user.role;
  const visible=role==="supervisor"?deviations:deviations.filter(d=>d.requestedBy===user.id);
  const DEV_TYPE_LABEL={fuera_de_programa:"Fuera de Programa",anomalia:"Anomalía",desgaste:"Desgaste",otro:"Otro"};
  const createDev=()=>{
    if(!form.equipId||!form.title)return;
    const nd={id:uid(),...form,status:"pendiente",source:"inspeccion",requestedBy:user.id,requestedAt:new Date().toISOString(),approvedBy:null,otId:null};
    const updated=[...allReqs,nd];
    setData(d=>({...d,requests:updated}));saveData("requests",updated);
    setShowForm(false);setForm({equipId:"",title:"",type:"fuera_de_programa",subsistema:"",componente:"",description:"",priority:"media"});
  };
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Mis Reportes de Inspección</h1><p className="text-gray-500 text-sm">{visible.length} reportes · {visible.filter(d=>d.status==="pendiente").length} pendientes</p></div>
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
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap"><span>{eq?.name||"—"}</span><span>·</span><span>{repBy?.name||"—"}</span><span>·</span><span>{fmtDT(d.requestedAt)}</span></div>
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
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label><select value={form.equipId} onChange={e=>setForm(f=>({...f,equipId:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{equip.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TIPO DE DESVIACIÓN</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={sCls}><option value="fuera_de_programa">Fuera de Programa</option><option value="anomalia">Anomalía Detectada</option><option value="desgaste">Desgaste / Deterioro</option><option value="otro">Otro</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label><select value={form.subsistema} onChange={e=>setForm(f=>({...f,subsistema:e.target.value}))} className={sCls}><option value="">Seleccionar...</option><option value="electrico">Eléctrico</option><option value="hidraulico">Hidráulico</option><option value="mecanico">Mecánico</option><option value="neumatico">Neumático</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label><input value={form.componente} onChange={e=>setForm(f=>({...f,componente:e.target.value}))} className={iCls} placeholder="ej: Motor, Válvula, Sensor..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÍTULO / HALLAZGO *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={iCls} placeholder="Descripción breve del hallazgo"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN DE LA FALLA</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} className={iCls+" resize-none"} placeholder="Describe la desviación encontrada..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={sCls}><option value="alta">Alta — Requiere atención inmediata</option><option value="media">Media — Afecta rendimiento</option><option value="baja">Baja — Sin impacto inmediato</option></select></div>
          </div>
          <ModalActions onSave={createDev} onCancel={()=>setShowForm(false)} label="Enviar Reporte"/>
        </Modal>
      )}
    </div>
  );
}
