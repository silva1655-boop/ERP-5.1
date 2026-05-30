import { useState } from "react";
import { Plus, Filter, X, Eye, Check, ClipboardList, Package, Users, FileDown, Bell, Printer } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { PhotoPicker } from "../components/common/PhotoPicker";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, PRI_CLS, iCls, sCls, card, btnPrimary, btnSecondary } from "../utils/constants";
import { uid, nextOTCode, fmtDT, downloadCSV } from "../utils/helpers";
import { printOT, fmt } from "../utils/helpers";
import toast from "react-hot-toast";

const SUBSIST_MAP = { electrico:"Eléctrico", hidraulico:"Hidráulico", mecanico:"Mecánico", neumatico:"Neumático" };
const DEV_TYPE_MAP = { fuera_de_programa:"Fuera de Programa", anomalia:"Anomalía Detectada", desgaste:"Desgaste / Deterioro", otro:"Otro" };

export function RequestsPage({ user, data, setData, saveData }) {
  const { requests, equip, users, wos } = data;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipId:"", title:"", description:"", priority:"media", subsistema:"", componente:"", photos:[] });
  const [showCLProc, setShowCLProc] = useState(false);
  const [clProc, setClProc] = useState({ req:null, priority:"media", subsistema:"", componente:"", description:"" });
  const [selReq, setSelReq] = useState(null);
  const [flt, setFlt] = useState({ userId:"", status:"", priority:"" });
  const canCreate = user.role === "operaciones" || user.role === "supervisor";
  const visible = (user.role === "supervisor" || user.role === "operaciones") ? requests : requests.filter(r => r.requestedBy === user.id);
  const filtered = visible.filter(r => {
    if (flt.userId && r.requestedBy !== flt.userId) return false;
    if (flt.status && r.status !== flt.status) return false;
    if (flt.priority && r.priority !== flt.priority) return false;
    return true;
  });
  const uniqueRequesters = [...new Map(visible.map(r => r.requestedBy).filter(Boolean).map(id => [id, users.find(u => u.id === id)])).values()].filter(Boolean);

  const createReq = () => {
    if (!form.equipId || !form.title) { toast.error("Completa equipo y título"); return; }
    const nr = { id:uid(), ...form, status:"pendiente", source:"solicitud", requestedBy:user.id, requestedAt:new Date().toISOString(), approvedBy:null, otId:null };
    const updated = [...requests, nr]; setData(d => ({ ...d, requests:updated })); saveData("requests", updated);
    setShowForm(false); setForm({ equipId:"", title:"", description:"", priority:"media", subsistema:"", componente:"", photos:[] });
    toast.success("Solicitud enviada");
  };

  const approve = req => {
    const eqItem = equip.find(e => e.id === req.equipId);
    const priority = req.priority === "alta" || eqItem?.criticality === "A" ? "alta" : req.priority;
    const mec = users.find(u => u.role === "mecanico");
    const isInsp = req.source === "inspeccion";
    const newOT = { id:uid(), code:nextOTCode(wos), type:"correctivo", equipId:req.equipId, planId:null, title:`${isInsp?"Inspección":"Reparación"} ${eqItem?.name||""} - ${req.title}`, priority, status:"asignada", assignedTo:mec?.id||"", createdAt:new Date().toISOString(), scheduledDate:new Date().toISOString().slice(0,10), estimatedHours:priority==="alta"?4:2, actualHours:null, description:req.description, observations:"", parts:[], source:req.source||"solicitud", reqId:req.id };
    const updW = [...wos, newOT];
    const updR = requests.map(r => r.id === req.id ? { ...r, status:"aprobada", approvedBy:user.id, otId:newOT.id } : r);
    setData(d => ({ ...d, wos:updW, requests:updR })); saveData("workOrders", updW); saveData("requests", updR);
    toast.success(`OT ${newOT.code} generada — Prioridad ${priority.toUpperCase()}`);
  };

  const reject = req => {
    const updated = requests.map(r => r.id === req.id ? { ...r, status:"rechazada", approvedBy:user.id } : r);
    setData(d => ({ ...d, requests:updated })); saveData("requests", updated);
    toast.success("Solicitud rechazada");
  };

  const markRevised = req => {
    const updated = requests.map(r => r.id === req.id ? { ...r, status:"revisado", approvedBy:user.id } : r);
    setData(d => ({ ...d, requests:updated })); saveData("requests", updated);
    toast.success("Marcada como revisada");
  };

  const openCLProc = r => { setClProc({ req:r, priority:r.priority||"media", subsistema:r.subsistema||"", componente:r.componente||r.items?.[0]?.name||"", description:r.description||"" }); setShowCLProc(true); };

  const submitCLProc = () => {
    const { req, priority, subsistema, componente, description } = clProc;
    if (!componente) { toast.error("Ingresa el componente"); return; }
    const newSol = { id:uid(), title:req.title, equipId:req.equipId, subsistema, componente, description, priority, status:"pendiente", source:"solicitud", requestedBy:user.id, requestedAt:new Date().toISOString(), approvedBy:null, otId:null, fromChecklistId:req.id };
    const updR = requests.map(r => r.id === req.id ? { ...r, status:"aprobada", approvedBy:user.id } : r);
    const finalR = [...updR, newSol];
    setData(d => ({ ...d, requests:finalR })); saveData("requests", finalR);
    setShowCLProc(false);
    toast.success("Solicitud enviada al Supervisor");
  };

  const exportReqs = () => {
    const rows = filtered.map(r => {
      const eq = equip.find(e => e.id === r.equipId); const reqBy = users.find(u => u.id === r.requestedBy); const linkedOT = wos.find(w => w.id === r.otId);
      return { "ID":r.id.slice(-6), "Equipo":eq?.code||"—", "Título":r.title, "Subsistema":SUBSIST_MAP[r.subsistema]||"—", "Componente":r.componente||"—", "Prioridad":r.priority, "Estado":r.status, "Fuente":r.source, "Solicitante":reqBy?.name||"—", "Fecha":fmtDT(r.requestedAt), "OT Vinculada":linkedOT?.code||"—" };
    });
    downloadCSV(`solicitudes_${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Solicitudes de Reparación</h1><p className="text-gray-500 text-sm">{filtered.length} de {visible.length} solicitudes</p></div>
        <div className="flex gap-2">
          {filtered.length > 0 && <button onClick={exportReqs} className={btnSecondary} style={{ borderColor:NV.blue, color:NV.blue, background:"white" }}><FileDown size={14}/>Exportar</button>}
          {canCreate && <button onClick={() => setShowForm(true)} style={{ background:NV.blue }} className={btnPrimary}><Plus size={15}/>Nueva Solicitud</button>}
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Filter size={14} className="text-gray-400 flex-shrink-0"/>
        <select value={flt.userId} onChange={e => setFlt(f => ({ ...f, userId:e.target.value }))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
          <option value="">Solicitante: Todos</option>
          {uniqueRequesters.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={flt.status} onChange={e => setFlt(f => ({ ...f, status:e.target.value }))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
          <option value="">Estado: Todos</option>
          <option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option><option value="revisado">Revisado</option><option value="completada">Completada</option>
        </select>
        <select value={flt.priority} onChange={e => setFlt(f => ({ ...f, priority:e.target.value }))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
          <option value="">Prioridad: Todas</option>
          <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
        </select>
        {(flt.userId || flt.status || flt.priority) && (
          <button onClick={() => setFlt({ userId:"", status:"", priority:"" })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg transition"><X size={11}/>Limpiar</button>
        )}
      </div>

      {visible.length === 0 && <div className="text-center py-16 text-gray-400"><Bell size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin solicitudes</p></div>}
      {filtered.length === 0 && visible.length > 0 && <div className="text-center py-10 text-gray-400"><Filter size={32} className="mx-auto mb-2 text-gray-300"/><p className="text-sm">Sin resultados para los filtros seleccionados</p></div>}

      <div className="space-y-3">
        {filtered.map(r => {
          const eq = equip.find(e => e.id === r.equipId); const reqBy = users.find(u => u.id === r.requestedBy); const linkedOT = wos.find(w => w.id === r.otId);
          return (
            <div key={r.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${r.status==="pendiente"?r.source==="inspeccion"?"border-amber-300":"border-blue-300":r.status==="completada"?"border-emerald-300":"border-gray-200"}`}>
              <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 flex-wrap ${r.status==="completada"?"bg-emerald-50/60 border-emerald-100":"bg-gray-50/60 border-gray-100"}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge s={r.status}/>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[r.priority]}`}>{r.priority.toUpperCase()}</span>
                  {r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">Reporte Inspección</span>}
                  {r.source==="checklist"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-green-700 bg-green-50 border-green-200">Checklist Pre-op</span>}
                  {r.type&&r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-medium text-gray-600 bg-white border-gray-200">{DEV_TYPE_MAP[r.type]||r.type}</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setSelReq(r)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"><Eye size={11}/>Ver Detalle</button>
                  {r.status==="pendiente"&&(
                    <>
                      {user.role==="operaciones"&&r.source==="checklist"&&(
                        <button onClick={() => openCLProc(r)} className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium" style={{ background:"#16a34a" }}><ClipboardList size={12}/>Procesar</button>
                      )}
                      {user.role==="supervisor"&&(
                        <>
                          <button onClick={() => approve(r)} className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium" style={{ background:NV.blue }}><Check size={12}/>Aprobar + OT</button>
                          {r.source==="inspeccion"
                            ?<button onClick={() => markRevised(r)} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"><Check size={12}/>Revisado</button>
                            :<button onClick={() => reject(r)} className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"><X size={12}/>Rechazar</button>
                          }
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Package size={11} className="text-gray-400 flex-shrink-0"/>
                  <span className="font-mono font-bold" style={{ color:NV.blue }}>{eq?.code||"—"}</span>
                  <span className="font-medium text-gray-700">{eq?.name||"—"}</span>
                  {eq?.location&&<span className="text-gray-400">· {eq.location}</span>}
                </div>
                <p className="text-gray-900 font-bold text-sm leading-tight">{r.title}</p>
                {(r.subsistema||r.componente)&&(
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-400">Subsistema: <span className="text-gray-600 font-medium">{SUBSIST_MAP[r.subsistema]||"—"}</span></span>
                    <span className="text-gray-400">Componente: <span className="text-gray-600 font-medium">{r.componente||"—"}</span></span>
                  </div>
                )}
                {r.description&&<p className="text-gray-500 text-xs leading-snug line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                  <Users size={10}/><span className="font-medium text-gray-500">{reqBy?.name||"—"}</span>
                  <span>·</span><span>{fmtDT(r.requestedAt)}</span>
                  {linkedOT&&<><span>·</span><span className="text-emerald-600 font-semibold">{linkedOT.code}</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selReq && (() => {
        const r = selReq;
        const eq = equip.find(e => e.id === r.equipId);
        const reqBy = users.find(u => u.id === r.requestedBy);
        const approvedByUser = users.find(u => u.id === r.approvedBy);
        const linkedOT = wos.find(w => w.id === r.otId);
        const mechanic = linkedOT ? users.find(u => u.id === linkedOT.assignedTo) : null;
        return (
          <Modal title={`Solicitud — ${r.title}`} onClose={() => setSelReq(null)} wide={true}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge s={r.status}/>
                <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[r.priority]}`}>{r.priority.toUpperCase()}</span>
                {r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">Reporte Inspección</span>}
                {r.source==="checklist"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-green-700 bg-green-50 border-green-200">Checklist Pre-op</span>}
                {r.source==="solicitud"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200">Solicitud Manual</span>}
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Equipo</p>
                <p className="text-gray-800 font-semibold text-sm">{eq?.code} — {eq?.name||"—"}</p>
                {eq?.location&&<p className="text-gray-400 text-xs mt-0.5">{eq.location}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {r.subsistema&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Subsistema</p><p className="text-gray-700 font-semibold">{SUBSIST_MAP[r.subsistema]||r.subsistema}</p></div>}
                {r.componente&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Componente</p><p className="text-gray-700 font-semibold">{r.componente}</p></div>}
                <div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Solicitante</p><p className="text-gray-700 font-semibold">{reqBy?.name||"—"}</p></div>
                <div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Fecha Solicitud</p><p className="text-gray-700 font-semibold">{fmtDT(r.requestedAt)}</p></div>
                {r.approvedBy&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Aprobado/Revisado por</p><p className="text-gray-700 font-semibold">{approvedByUser?.name||"—"}</p></div>}
              </div>
              {r.description&&<div className="bg-gray-50 border border-gray-100 rounded-lg p-3"><p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Descripción de la Falla</p><p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{r.description}</p></div>}
              {r.photos&&r.photos.length>0&&(
                <div>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Fotos adjuntas</p>
                  <div className="flex flex-wrap gap-2">
                    {r.photos.map((src,i)=>(
                      <img key={i} src={src} alt={`foto ${i+1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                        onClick={()=>{const w2=window.open("","_blank");w2.document.write(`<img src="${src}" style="max-width:100%;"/>`);w2.document.close();}}/>
                    ))}
                  </div>
                </div>
              )}
              {linkedOT&&(
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold">OT Vinculada: {linkedOT.code}</div>
                    <button onClick={() => { setSelReq(null); printOT(linkedOT, r, equip, users); }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium hover:opacity-90 transition" style={{ background:NV.navy }}><Printer size={11}/>Imprimir OT</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Tipo</p><p className="text-gray-700 font-semibold capitalize">{linkedOT.type}</p></div>
                    <div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Estado</p><Badge s={linkedOT.status}/></div>
                    <div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Mecánico</p><p className="text-gray-700 font-semibold">{mechanic?.name||"—"}</p></div>
                    <div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Fecha Programada</p><p className="text-gray-700 font-semibold">{fmt(linkedOT.scheduledDate)}</p></div>
                    <div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Horas Estimadas</p><p className="text-gray-700 font-semibold">{linkedOT.estimatedHours}h</p></div>
                    {linkedOT.actualHours&&<div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Horas Reales</p><p className="text-emerald-700 font-bold">{linkedOT.actualHours}h</p></div>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              {linkedOT&&<button onClick={() => { setSelReq(null); printOT(linkedOT, r, equip, users); }} className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm transition hover:opacity-90" style={{ background:NV.navy }}><Printer size={14}/>Imprimir OT</button>}
              <button onClick={() => setSelReq(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cerrar</button>
            </div>
          </Modal>
        );
      })()}

      {showCLProc && clProc.req && (
        <Modal title={`Procesar Checklist — ${equip.find(e => e.id === clProc.req.equipId)?.code||""}`} onClose={() => setShowCLProc(false)}>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-xs font-medium uppercase tracking-wide mb-1">Observaciones del Checklist</p>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{clProc.req.description}</p>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label>
              <select value={clProc.priority} onChange={e => setClProc(c => ({ ...c, priority:e.target.value }))} className={sCls}>
                <option value="alta">Alta — Detiene operaciones</option>
                <option value="media">Media — Afecta rendimiento</option>
                <option value="baja">Baja — Sin impacto inmediato</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label>
              <select value={clProc.subsistema} onChange={e => setClProc(c => ({ ...c, subsistema:e.target.value }))} className={sCls}>
                <option value="">Seleccionar...</option>
                <option value="electrico">Eléctrico</option><option value="hidraulico">Hidráulico</option>
                <option value="mecanico">Mecánico</option><option value="neumatico">Neumático</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA *</label>
              <input value={clProc.componente} onChange={e => setClProc(c => ({ ...c, componente:e.target.value }))} className={iCls} placeholder="ej: Motor, Válvula, Sensor, Cilindro..."/>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">OBSERVACIONES PARA EL SUPERVISOR</label>
              <textarea value={clProc.description} onChange={e => setClProc(c => ({ ...c, description:e.target.value }))} rows={4} className={iCls+" resize-none"} placeholder="Detalla el problema para el supervisor..."/>
            </div>
          </div>
          <ModalActions onSave={submitCLProc} onCancel={() => setShowCLProc(false)} label="Enviar Solicitud al Supervisor"/>
        </Modal>
      )}

      {showForm && (
        <Modal title="Nueva Solicitud de Reparación" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label><select value={form.equipId} onChange={e => setForm(f => ({ ...f, equipId:e.target.value }))} className={sCls}><option value="">Seleccionar...</option>{equip.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label>
              <select value={form.subsistema} onChange={e => setForm(f => ({ ...f, subsistema:e.target.value }))} className={sCls}>
                <option value="">Seleccionar...</option>
                <option value="electrico">Eléctrico</option><option value="hidraulico">Hidráulico</option>
                <option value="mecanico">Mecánico</option><option value="neumatico">Neumático</option>
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label><input value={form.componente} onChange={e => setForm(f => ({ ...f, componente:e.target.value }))} className={iCls} placeholder="ej: Motor, Válvula, Sensor, Cilindro..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">FALLA DETECTADA *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} className={iCls} placeholder="Descripción breve de la falla"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN DE LA FALLA</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} rows={3} className={iCls+" resize-none"} placeholder="Detalla síntomas, condiciones, frecuencia..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label><select value={form.priority} onChange={e => setForm(f => ({ ...f, priority:e.target.value }))} className={sCls}><option value="alta">Alta — Detiene operaciones</option><option value="media">Media — Afecta rendimiento</option><option value="baja">Baja — Sin impacto inmediato</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-2 block">FOTOS (opcional)</label><PhotoPicker photos={form.photos||[]} onChange={p => setForm(f => ({ ...f, photos:p }))} max={3}/></div>
          </div>
          <ModalActions onSave={createReq} onCancel={() => setShowForm(false)} label="Enviar Solicitud"/>
        </Modal>
      )}
    </div>
  );
}

export default RequestsPage;
