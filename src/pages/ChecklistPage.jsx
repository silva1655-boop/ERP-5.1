import { useState } from 'react';
import { Plus, X, AlertTriangle, CheckCircle, FileDown, ArrowRight, FileWarning, Filter } from 'lucide-react';
import { PhotoPicker } from '../components/common/PhotoPicker';
import { SignaturePad } from '../components/common/SignaturePad';
import { NV, CHECKLIST_TEMPLATES, CL_STATUS, card, btnPrimary, btnSecondary, iCls, sCls } from '../utils/constants';
import { uid, fmtDT, downloadCSV } from '../utils/helpers';
import toast from 'react-hot-toast';

export function ChecklistPage({ user, data, setData, saveData }) {
  const { checklists, equip, requests, users } = data;
  const allCL = checklists || [];

  const [editing, setEditing] = useState(false);
  const [setup, setSetup] = useState({ operatorName: "", equipType: "tracto", equipId: "", horometro: "", fuel: "1/2" });
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(1);
  const [showSig, setShowSig] = useState(false);

  const tplEquip = type => equip.filter(e => CHECKLIST_TEMPLATES[type]?.equipTypes?.includes(e.type));

  const startForm = () => {
    if (!setup.operatorName.trim()) { toast.error("Ingresa el nombre del operador"); return; }
    if (!setup.equipId || !setup.horometro) { toast.error("Completa equipo y horómetro"); return; }
    const tpl = CHECKLIST_TEMPLATES[setup.equipType];
    const flat = tpl.sections.flatMap(s => s.items.map(it => ({ ...it, sectionLabel: s.label, status: null, note: "", photos: [] })));
    setItems(flat);
    setStep(2);
  };

  const setItemStatus = (id, status) => setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));
  const setItemNote   = (id, note)   => setItems(prev => prev.map(it => it.id === id ? { ...it, note }   : it));
  const setItemPhotos = (id, photos) => setItems(prev => prev.map(it => it.id === id ? { ...it, photos } : it));

  const issueItems  = items.filter(it => it.status === "malo" || it.status === "regular");
  const pendingCount = items.filter(it => it.status === null).length;

  const doSubmit = (signature) => {
    const eq = equip.find(e => e.id === setup.equipId);
    const newCL = {
      id: uid(), type: setup.equipType, equipId: setup.equipId,
      operatorId: user.id, operatorName: setup.operatorName,
      horometro: parseFloat(setup.horometro) || 0, fuel: setup.fuel,
      items: items.map(it => ({ id: it.id, name: it.name, sectionLabel: it.sectionLabel, status: it.status, note: it.note, photos: it.photos || [] })),
      createdAt: new Date().toISOString(),
      hasIssues: issueItems.length > 0, issueCount: issueItems.length,
      operatorSignature: signature || null,
    };
    const updC = [...allCL, newCL];
    setData(d => ({ ...d, checklists: updC }));
    saveData("checklists", updC);

    if (issueItems.length > 0) {
      const now = new Date().toISOString();
      const header = `Inspección pre-operacional — ${new Date().toLocaleDateString("es-CL")}\nHorómetro: ${setup.horometro}h · Combustible: ${setup.fuel}\nOperador: ${setup.operatorName}`;
      const newSolicitudes = issueItems.map(it => ({
        id: uid(),
        title: `[${it.status === "malo" ? "MALO" : "REGULAR"}] ${it.name} — ${eq?.code}`,
        equipId: setup.equipId,
        subsistema: "",
        componente: it.name,
        description: `${header}\n\nSección: ${it.sectionLabel}\nEstado: ${it.status === "malo" ? "MALO ✗" : "REGULAR ~"}${it.note ? `\nNota del operador: ${it.note}` : ""}`,
        priority: it.status === "malo" ? "alta" : "media",
        status: "pendiente",
        requestedBy: user.id,
        requestedAt: now,
        source: "checklist",
        checklistId: newCL.id,
        checklistItemId: it.id,
        photos: it.photos || [],
      }));
      const updR = [...(requests || []), ...newSolicitudes];
      setData(d => ({ ...d, requests: updR }));
      saveData("requests", updR);
    }

    setEditing(false); setStep(1); setItems([]); setShowSig(false);
    setSetup({ operatorName: "", equipType: "tracto", equipId: "", horometro: "", fuel: "1/2" });
    toast.success(`Checklist guardado${issueItems.length > 0 ? ` · ${issueItems.length} solicitud(es) enviadas a Operaciones` : ". Sin observaciones"}`);
  };

  const submit = () => {
    if (pendingCount > 0) { toast.error(`Faltan ${pendingCount} ítem${pendingCount !== 1 ? "s" : ""} sin evaluar`); return; }
    setShowSig(true);
  };

  const mine = (user.role === "supervisor" || user.role === "operaciones") ? allCL : allCL.filter(c => c.operatorId === user.id);

  const exportCL = () => {
    const rows = mine.map(c => {
      const eq = equip.find(e => e.id === c.equipId);
      const op = users?.find(u => u.id === c.operatorId);
      return { "Equipo": eq?.code || "—", "Tipo": CHECKLIST_TEMPLATES[c.type]?.label || c.type, "Operador": c.operatorName || op?.name || "—", "Horómetro": c.horometro, "Combustible": c.fuel, "Fecha": fmtDT(c.createdAt), "Observaciones": c.issueCount || 0 };
    });
    downloadCSV(`checklists_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // ── Pantalla de firma ────────────────────────────────────────────────────────
  if (showSig) {
    return (
      <div className="p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-gray-900 font-bold text-xl">Firma del Operador</h1>
            <p className="text-gray-500 text-sm">Confirma la inspección con tu firma (opcional)</p>
          </div>
        </div>
        <div className={`${card} p-5`}>
          <SignaturePad onSave={sig => doSubmit(sig)} onCancel={() => doSubmit(null)} />
        </div>
      </div>
    );
  }

  // ── Vista lista ──────────────────────────────────────────────────────────────
  if (!editing) {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-gray-900 font-bold text-xl">Checklist Pre-Operacional</h1>
            <p className="text-gray-500 text-sm">Inspección diaria de equipos antes de operar</p>
          </div>
          <div className="flex gap-2">
            {mine.length > 0 && (
              <button onClick={exportCL} className={btnSecondary} style={{ borderColor: NV.blue, color: NV.blue, background: "white" }}>
                <FileDown size={14} />Exportar
              </button>
            )}
            {user.role === "operador" && (
              <button onClick={() => setEditing(true)} style={{ background: NV.blue }} className={btnPrimary}>
                <Plus size={15} />Nuevo Checklist
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            ["Total mes",  mine.filter(c => c.createdAt?.startsWith(thisMonth)).length,                        "text-gray-800"],
            ["Sin obs.",   mine.filter(c => c.createdAt?.startsWith(thisMonth) && !c.hasIssues).length,        "text-emerald-600"],
            ["Con obs.",   mine.filter(c => c.createdAt?.startsWith(thisMonth) &&  c.hasIssues).length,        "text-amber-600"],
          ].map(([l, v, cl]) => (
            <div key={l} className={`${card} p-4 text-center`}>
              <p className={`text-2xl font-bold ${cl}`}>{v}</p>
              <p className="text-gray-400 text-xs mt-1">{l}</p>
            </div>
          ))}
        </div>

        {mine.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Sin checklists registrados</p>
            <p className="text-sm mt-1">Completa la inspección pre-operacional antes de operar el equipo</p>
          </div>
        )}

        <div className="space-y-3">
          {[...mine].reverse().map(c => {
            const eq = equip.find(e => e.id === c.equipId);
            const op = users?.find(u => u.id === c.operatorId);
            return (
              <div key={c.id} className={`${card} p-4 flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.hasIssues ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                  {c.hasIssues ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs" style={{ color: NV.blue }}>{eq?.code}</span>
                    <span className="text-gray-600 text-xs">{eq?.name}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${c.hasIssues ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}>
                      {c.hasIssues ? `${c.issueCount} observación(es)` : "Sin observaciones"}
                    </span>
                    {c.operatorSignature && (
                      <span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200">Firmado</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{CHECKLIST_TEMPLATES[c.type]?.label || c.type} · {c.horometro?.toLocaleString()}h · Comb: {c.fuel}</p>
                  <p className="text-gray-400 text-xs">{fmtDT(c.createdAt)}{op ? ` · ${op.name}` : ""}{c.operatorName && c.operatorName !== op?.name ? ` · Op: ${c.operatorName}` : ""}</p>
                  {c.hasIssues && c.items && (
                    <div className="mt-2 space-y-0.5">
                      {c.items.filter(it => it.status !== "bueno").map((it, i) => (
                        <p key={i} className={`text-xs ${it.status === "malo" ? "text-red-600" : "text-amber-600"}`}>
                          • {it.sectionLabel}: {it.name}{it.note ? ` — ${it.note}` : ""}{it.photos?.length > 0 ? ` 📷${it.photos.length}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0">{c.items?.length || 0} ítems</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Paso 1: Identificación del equipo ────────────────────────────────────────
  if (step === 1) {
    const avEquip = tplEquip(setup.equipType);
    return (
      <div className="p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(false)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <X size={16} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-gray-900 font-bold text-xl">Nuevo Checklist</h1>
            <p className="text-gray-500 text-sm">Paso 1 de 2 — Identificación del equipo</p>
          </div>
        </div>
        <div className={`${card} p-5 space-y-4`}>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE DEL OPERADOR *</label>
            <input value={setup.operatorName} onChange={e => setSetup(s => ({ ...s, operatorName: e.target.value }))} className={iCls} placeholder="Ingresa tu nombre completo" />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-2 block">TIPO DE EQUIPO</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CHECKLIST_TEMPLATES).map(([k, v]) => (
                <button key={k} onClick={() => setSetup(s => ({ ...s, equipType: k, equipId: "" }))}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition text-left ${setup.equipType === k ? "text-blue-700 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  style={setup.equipType === k ? { borderColor: NV.blue } : {}}>
                  <p>{v.label}</p>
                  <p className="text-xs font-normal text-gray-400 mt-0.5">{v.sections.reduce((a, s) => a + s.items.length, 0)} ítems · {v.sections.length} secciones</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label>
            <select value={setup.equipId} onChange={e => setSetup(s => ({ ...s, equipId: e.target.value }))} className={sCls}>
              <option value="">Seleccionar equipo...</option>
              {avEquip.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">HORÓMETRO ACTUAL (h)</label>
              <input type="number" value={setup.horometro} onChange={e => setSetup(s => ({ ...s, horometro: e.target.value }))} className={iCls} placeholder="ej: 1250" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">NIVEL COMBUSTIBLE</label>
              <div className="flex gap-1">
                {["E", "¼", "½", "¾", "F"].map((v, i) => {
                  const vals = ["E", "1/4", "1/2", "3/4", "F"];
                  const sel = setup.fuel === vals[i];
                  return (
                    <button key={v} onClick={() => setSetup(s => ({ ...s, fuel: vals[i] }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${sel ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-500"}`}
                      style={sel ? { background: NV.blue } : {}}>{v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <button onClick={startForm}
            disabled={!setup.operatorName.trim() || !setup.equipId || !setup.horometro}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition"
            style={{ background: (!setup.operatorName.trim() || !setup.equipId || !setup.horometro) ? "#9ca3af" : NV.blue }}>
            Iniciar Inspección →
          </button>
        </div>
      </div>
    );
  }

  // ── Paso 2: Llenado de ítems ─────────────────────────────────────────────────
  const tpl = CHECKLIST_TEMPLATES[setup.equipType];
  const eqSel = equip.find(e => e.id === setup.equipId);
  const completedCount = items.filter(it => it.status !== null).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="p-6 max-w-2xl pb-32">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => setStep(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex-shrink-0">
          <ArrowRight size={16} className="text-gray-400 rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-gray-900 font-bold text-lg">{tpl.label} — {eqSel?.code}</h1>
          <p className="text-gray-500 text-xs">{completedCount}/{items.length} ítems · Horómetro: {setup.horometro}h · Op: {setup.operatorName}</p>
        </div>
        <span className="text-sm font-bold" style={{ color: pct === 100 ? "#16a34a" : NV.blue }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#16a34a" : NV.blue }} />
      </div>

      <div className="space-y-5">
        {tpl.sections.map(section => (
          <div key={section.label}>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: NV.blue }}>{section.label}</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="space-y-2">
              {section.items.map(sItem => {
                const it = items.find(x => x.id === sItem.id);
                if (!it) return null;
                const borderCl = it.status === "bueno" ? "border-l-emerald-400" : it.status === "malo" ? "border-l-red-400" : it.status === "regular" ? "border-l-amber-400" : "border-l-gray-200";
                return (
                  <div key={it.id} className={`${card} overflow-hidden border-l-4 ${borderCl}`}>
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">{it.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-semibold text-sm">{it.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{it.method}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {Object.entries(CL_STATUS).map(([s, { bg, lbl }]) => (
                            <button key={s} onClick={() => setItemStatus(it.id, s)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition border ${it.status === s ? "text-white border-transparent" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"}`}
                              style={it.status === s ? { background: bg } : {}}
                              title={s.charAt(0).toUpperCase() + s.slice(1)}>{lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(it.status === "regular" || it.status === "malo") && (
                        <div className="mt-2 space-y-2">
                          <input value={it.note} onChange={e => setItemNote(it.id, e.target.value)}
                            className={iCls + " text-xs py-1.5"}
                            placeholder="Nota / descripción del problema (opcional)..." />
                          <PhotoPicker photos={it.photos || []} onChange={p => setItemPhotos(it.id, p)} max={2} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-56 right-0 bg-white border-t border-gray-200 p-4 z-40">
        {issueItems.length > 0 && (
          <div className="rounded-lg p-2.5 mb-3 text-xs" style={{ background: NV.light, color: NV.navy, border: "1px solid #BFD9F2" }}>
            <span className="font-semibold">{issueItems.length} obs. detectada(s) — se creará solicitud automática a Operaciones: </span>
            {issueItems.map((it, i) => (
              <span key={i} className={`font-medium ${it.status === "malo" ? "text-red-600" : "text-amber-600"}`}>{i > 0 ? ", " : ""}{it.name}</span>
            ))}
          </div>
        )}
        {pendingCount > 0 && (
          <p className="text-amber-600 text-xs text-center mb-2">{pendingCount} ítem{pendingCount !== 1 ? "s" : ""} sin evaluar</p>
        )}
        <button onClick={submit} className="w-full py-3 rounded-xl text-white font-bold text-sm transition" style={{ background: NV.blue }}>
          {issueItems.length > 0 ? `Enviar Checklist + ${issueItems.length} obs. a Operaciones` : "Enviar Checklist — Sin Observaciones"}
        </button>
      </div>
    </div>
  );
}

export default ChecklistPage;
