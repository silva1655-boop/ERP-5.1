import { useState } from "react";
import { Plus, Search, Eye, FileWarning, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, iCls, sCls, card, btnPrimary } from "../utils/constants";
import { uid, fmt } from "../utils/helpers";
import toast from "react-hot-toast";

const SEVERITY = {
  baja:  { label: "Baja",  cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  media: { label: "Media", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  alta:  { label: "Alta",  cls: "text-red-700 bg-red-50 border-red-200" },
};

const EMPTY_DEV = { title: "", description: "", equipId: "", location: "", severity: "media", status: "abierta", date: new Date().toISOString().slice(0, 10) };

export function DeviationsPage({ user, data, setData, saveData }) {
  const { equip } = data;
  const devs = data.deviations || [];
  const isSup = user.role === "supervisor" || user.role === "mecanico";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_DEV);
  const [viewDev, setViewDev] = useState(null);

  const visible = devs.filter(d => {
    const matchSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todas" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setForm(EMPTY_DEV); setEditTarget(null); setShowForm(true); };
  const openEdit = d => { setForm({ ...d }); setEditTarget(d); setShowForm(true); };

  const saveDev = () => {
    if (!form.title || !form.description) { toast.error("Título y descripción son requeridos"); return; }
    const entry = {
      ...form,
      id: editTarget?.id || uid(),
      reportedBy: editTarget ? form.reportedBy : user.id,
      reportedByName: editTarget ? form.reportedByName : user.name,
      createdAt: editTarget ? form.createdAt : new Date().toISOString(),
    };
    const updated = editTarget
      ? devs.map(d => d.id === editTarget.id ? entry : d)
      : [...devs, entry];
    setData(d2 => ({ ...d2, deviations: updated }));
    saveData("deviations", updated);
    setShowForm(false);
    toast.success(editTarget ? "Reporte actualizado" : "Reporte creado");
  };

  const closeDeviation = id => {
    const updated = devs.map(d => d.id === id ? { ...d, status: "cerrada", closedAt: new Date().toISOString(), closedBy: user.name } : d);
    setData(d2 => ({ ...d2, deviations: updated }));
    saveData("deviations", updated);
    setViewDev(null);
    toast.success("Reporte cerrado");
  };

  const statusCounts = {
    abierta: devs.filter(d => d.status === "abierta").length,
    en_proceso: devs.filter(d => d.status === "en_proceso").length,
    cerrada: devs.filter(d => d.status === "cerrada").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Reportes de Inspección</h1>
          <p className="text-gray-500 text-sm">{devs.length} reportes registrados</p>
        </div>
        <button onClick={openNew} style={{ background: NV.blue }} className={btnPrimary}>
          <Plus size={15}/>Nuevo Reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[["abierta","Abiertos","text-red-600"],["en_proceso","En Proceso","text-amber-600"],["cerrada","Cerrados","text-emerald-600"]].map(([s, l, c]) => (
          <div key={s} className={`${card} p-4 text-center cursor-pointer ${statusFilter === s ? "ring-2 ring-blue-400" : ""}`} onClick={() => setStatusFilter(statusFilter === s ? "todas" : s)}>
            <p className={`text-2xl font-bold ${c}`}>{statusCounts[s]}</p>
            <p className="text-gray-500 text-xs mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className={iCls + " pl-9"}/>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none">
          <option value="todas">Todos los estados</option>
          <option value="abierta">Abiertos</option>
          <option value="en_proceso">En Proceso</option>
          <option value="cerrada">Cerrados</option>
        </select>
      </div>

      {/* List */}
      {visible.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <FileWarning size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-400 text-sm">No hay reportes que coincidan</p>
        </div>
      )}
      <div className="space-y-3">
        {visible.map(d => {
          const eq = equip.find(e => e.id === d.equipId);
          return (
            <div key={d.id} className={`${card} p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition`} onClick={() => setViewDev(d)}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${d.status === "cerrada" ? "bg-emerald-100" : d.severity === "alta" ? "bg-red-100" : "bg-amber-100"}`}>
                {d.status === "cerrada" ? <CheckCircle size={14} className="text-emerald-600"/> : <AlertTriangle size={14} className={d.severity === "alta" ? "text-red-600" : "text-amber-600"}/>}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-gray-800">{d.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY[d.severity]?.cls || ""}`}>{SEVERITY[d.severity]?.label}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{d.description}</p>
                <p className="text-xs text-gray-400 mt-1">{eq ? `${eq.code} — ${eq.name}` : d.location || "Sin equipo"} · {fmt(d.date)} · {d.reportedByName}</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${d.status === "cerrada" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : d.status === "en_proceso" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                  {d.status === "abierta" ? "Abierto" : d.status === "en_proceso" ? "En Proceso" : "Cerrado"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <Modal title={editTarget ? "Editar Reporte" : "Nuevo Reporte de Inspección"} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-gray-500 text-xs font-medium mb-1 block">TÍTULO</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={iCls}/>
            </div>
            <div className="col-span-2">
              <label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={iCls}/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO (opcional)</label>
              <select value={form.equipId} onChange={e => setForm(f => ({ ...f, equipId: e.target.value }))} className={sCls}>
                <option value="">Sin equipo</option>
                {equip.map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">UBICACIÓN</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={iCls}/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">SEVERIDAD</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className={sCls}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">ESTADO</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={sCls}>
                <option value="abierta">Abierto</option>
                <option value="en_proceso">En Proceso</option>
                <option value="cerrada">Cerrado</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">FECHA</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={iCls}/>
            </div>
          </div>
          <ModalActions onSave={saveDev} onCancel={() => setShowForm(false)} label={editTarget ? "Guardar Cambios" : "Crear Reporte"}/>
        </Modal>
      )}

      {/* View Modal */}
      {viewDev && (
        <Modal title="Detalle del Reporte" onClose={() => setViewDev(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY[viewDev.severity]?.cls}`}>{SEVERITY[viewDev.severity]?.label} severidad</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${viewDev.status === "cerrada" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : viewDev.status === "en_proceso" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                {viewDev.status === "abierta" ? "Abierto" : viewDev.status === "en_proceso" ? "En Proceso" : "Cerrado"}
              </span>
            </div>
            <h3 className="font-bold text-gray-900">{viewDev.title}</h3>
            <p className="text-gray-600 text-sm">{viewDev.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <div><span className="font-medium">Equipo:</span> {equip.find(e => e.id === viewDev.equipId)?.code || "—"}</div>
              <div><span className="font-medium">Ubicación:</span> {viewDev.location || "—"}</div>
              <div><span className="font-medium">Reportado por:</span> {viewDev.reportedByName}</div>
              <div><span className="font-medium">Fecha:</span> {fmt(viewDev.date)}</div>
              {viewDev.closedAt && <div className="col-span-2"><span className="font-medium">Cerrado:</span> {fmt(viewDev.closedAt)} por {viewDev.closedBy}</div>}
            </div>
            <div className="flex gap-2 pt-2">
              {isSup && viewDev.status !== "cerrada" && (
                <button onClick={() => closeDeviation(viewDev.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                  Marcar como Cerrado
                </button>
              )}
              {isSup && (
                <button onClick={() => { setViewDev(null); openEdit(viewDev); }} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition">
                  Editar
                </button>
              )}
              <button onClick={() => setViewDev(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-200 transition">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DeviationsPage;
