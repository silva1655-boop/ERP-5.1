import { useState } from 'react';
import { Plus, Search, X, CheckCircle, FileWarning, Filter } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal, ModalActions } from '../components/common/Modal';
import { NV, PRI_CLS, iCls, sCls, card, btnPrimary } from '../utils/constants';
import { uid, fmtDT } from '../utils/helpers';
import toast from 'react-hot-toast';

const DEV_TYPE_LABEL = { fuera_de_programa: "Fuera de Programa", anomalia: "Anomalía Detectada", desgaste: "Desgaste / Deterioro", otro: "Otro" };
const SUBSIST_MAP    = { electrico: "Eléctrico", hidraulico: "Hidráulico", mecanico: "Mecánico", neumatico: "Neumático" };

const EMPTY_FORM = { equipId: "", title: "", type: "fuera_de_programa", subsistema: "", componente: "", description: "", priority: "media" };

export function DeviationsPage({ user, data, setData, saveData }) {
  const { requests: allReqs, equip, users, wos } = data;

  // Desvíos = solicitudes con source "inspeccion", mismo flujo que el original
  const deviations = (allReqs || []).filter(r => r.source === "inspeccion");
  const role = user.role;

  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [search, setSearch]           = useState("");
  const [fltStatus, setFltStatus]     = useState("");
  const [fltPriority, setFltPriority] = useState("");

  // Supervisor ve todos; mecánico solo los suyos
  const visible = role === "supervisor" ? deviations : deviations.filter(d => d.requestedBy === user.id);

  const filtered = visible.filter(d => {
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase()) && !d.componente?.toLowerCase().includes(search.toLowerCase())) return false;
    if (fltStatus   && d.status   !== fltStatus)   return false;
    if (fltPriority && d.priority !== fltPriority) return false;
    return true;
  });

  const anyFlt = search || fltStatus || fltPriority;

  const createDev = () => {
    if (!form.equipId || !form.title) { toast.error("Completa equipo y título"); return; }
    const nd = {
      id: uid(), ...form,
      status: "pendiente", source: "inspeccion",
      requestedBy: user.id, requestedAt: new Date().toISOString(),
      approvedBy: null, otId: null,
    };
    const updated = [...(allReqs || []), nd];
    setData(d => ({ ...d, requests: updated }));
    saveData("requests", updated);
    setShowForm(false);
    setForm(EMPTY_FORM);
    toast.success("Reporte de inspección enviado");
  };

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Reportes de Inspección</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} de {visible.length} reporte{visible.length !== 1 ? "s" : ""} · {visible.filter(d => d.status === "pendiente").length} pendiente{visible.filter(d => d.status === "pendiente").length !== 1 ? "s" : ""}
          </p>
        </div>
        {role === "mecanico" && (
          <button onClick={() => setShowForm(true)} style={{ background: NV.blue }} className={btnPrimary}>
            <Plus size={15} />Nuevo Reporte
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o componente..."
            className={iCls + " pl-9"} />
        </div>
        <select value={fltStatus} onChange={e => setFltStatus(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
          <option value="">Estado: Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada (OT generada)</option>
          <option value="revisado">Revisado</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <select value={fltPriority} onChange={e => setFltPriority(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
          <option value="">Prioridad: Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        {anyFlt && (
          <button onClick={() => { setSearch(""); setFltStatus(""); setFltPriority(""); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg transition">
            <X size={11} />Limpiar
          </button>
        )}
      </div>

      {/* Estados vacíos */}
      {visible.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileWarning size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Sin reportes de inspección</p>
          {role === "mecanico" && <p className="text-sm mt-1">Crea un nuevo reporte desde la inspección de un equipo</p>}
        </div>
      )}
      {filtered.length === 0 && visible.length > 0 && (
        <div className="text-center py-10 text-gray-400">
          <Filter size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Sin resultados para los filtros seleccionados</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(d => {
          const eq       = equip.find(e => e.id === d.equipId);
          const repBy    = users?.find(u => u.id === d.requestedBy);
          const linkedOT = (wos || []).find(w => w.id === d.otId);
          return (
            <div key={d.id} className={`bg-white border rounded-xl p-5 shadow-sm ${
              d.status === "pendiente" ? "border-amber-300" :
              d.status === "aprobada"  ? "border-emerald-300" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge s={d.status} />
                <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[d.priority]}`}>
                  {d.priority.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full border text-xs font-medium text-gray-600 bg-gray-50 border-gray-200">
                  {DEV_TYPE_LABEL[d.type] || d.type}
                </span>
              </div>

              <p className="text-gray-800 font-semibold text-sm mb-1">{d.title}</p>

              {(d.subsistema || d.componente) && (
                <div className="flex items-center gap-3 mb-1 text-xs flex-wrap">
                  {d.subsistema && (
                    <><span className="text-gray-400">Subsistema:</span>
                    <span className="font-medium text-gray-700">{SUBSIST_MAP[d.subsistema] || d.subsistema}</span></>
                  )}
                  {d.componente && (
                    <><span className="text-gray-300">|</span>
                    <span className="text-gray-400">Componente:</span>
                    <span className="font-medium text-gray-700">{d.componente}</span></>
                  )}
                </div>
              )}

              {d.description && (
                <p className="text-gray-500 text-xs mb-2 leading-relaxed line-clamp-3">{d.description}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                <span className="font-mono font-bold" style={{ color: NV.blue }}>{eq?.code || "—"}</span>
                <span>·</span><span>{eq?.name || "—"}</span>
                <span>·</span><span>{repBy?.name || "—"}</span>
                <span>·</span><span>{fmtDT(d.requestedAt)}</span>
              </div>

              {linkedOT && (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                    <CheckCircle size={11} />OT Generada: {linkedOT.code}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span><span className="text-gray-400">Estado: </span><Badge s={linkedOT.status} /></span>
                    {users?.find(u => u.id === linkedOT.assignedTo) && (
                      <span><span className="text-gray-400">Mecánico: </span>{users.find(u => u.id === linkedOT.assignedTo)?.name}</span>
                    )}
                    {linkedOT.actualHours && (
                      <span><span className="text-gray-400">Horas reales: </span>
                      <span className="font-semibold text-emerald-700">{linkedOT.actualHours}h</span></span>
                    )}
                  </div>
                  {linkedOT.observations && (
                    <p className="text-xs text-gray-600 pt-1 border-t border-emerald-100 mt-1">
                      <span className="text-gray-400 font-medium">Observaciones: </span>{linkedOT.observations}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal nuevo reporte */}
      {showForm && (
        <Modal title="Nuevo Reporte de Inspección" onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
          <div className="space-y-3">
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label>
              <select value={form.equipId} onChange={e => setForm(f => ({ ...f, equipId: e.target.value }))} className={sCls}>
                <option value="">Seleccionar...</option>
                {equip.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">TIPO DE DESVIACIÓN</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={sCls}>
                <option value="fuera_de_programa">Fuera de Programa</option>
                <option value="anomalia">Anomalía Detectada</option>
                <option value="desgaste">Desgaste / Deterioro</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label>
              <select value={form.subsistema} onChange={e => setForm(f => ({ ...f, subsistema: e.target.value }))} className={sCls}>
                <option value="">Seleccionar...</option>
                <option value="electrico">Eléctrico</option>
                <option value="hidraulico">Hidráulico</option>
                <option value="mecanico">Mecánico</option>
                <option value="neumatico">Neumático</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label>
              <input value={form.componente} onChange={e => setForm(f => ({ ...f, componente: e.target.value }))} className={iCls} placeholder="ej: Motor, Válvula, Sensor..." />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">TÍTULO / HALLAZGO *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={iCls} placeholder="Descripción breve del hallazgo" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN DE LA FALLA</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={iCls + " resize-none"} placeholder="Describe la desviación encontrada..." />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={sCls}>
                <option value="alta">Alta — Requiere atención inmediata</option>
                <option value="media">Media — Afecta rendimiento</option>
                <option value="baja">Baja — Sin impacto inmediato</option>
              </select>
            </div>
          </div>
          <ModalActions onSave={createDev} onCancel={() => { setShowForm(false); setForm(EMPTY_FORM); }} label="Enviar Reporte" />
        </Modal>
      )}
    </div>
  );
}

export default DeviationsPage;
