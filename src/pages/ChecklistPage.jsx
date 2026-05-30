import { useState, useRef } from "react";
import { Plus, Check, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, ClipboardList } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, CHECKLIST_TEMPLATES, CL_STATUS, card, btnPrimary } from "../utils/constants";
import { uid } from "../utils/helpers";
import toast from "react-hot-toast";

export function ChecklistPage({ user, data, setData, saveData }) {
  const { equip, checklists } = data;
  const allCL = checklists || [];

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1); // 1=select equip+type, 2=fill items
  const [selEquip, setSelEquip] = useState("");
  const [selType, setSelType] = useState("");
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const [globalNote, setGlobalNote] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [viewCL, setViewCL] = useState(null);

  const myHistory = allCL.filter(c => c.operatorId === user.id).slice().reverse();
  const thisMonth = new Date().toISOString().slice(0, 7);

  const getTemplate = (equipId, typeKey) => {
    if (typeKey && CHECKLIST_TEMPLATES[typeKey]) return CHECKLIST_TEMPLATES[typeKey];
    const eq = equip.find(e => e.id === equipId);
    if (!eq) return null;
    for (const [key, tpl] of Object.entries(CHECKLIST_TEMPLATES)) {
      if (tpl.equipTypes?.some(t => eq.type?.includes(t.split(" ")[0]))) return { ...tpl, key };
    }
    return CHECKLIST_TEMPLATES.tracto;
  };

  const startChecklist = () => {
    if (!selEquip) { toast.error("Selecciona un equipo"); return; }
    const tpl = getTemplate(selEquip, selType);
    if (!tpl) { toast.error("No hay plantilla disponible para este equipo"); return; }
    // Init all answers to empty
    const initAnswers = {};
    const initNotes = {};
    tpl.sections.forEach(sec => sec.items.forEach(item => {
      initAnswers[item.id] = "";
      initNotes[item.id] = "";
    }));
    setAnswers(initAnswers);
    setNotes(initNotes);
    setExpandedSections({});
    setGlobalNote("");
    setStep(2);
  };

  const setAnswer = (itemId, val) => setAnswers(a => ({ ...a, [itemId]: val }));
  const setNote = (itemId, val) => setNotes(n => ({ ...n, [itemId]: val }));
  const toggleSection = key => setExpandedSections(s => ({ ...s, [key]: !s[key] }));

  const submitChecklist = () => {
    const tpl = getTemplate(selEquip, selType);
    const allItems = tpl.sections.flatMap(s => s.items);
    const unanswered = allItems.filter(i => !answers[i.id]);
    if (unanswered.length > 0) {
      toast.error(`Faltan ${unanswered.length} ítems por responder`);
      return;
    }
    const hasIssues = Object.values(answers).some(v => v === "malo" || v === "regular");
    const issueCount = Object.values(answers).filter(v => v === "malo" || v === "regular").length;
    const eq = equip.find(e => e.id === selEquip);

    const newCL = {
      id: uid(),
      equipId: selEquip,
      operatorId: user.id,
      operatorName: user.name,
      type: selType || Object.keys(CHECKLIST_TEMPLATES).find(k => {
        return CHECKLIST_TEMPLATES[k].equipTypes?.some(t => eq?.type?.includes(t.split(" ")[0]));
      }) || "tracto",
      answers,
      notes,
      globalNote,
      hasIssues,
      issueCount,
      createdAt: new Date().toISOString(),
      status: hasIssues ? "con_observaciones" : "ok",
    };

    const updated = [...allCL, newCL];
    setData(d => ({ ...d, checklists: updated }));
    saveData("checklists", updated);

    // If has issues, create a notification/request for supervisor
    if (hasIssues) {
      const newReq = {
        id: uid(),
        code: `REQ-${Date.now()}`,
        title: `Obs. Checklist — ${eq?.code || "Equipo"}: ${issueCount} ítems`,
        description: `Checklist pre-operacional con ${issueCount} observación(es). ${globalNote ? "Nota: " + globalNote : ""}`,
        equipId: selEquip,
        status: "pendiente",
        priority: issueCount > 3 ? "alta" : "media",
        requestedBy: user.id,
        requestedByName: user.name,
        source: "checklist",
        checklistId: newCL.id,
        createdAt: new Date().toISOString(),
      };
      const updReqs = [...(data.requests || []), newReq];
      setData(d => ({ ...d, requests: updReqs }));
      saveData("requests", updReqs);
      toast.success(`Checklist guardado. Se creó una solicitud por ${issueCount} observación(es).`);
    } else {
      toast.success("Checklist completado sin observaciones");
    }

    setShowForm(false);
    setStep(1);
    setSelEquip(""); setSelType("");
  };

  const openNew = () => { setStep(1); setSelEquip(""); setSelType(""); setShowForm(true); };

  const tpl = step === 2 ? getTemplate(selEquip, selType) : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Checklist Pre-Operacional</h1>
          <p className="text-gray-500 text-sm">{myHistory.filter(c => c.createdAt?.startsWith(thisMonth)).length} realizados este mes</p>
        </div>
        <button onClick={openNew} style={{ background: NV.blue }} className={btnPrimary}>
          <Plus size={15}/>Nuevo Checklist
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`${card} p-4 text-center`}>
          <p className="text-2xl font-bold" style={{ color: NV.navy }}>{myHistory.filter(c => c.createdAt?.startsWith(thisMonth)).length}</p>
          <p className="text-gray-500 text-xs mt-1">Este Mes</p>
        </div>
        <div className={`${card} p-4 text-center`}>
          <p className="text-2xl font-bold text-emerald-600">{myHistory.filter(c => !c.hasIssues && c.createdAt?.startsWith(thisMonth)).length}</p>
          <p className="text-gray-500 text-xs mt-1">Sin Observaciones</p>
        </div>
        <div className={`${card} p-4 text-center`}>
          <p className="text-2xl font-bold text-amber-600">{myHistory.filter(c => c.hasIssues && c.createdAt?.startsWith(thisMonth)).length}</p>
          <p className="text-gray-500 text-xs mt-1">Con Observaciones</p>
        </div>
      </div>

      {/* History */}
      <div className={card}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-sm" style={{ color: NV.navy }}>Mis Checklists Recientes</h2>
        </div>
        {myHistory.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">No has realizado ningún checklist aún</div>
        )}
        <div className="divide-y divide-gray-100">
          {myHistory.slice(0, 20).map(cl => {
            const eq = equip.find(e => e.id === cl.equipId);
            const tplInfo = CHECKLIST_TEMPLATES[cl.type];
            return (
              <div key={cl.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setViewCL(cl)}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cl.hasIssues ? "bg-amber-100" : "bg-emerald-100"}`}>
                  {cl.hasIssues ? <AlertTriangle size={14} className="text-amber-600"/> : <CheckCircle size={14} className="text-emerald-600"/>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{eq?.code || "?"} — {eq?.name}</p>
                  <p className="text-xs text-gray-500">{tplInfo?.label || cl.type} · {new Date(cl.createdAt).toLocaleString("es-CL")}</p>
                </div>
                {cl.hasIssues
                  ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{cl.issueCount} obs.</span>
                  : <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">OK</span>
                }
              </div>
            );
          })}
        </div>
      </div>

      {/* New Checklist Modal */}
      {showForm && (
        <Modal title={step === 1 ? "Nuevo Checklist — Selección" : `Checklist — ${equip.find(e => e.id === selEquip)?.code}`} onClose={() => { setShowForm(false); setStep(1); }} wide={step === 2}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label>
                <select value={selEquip} onChange={e => setSelEquip(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
                  <option value="">Seleccionar equipo...</option>
                  {equip.filter(e => e.status === "operativo" || e.status === "mantenimiento").map(e => (
                    <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">TIPO DE CHECKLIST</label>
                <select value={selType} onChange={e => setSelType(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm">
                  <option value="">Auto-detectar según equipo</option>
                  {Object.entries(CHECKLIST_TEMPLATES).map(([k, t]) => (
                    <option key={k} value={k}>{t.label}</option>
                  ))}
                </select>
              </div>
              <ModalActions onSave={startChecklist} onCancel={() => { setShowForm(false); setStep(1); }} label="Continuar →"/>
            </div>
          )}

          {step === 2 && tpl && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {tpl.sections.map((sec, si) => {
                const isOpen = expandedSections[si] !== false; // default open
                const secItems = sec.items;
                const secAnswered = secItems.filter(i => answers[i.id]).length;
                const secIssues = secItems.filter(i => answers[i.id] === "malo" || answers[i.id] === "regular").length;
                return (
                  <div key={si} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition" onClick={() => toggleSection(si)}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">{sec.label}</span>
                        <span className="text-xs text-gray-400">({secAnswered}/{secItems.length})</span>
                        {secIssues > 0 && <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{secIssues} obs.</span>}
                      </div>
                      {isOpen ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-gray-100">
                        {secItems.map(item => (
                          <div key={item.id} className="px-4 py-3">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-base leading-none mt-0.5">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-400">{item.method}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {["bueno","regular","malo"].map(v => (
                                <button key={v} onClick={() => setAnswer(item.id, v)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${answers[item.id] === v
                                    ? v === "bueno" ? "bg-emerald-500 text-white border-emerald-500" : v === "regular" ? "bg-amber-400 text-white border-amber-400" : "bg-red-500 text-white border-red-500"
                                    : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"}`}>
                                  {v === "bueno" ? "✓ Bueno" : v === "regular" ? "~ Regular" : "✗ Malo"}
                                </button>
                              ))}
                            </div>
                            {(answers[item.id] === "malo" || answers[item.id] === "regular") && (
                              <input value={notes[item.id] || ""} onChange={e => setNote(item.id, e.target.value)}
                                placeholder="Describe la observación..." className="mt-2 w-full border border-amber-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"/>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div>
                <label className="text-gray-500 text-xs font-medium mb-1 block">NOTA GENERAL</label>
                <textarea value={globalNote} onChange={e => setGlobalNote(e.target.value)} rows={3}
                  placeholder="Observaciones generales..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/>
              </div>
              <ModalActions onSave={submitChecklist} onCancel={() => { setShowForm(false); setStep(1); }} label="Enviar Checklist"/>
            </div>
          )}
        </Modal>
      )}

      {/* View Checklist Modal */}
      {viewCL && (
        <Modal title={`Checklist — ${equip.find(e => e.id === viewCL.equipId)?.code}`} onClose={() => setViewCL(null)} wide>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${viewCL.hasIssues ? "bg-amber-100" : "bg-emerald-100"}`}>
                {viewCL.hasIssues ? <AlertTriangle size={14} className="text-amber-600"/> : <CheckCircle size={14} className="text-emerald-600"/>}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{viewCL.operatorName} · {new Date(viewCL.createdAt).toLocaleString("es-CL")}</p>
                <p className="text-xs text-gray-500">{CHECKLIST_TEMPLATES[viewCL.type]?.label || viewCL.type} · {viewCL.hasIssues ? `${viewCL.issueCount} observaciones` : "Sin observaciones"}</p>
              </div>
            </div>
            {CHECKLIST_TEMPLATES[viewCL.type]?.sections.map((sec, si) => (
              <div key={si} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50">
                  <p className="font-semibold text-sm text-gray-700">{sec.label}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {sec.items.map(item => {
                    const ans = viewCL.answers?.[item.id];
                    const note = viewCL.notes?.[item.id];
                    return (
                      <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <div className="flex-1 text-sm text-gray-700">{item.name}</div>
                        <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CL_STATUS[ans]?.cls || "text-gray-400 bg-gray-50 border-gray-200"}`}>
                          {CL_STATUS[ans]?.lbl || "—"} {ans || "N/A"}
                        </div>
                        {note && <span className="text-xs text-amber-600 italic">"{note}"</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {viewCL.globalNote && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-medium text-amber-700 mb-1">Nota General:</p>
                <p className="text-sm text-amber-800">{viewCL.globalNote}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => setViewCL(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ChecklistPage;
