import { useState } from "react";
import { Plus, Trash2, ClipboardList, Layers, Info, Users, Clock, Gauge, Zap, X } from "lucide-react";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, iCls, sCls, card, btnPrimary, btnSecondary } from "../utils/constants";
import { uid, nextOTCode } from "../utils/helpers";
import toast from "react-hot-toast";

const EMPTY_TPL = { name:"", frequency:"", estimatedHours:"", technician:"", tasks:"" };
const EMPTY_PLAN_FORM = { equipId:"", name:"", frequency:"", lastHorometro:"", estimatedHours:"", technician:"", tasks:"" };

export function PlansPage({ user, data, setData, saveData }) {
  const { plans, equip, users, wos, taskTemplates, checklists } = data;
  const liveHours = (equipId) => {
    const latestCL = (checklists||[]).filter(c => c.equipId === equipId).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))[0];
    return latestCL ? latestCL.horometro : (equip.find(e => e.id === equipId)?.hours || 0);
  };
  const [tab, setTab] = useState("planes");
  const [showTplForm, setShowTplForm] = useState(false);
  const [showAssign, setShowAssign] = useState(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [tplForm, setTplForm] = useState(EMPTY_TPL);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [selEquipsData, setSelEquipsData] = useState({});

  const genOT = (plan, allWOs) => {
    const eq = equip.find(e => e.id === plan.equipId); if (!eq) return null;
    const priority = eq.criticality==="A"?"alta":eq.criticality==="B"?"media":"baja";
    return { id:uid(), code:nextOTCode(allWOs), type:"preventivo", equipId:plan.equipId, planId:plan.id, title:plan.name, priority, status:"asignada", assignedTo:plan.technician, createdAt:new Date().toISOString(), scheduledDate:"", estimatedHours:parseFloat(plan.estimatedHours)||0, actualHours:null, description:`OT automática. Tareas: ${Array.isArray(plan.tasks)?plan.tasks.join(", "):plan.tasks}`, observations:"", parts:[], source:"plan" };
  };

  const saveTpl = () => {
    if (!tplForm.name || !tplForm.frequency) { toast.error("Nombre y frecuencia son requeridos"); return; }
    const nt = { id:uid(), ...tplForm, frequency:parseInt(tplForm.frequency)||0, estimatedHours:parseFloat(tplForm.estimatedHours)||0, tasks:tplForm.tasks.split("\n").filter(Boolean) };
    const upd = [...(taskTemplates||[]), nt];
    setData(d => ({ ...d, taskTemplates:upd })); saveData("taskTemplates", upd);
    setShowTplForm(false); setTplForm(EMPTY_TPL);
    toast.success("Plantilla guardada");
  };

  const deleteTpl = (id) => {
    const upd = (taskTemplates||[]).filter(t => t.id !== id);
    setData(d => ({ ...d, taskTemplates:upd })); saveData("taskTemplates", upd);
    toast.success("Plantilla eliminada");
  };

  const assignTpl = () => {
    const ids = Object.keys(selEquipsData);
    if (ids.length === 0 || !showAssign) { toast.error("Selecciona al menos un equipo"); return; }
    let newPlans = [...plans];
    ids.forEach(eqId => {
      const eq = equip.find(e => e.id === eqId); if (!eq) return;
      const lastHoro = parseFloat(selEquipsData[eqId].lastHorometro) || 0;
      const np = { id:uid(), templateId:showAssign.id, equipId:eqId, name:showAssign.name, frequency:showAssign.frequency, lastHorometro:lastHoro, horometroTarget:lastHoro+showAssign.frequency, estimatedHours:showAssign.estimatedHours, technician:showAssign.technician, tasks:showAssign.tasks };
      newPlans.push(np);
    });
    setData(d => ({ ...d, plans:newPlans })); saveData("plans", newPlans);
    setShowAssign(null); setSelEquipsData({});
    toast.success(`${ids.length} planes creados`);
  };

  const addPlan = () => {
    if (!planForm.equipId || !planForm.name || !planForm.frequency) { toast.error("Completa los campos obligatorios"); return; }
    const lastHoro = parseFloat(planForm.lastHorometro) || 0;
    const freq = parseInt(planForm.frequency) || 0;
    const np = { id:uid(), equipId:planForm.equipId, name:planForm.name, frequency:freq, lastHorometro:lastHoro, horometroTarget:lastHoro+freq, estimatedHours:parseFloat(planForm.estimatedHours)||0, technician:planForm.technician, tasks:planForm.tasks.split("\n").filter(Boolean) };
    const updP = [...plans, np]; const newOT = genOT(np, wos); const updW = newOT ? [...wos, newOT] : wos;
    setData(d => ({ ...d, plans:updP, wos:updW })); saveData("plans", updP); saveData("workOrders", updW);
    setShowPlanForm(false); setPlanForm(EMPTY_PLAN_FORM);
    if (newOT) toast.success(`OT ${newOT.code} generada`);
    else toast.success("Plan guardado");
  };

  const generateOT = plan => {
    const newOT = genOT(plan, wos); if (!newOT) { toast.error("No se pudo generar OT"); return; }
    const updW = [...wos, newOT]; setData(d => ({ ...d, wos:updW })); saveData("workOrders", updW);
    toast.success(`OT ${newOT.code} — Prioridad ${newOT.priority.toUpperCase()}`);
  };

  const deletePlan = (id) => {
    const upd = plans.filter(p => p.id !== id);
    setData(d => ({ ...d, plans:upd })); saveData("plans", upd);
    toast.success("Plan eliminado");
  };

  const tpls = taskTemplates || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Plan de Mantenimiento Preventivo</h1><p className="text-gray-500 text-sm">Programación por horómetro</p></div>
        {user.role === "supervisor" && <div className="flex gap-2">
          <button onClick={() => setShowTplForm(true)} className={btnSecondary} style={{ borderColor:NV.blue, color:NV.blue, background:"white" }}><ClipboardList size={15}/>Nueva Plantilla</button>
          <button onClick={() => setShowPlanForm(true)} className={btnPrimary} style={{ background:NV.blue }}><Plus size={15}/>Nuevo Plan</button>
        </div>}
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {[["planes","Planes Activos"],["plantillas","Plantillas"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab===t?"bg-white text-gray-900 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {tab === "planes" && (
        <>
          {plans.length === 0 && <div className="text-center py-16 text-gray-400"><Gauge size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin planes de mantenimiento</p><p className="text-sm mt-1">Crea una plantilla y asígnala a equipos, o crea un plan individual</p></div>}
          {(() => {
            const equipIds = [...new Set(plans.map(p => p.equipId))];
            return (
              <div className="space-y-6">
                {equipIds.map(equipId => {
                  const eq = equip.find(e => e.id === equipId);
                  const groupPlans = plans.filter(p => p.equipId === equipId);
                  const curH = liveHours(equipId);
                  const hasChecklistReading = (checklists||[]).some(c => c.equipId === equipId);
                  const groupHasOverdue = groupPlans.some(p => curH >= p.horometroTarget);
                  const groupHasSoon = !groupHasOverdue && groupPlans.some(p => { const hl = p.horometroTarget-curH; return hl <= (p.frequency||250)*0.15 && curH < p.horometroTarget; });
                  return (
                    <div key={equipId}>
                      <div className="flex items-center gap-2.5 mb-2 px-1">
                        {groupHasOverdue && <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"/>}
                        {!groupHasOverdue && groupHasSoon && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"/>}
                        {!groupHasOverdue && !groupHasSoon && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0"/>}
                        <span className="font-mono font-bold text-sm" style={{ color:NV.blue }}>{eq?.code}</span>
                        <span className="font-semibold text-gray-700 text-sm">{eq?.name}</span>
                        <span className="text-gray-400 text-xs flex items-center gap-1"><Gauge size={11}/>{curH.toLocaleString()}h actual</span>
                        {hasChecklistReading
                          ? <span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">Fuente: Checklist</span>
                          : <span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-gray-500 bg-gray-50 border-gray-200">Fuente: Manual</span>
                        }
                      </div>
                      <div className="space-y-3 pl-5 border-l-2 ml-1" style={{ borderColor:groupHasOverdue?"#ef4444":groupHasSoon?"#f59e0b":"#d1d5db" }}>
                        {groupPlans.map(p => {
                          const tech = users.find(u => u.id === p.technician);
                          const linked = wos.filter(w => w.planId === p.id);
                          const currentH = liveHours(p.equipId);
                          const hoursLeft = p.horometroTarget - currentH;
                          const overdue = currentH >= p.horometroTarget;
                          const soon = !overdue && hoursLeft <= (p.frequency||250)*0.15;
                          const range = p.horometroTarget - p.lastHorometro;
                          const pct = range > 0 ? Math.min(100, Math.max(0, ((currentH-p.lastHorometro)/range)*100)) : 100;
                          return (
                            <div key={p.id} className={`${card} p-4 hover:shadow-md transition`}>
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    {overdue && <span className="px-2 py-0.5 rounded-full border text-xs font-bold text-red-700 bg-red-50 border-red-200">VENCIDO</span>}
                                    {soon && !overdue && <span className="px-2 py-0.5 rounded-full border text-xs font-bold text-amber-700 bg-amber-50 border-amber-200">PRÓXIMO</span>}
                                    {!overdue && !soon && <span className="px-2 py-0.5 rounded-full border text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200">En {Math.round(hoursLeft)}h</span>}
                                  </div>
                                  <p className="text-gray-800 font-semibold text-sm mb-3">{p.name}</p>
                                  <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                      <span>{p.lastHorometro.toLocaleString()}h</span>
                                      <span className="font-semibold" style={{ color:overdue?"#b91c1c":NV.navy }}>Actual: {currentH.toLocaleString()}h</span>
                                      <span>Meta: {p.horometroTarget.toLocaleString()}h</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${overdue?"bg-red-500":soon?"bg-amber-400":"bg-emerald-500"}`} style={{ width:`${pct}%` }}/>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Frecuencia: cada {p.frequency}h · {linked.length} OT historial</p>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                    <span className="flex items-center gap-1"><Clock size={10}/>{p.estimatedHours}h est.</span>
                                    {tech && <span className="flex items-center gap-1"><Users size={10}/>{tech.name}</span>}
                                  </div>
                                  {Array.isArray(p.tasks) && p.tasks.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{p.tasks.map((t, i) => <span key={i} className="text-xs border px-2 py-0.5 rounded-full" style={{ background:NV.light, borderColor:"#BFD9F2", color:NV.navy }}>{t}</span>)}</div>}
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  {user.role === "supervisor" && <>
                                    <button onClick={() => generateOT(p)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium text-white" style={{ background:NV.blue }}><Zap size={12}/>Generar OT</button>
                                    <button onClick={() => deletePlan(p.id)} className="text-xs text-gray-300 hover:text-red-500 transition p-1"><Trash2 size={13}/></button>
                                  </>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      {tab === "plantillas" && (
        <>
          {tpls.length === 0 && <div className="text-center py-16 text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin plantillas</p></div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {tpls.map(t => {
              const tech = users.find(u => u.id === t.technician);
              const usedCount = plans.filter(p => p.templateId === t.id).length;
              return (
                <div key={t.id} className={`${card} p-4 hover:shadow-md transition`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-gray-800 font-semibold text-sm">{t.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Cada {t.frequency}h · {t.estimatedHours}h est.</p>
                    </div>
                    {user.role === "supervisor" && <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setSelEquipsData({}); setShowAssign(t); }} className="text-xs px-2.5 py-1 rounded-lg font-medium text-white transition hover:opacity-90 flex items-center gap-1" style={{ background:NV.blue }}><Layers size={11}/>Asignar</button>
                      <button onClick={() => deleteTpl(t.id)} className="text-gray-300 hover:text-red-500 p-1 transition"><Trash2 size={13}/></button>
                    </div>}
                  </div>
                  {tech && <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Users size={10}/>{tech.name}</p>}
                  {Array.isArray(t.tasks) && t.tasks.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{t.tasks.map((task, i) => <span key={i} className="text-xs border px-1.5 py-0.5 rounded" style={{ background:NV.light, borderColor:"#BFD9F2", color:NV.navy }}>{task}</span>)}</div>}
                  <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">{usedCount} equipo{usedCount!==1?"s":""} asignado{usedCount!==1?"s":""}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showTplForm && (
        <Modal title="Nueva Plantilla de Tarea" onClose={() => { setShowTplForm(false); setTplForm(EMPTY_TPL); }}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE</label><input value={tplForm.name} onChange={e => setTplForm(f => ({ ...f, name:e.target.value }))} className={iCls} placeholder="ej: Servicio 250h"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">FRECUENCIA (horas)</label><input type="number" value={tplForm.frequency} onChange={e => setTplForm(f => ({ ...f, frequency:e.target.value }))} className={iCls} placeholder="250"/></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">HRS ESTIMADAS</label><input type="number" value={tplForm.estimatedHours} onChange={e => setTplForm(f => ({ ...f, estimatedHours:e.target.value }))} className={iCls} placeholder="4"/></div>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÉCNICO ASIGNADO</label><select value={tplForm.technician} onChange={e => setTplForm(f => ({ ...f, technician:e.target.value }))} className={sCls}><option value="">Seleccionar...</option>{users.filter(u => u.role==="mecanico").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TAREAS (una por línea)</label><textarea value={tplForm.tasks} onChange={e => setTplForm(f => ({ ...f, tasks:e.target.value }))} rows={4} className={iCls+" resize-none"} placeholder={"Cambio aceite motor\nFiltro hidráulico\nRevisión frenos"}/></div>
          </div>
          <ModalActions onSave={saveTpl} onCancel={() => { setShowTplForm(false); setTplForm(EMPTY_TPL); }} label="Guardar Plantilla"/>
        </Modal>
      )}

      {showAssign && (
        <Modal title={`Asignar: ${showAssign.name}`} onClose={() => { setShowAssign(null); setSelEquipsData({}); }} wide={true}>
          <div className="rounded-lg p-3 mb-4 text-xs flex items-start gap-2" style={{ background:NV.light, color:NV.navy, border:`1px solid #BFD9F2` }}>
            <Info size={14} className="flex-shrink-0 mt-0.5"/>
            <span>Frecuencia: <strong>cada {showAssign.frequency}h</strong>. Ingresa el horómetro de la última intervención por equipo.</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-gray-700 font-semibold text-sm mb-2">Equipos <span style={{ color:NV.blue }}>({Object.keys(selEquipsData).length} sel.)</span></p>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {equip.map(e => {
                  const checked = !!selEquipsData[e.id];
                  return (
                    <div key={e.id} className={`rounded-lg border transition ${checked?"border-blue-300":"bg-gray-50 border-gray-200 hover:border-gray-300"}`} style={checked?{background:NV.light}:{}}>
                      <label className="flex items-center gap-2.5 p-2.5 cursor-pointer" onClick={() => {
                        if (checked) { const n = {...selEquipsData}; delete n[e.id]; setSelEquipsData(n); }
                        else setSelEquipsData(s => ({ ...s, [e.id]:{ lastHorometro:String(e.hours) } }));
                      }}>
                        <input type="checkbox" checked={checked} readOnly className="w-4 h-4 flex-shrink-0" style={{ accentColor:NV.blue }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-xs font-semibold">{e.name}</p>
                          <p className="text-gray-400 text-xs">{e.code} · {e.hours.toLocaleString()}h actuales</p>
                        </div>
                      </label>
                      {checked && (
                        <div className="px-2.5 pb-2.5 flex items-end gap-2">
                          <div className="flex-1">
                            <p className="text-gray-400 text-xs mb-0.5">Último horómetro de intervención</p>
                            <input type="number" value={selEquipsData[e.id].lastHorometro} onChange={ev => setSelEquipsData(s => ({ ...s, [e.id]:{ lastHorometro:ev.target.value } }))} className={iCls+" py-1 text-xs"} onClick={ev => ev.stopPropagation()}/>
                          </div>
                          <div className="text-right flex-shrink-0 pb-1">
                            <p className="text-gray-400 text-xs">Próximo</p>
                            <p className="font-bold text-sm" style={{ color:NV.blue }}>{((parseFloat(selEquipsData[e.id].lastHorometro)||0)+showAssign.frequency).toLocaleString()}h</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { const n={}; equip.forEach(e => { n[e.id] = { lastHorometro:String(e.hours) }; }); setSelEquipsData(n); }} className="flex-1 text-xs hover:underline py-1" style={{ color:NV.blue }}>Todos</button>
                <button onClick={() => setSelEquipsData({})} className="flex-1 text-xs text-gray-400 hover:underline py-1">Limpiar</button>
              </div>
            </div>
            <div>
              <p className="text-gray-700 font-semibold text-sm mb-2">Vista previa</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {Object.keys(selEquipsData).length === 0
                  ? <p className="text-gray-400 text-xs py-4 text-center">Selecciona equipos a la izquierda</p>
                  : Object.entries(selEquipsData).map(([eqId, d]) => {
                    const eq = equip.find(e => e.id === eqId); if (!eq) return null;
                    const lastH = parseFloat(d.lastHorometro) || 0;
                    const target = lastH + showAssign.frequency;
                    const hl = target - eq.hours;
                    const overdue = eq.hours >= target;
                    return (
                      <div key={eqId} className="p-3 rounded-lg border" style={{ background:NV.light, borderColor:"#BFD9F2" }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-semibold" style={{ color:NV.navy }}>{eq.name} <span className="font-normal text-gray-400">({eq.code})</span></p>
                            <p className="text-xs text-gray-500 mt-0.5">{lastH.toLocaleString()}h → <strong>{target.toLocaleString()}h</strong></p>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${overdue?"text-red-700 bg-red-100":hl<=(showAssign.frequency*0.1)?"text-amber-700 bg-amber-100":"text-emerald-700 bg-emerald-100"}`}>
                            {overdue?"VENCIDO":`+${Math.round(hl)}h`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
          <ModalActions onSave={assignTpl} onCancel={() => { setShowAssign(null); setSelEquipsData({}); }} label={`Crear ${Object.keys(selEquipsData).length} Planes`}/>
        </Modal>
      )}

      {showPlanForm && (
        <Modal title="Nuevo Plan Individual" onClose={() => { setShowPlanForm(false); setPlanForm(EMPTY_PLAN_FORM); }}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label>
              <select value={planForm.equipId} onChange={e => { const eq = equip.find(q => q.id === e.target.value); setPlanForm(f => ({ ...f, equipId:e.target.value, lastHorometro:eq?String(eq.hours):"" })); }} className={sCls}>
                <option value="">Seleccionar...</option>{equip.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code}) — {e.hours.toLocaleString()}h</option>)}
              </select>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE DEL PLAN</label><input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name:e.target.value }))} className={iCls} placeholder="ej: Servicio 250h"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">FRECUENCIA (horas)</label><input type="number" value={planForm.frequency} onChange={e => setPlanForm(f => ({ ...f, frequency:e.target.value }))} className={iCls} placeholder="250"/></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">ÚLTIMO HORÓMETRO</label><input type="number" value={planForm.lastHorometro} onChange={e => setPlanForm(f => ({ ...f, lastHorometro:e.target.value }))} className={iCls} placeholder="ej: 1000"/></div>
            </div>
            {planForm.frequency && planForm.lastHorometro && (
              <div className="rounded-lg p-2.5 text-xs flex items-center gap-2" style={{ background:NV.light, color:NV.navy, border:`1px solid #BFD9F2` }}>
                <Gauge size={13}/><span>Próxima intervención: <strong>{(parseFloat(planForm.lastHorometro)+parseInt(planForm.frequency)).toLocaleString()}h</strong></span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">HRS ESTIMADAS</label><input type="number" value={planForm.estimatedHours} onChange={e => setPlanForm(f => ({ ...f, estimatedHours:e.target.value }))} className={iCls}/></div>
              <div><label className="text-gray-500 text-xs font-medium mb-1 block">TÉCNICO</label><select value={planForm.technician} onChange={e => setPlanForm(f => ({ ...f, technician:e.target.value }))} className={sCls}><option value="">Seleccionar...</option>{users.filter(u => u.role==="mecanico").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            </div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">TAREAS (una por línea)</label><textarea value={planForm.tasks} onChange={e => setPlanForm(f => ({ ...f, tasks:e.target.value }))} rows={4} className={iCls+" resize-none"} placeholder={"Cambio aceite motor\nFiltro hidráulico\nRevisión frenos"}/></div>
          </div>
          <ModalActions onSave={addPlan} onCancel={() => { setShowPlanForm(false); setPlanForm(EMPTY_PLAN_FORM); }} label="Guardar Plan"/>
        </Modal>
      )}
    </div>
  );
}

export default PlansPage;
