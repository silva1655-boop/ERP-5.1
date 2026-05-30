import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Check, X, Gauge } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, CRIT_CLS, CRIT_LABEL, iCls, sCls, card, btnPrimary } from "../utils/constants";
import { uid, fmt } from "../utils/helpers";
import toast from "react-hot-toast";

const EMPTY_EQ = { code: "", name: "", type: "", location: "", criticality: "B", status: "operativo", hours: "", lastMaint: "", nextMaint: "" };
const EQ_GROUPS = ["Mol","Kalmar","Terberg","Liftec","Grúa","Otros"];
const getGroup = e => {
  if (e.code.startsWith("MOL")) return "Mol";
  if (e.code.startsWith("KAL")) return "Kalmar";
  if (e.code.startsWith("TER")) return "Terberg";
  if (e.code.startsWith("LIF")) return "Liftec";
  if (e.code.startsWith("GRU")) return "Grúa";
  return "Otros";
};

export function EquipmentPage({ user, data, setData, saveData }) {
  const { equip } = data;
  const isSup = user.role === "supervisor";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_EQ);
  const [confirmDel, setConfirmDel] = useState(null);
  const [editingHours, setEditingHours] = useState(null);

  const visible = equip.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase()));
  const grouped = EQ_GROUPS.map(g => ({ group: g, items: visible.filter(e => getGroup(e) === g) })).filter(g => g.items.length > 0);

  const openNew = () => { setForm(EMPTY_EQ); setEditTarget(null); setShowForm(true); };
  const openEdit = e => { setForm({ ...e, hours: String(e.hours) }); setEditTarget(e); setShowForm(true); };

  const saveEquip = () => {
    if (!form.code || !form.name) { toast.error("Código y nombre son requeridos"); return; }
    const updated = editTarget
      ? equip.map(e => e.id === editTarget.id ? { ...e, ...form, hours: parseInt(form.hours) || 0 } : e)
      : [...equip, { id: uid(), ...form, hours: parseInt(form.hours) || 0, lastMaint: form.lastMaint || new Date().toISOString().slice(0, 10) }];
    setData(d => ({ ...d, equip: updated })); saveData("equipment", updated); setShowForm(false);
    toast.success(editTarget ? "Equipo actualizado" : "Equipo creado");
  };

  const deleteEquip = id => { const updated = equip.filter(e => e.id !== id); setData(d => ({ ...d, equip: updated })); saveData("equipment", updated); setConfirmDel(null); toast.success("Equipo eliminado"); };

  const saveHours = () => {
    if (!editingHours) return;
    const val = parseInt(editingHours.val) || 0;
    const updated = equip.map(e => e.id === editingHours.id ? { ...e, hours: val } : e);
    setData(d => ({ ...d, equip: updated })); saveData("equipment", updated); setEditingHours(null);
    toast.success("Horómetro actualizado");
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Equipos</h1><p className="text-gray-500 text-sm">{equip.length} equipos registrados</p></div>
        {isSup && <button onClick={openNew} style={{ background: NV.blue }} className={btnPrimary}><Plus size={15}/>Nuevo Equipo</button>}
      </div>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." className={iCls + " pl-9 max-w-xs"}/>
      </div>
      <div className="space-y-6">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-5 rounded-full" style={{ background: NV.blue }}/>
              <h2 className="font-bold text-sm" style={{ color: NV.navy }}>{group}</h2>
              <span className="text-gray-400 text-xs">({items.length} equipos)</span>
            </div>
            <div className={`${card} overflow-hidden`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-white font-semibold uppercase tracking-wider" style={{ background: NV.navyMid }}>
                    <th className="text-left px-4 py-2.5">Código</th>
                    <th className="text-left px-4 py-2.5">Nombre</th>
                    <th className="text-left px-4 py-2.5 hidden md:table-cell">Ubicación</th>
                    <th className="text-left px-4 py-2.5">Criticidad</th>
                    <th className="text-left px-4 py-2.5">Estado</th>
                    <th className="text-left px-4 py-2.5"><span className="flex items-center gap-1"><Gauge size={11}/>Horómetro</span></th>
                    <th className="text-left px-4 py-2.5 hidden lg:table-cell">Próx. Mant.</th>
                    {isSup && <th className="px-4 py-2.5 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((e, i) => {
                    const isEditingThis = editingHours?.id === e.id;
                    return (
                      <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                        <td className="px-4 py-2.5"><span className="font-mono font-bold text-xs" style={{ color: NV.blue }}>{e.code}</span></td>
                        <td className="px-4 py-2.5 text-gray-800 font-medium text-sm">{e.name}</td>
                        <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">{e.location}</td>
                        <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{CRIT_LABEL[e.criticality]}</span></td>
                        <td className="px-4 py-2.5"><Badge s={e.status}/></td>
                        <td className="px-4 py-2.5">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1">
                              <input type="number" value={editingHours.val} onChange={e2 => setEditingHours(h => ({ ...h, val: e2.target.value }))}
                                onKeyDown={e2 => { if (e2.key === "Enter") saveHours(); if (e2.key === "Escape") setEditingHours(null); }}
                                className="w-24 border border-blue-400 rounded-lg px-2 py-1 text-gray-900 text-xs focus:outline-none" autoFocus/>
                              <button onClick={saveHours} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: NV.blue }}><Check size={11} className="text-white"/></button>
                              <button onClick={() => setEditingHours(null)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"><X size={11} className="text-gray-600"/></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="text-gray-700 font-mono text-sm font-semibold">{e.hours.toLocaleString()}<span className="text-gray-400 text-xs ml-0.5">h</span></span>
                              {isSup && <button onClick={() => setEditingHours({ id: e.id, val: String(e.hours) })} className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-blue-50"><Edit2 size={11} style={{ color: NV.blue }}/></button>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500 text-xs">{fmt(e.nextMaint)}</td>
                        {isSup && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 transition" style={{ color: NV.blue }}><Edit2 size={13}/></button>
                              <button onClick={() => setConfirmDel(e)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={13}/></button>
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

      {showForm && (
        <Modal title={editTarget ? "Editar Equipo" : "Nuevo Equipo"} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            {[["code","CÓDIGO"],["name","NOMBRE"],["type","TIPO"],["location","UBICACIÓN"]].map(([k, l]) => (
              <div key={k}><label className="text-gray-500 text-xs font-medium mb-1 block">{l}</label><input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className={iCls}/></div>
            ))}
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">CRITICIDAD</label>
              <select value={form.criticality} onChange={e => setForm(f => ({ ...f, criticality: e.target.value }))} className={sCls}>
                <option value="A">A — Crítico</option><option value="B">B — Importante</option><option value="C">C — Rutinario</option>
              </select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ESTADO</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={sCls}>
                <option value="operativo">Operativo</option><option value="mantenimiento">Mantenimiento</option><option value="falla">Falla</option>
              </select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">HORÓMETRO (h)</label><input type="number" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} className={iCls}/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRÓX. MANTENCIÓN</label><input type="date" value={form.nextMaint} onChange={e => setForm(f => ({ ...f, nextMaint: e.target.value }))} className={iCls}/></div>
            <div className="col-span-2"><label className="text-gray-500 text-xs font-medium mb-1 block">ÚLTIMO MANTENCIÓN</label><input type="date" value={form.lastMaint} onChange={e => setForm(f => ({ ...f, lastMaint: e.target.value }))} className={iCls}/></div>
          </div>
          <ModalActions onSave={saveEquip} onCancel={() => setShowForm(false)} label={editTarget ? "Guardar Cambios" : "Crear Equipo"}/>
        </Modal>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0"><Trash2 size={18} className="text-red-600"/></div>
              <div><p className="text-gray-900 font-bold text-sm">Eliminar {confirmDel.code}</p><p className="text-gray-500 text-xs">{confirmDel.name}</p></div>
            </div>
            <p className="text-gray-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteEquip(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm transition">Eliminar</button>
              <button onClick={() => setConfirmDel(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentPage;
