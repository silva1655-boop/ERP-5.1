import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/modals/Modal';
import FormField, { inputClass } from '../components/forms/FormField';
import Toast from '../components/common/Toast';
import EntityPage from './EntityPage';
import MaintenancePlanImport from '../components/maintenance/MaintenancePlanImport';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePermissions } from '../hooks/usePermissions';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { updateDocument } from '../services/firestoreService';
import { createWorkOrderAssignmentNotification } from '../services/notificationService';
import { handleError } from '../utils/errorHandler';
import { PRIORITIES } from '../utils/constants';

const planningColumns = [
  { key: 'en_planificacion', label: 'OT en planificación' },
  { key: 'programada', label: 'OT programadas' },
  { key: 'en_curso', label: 'OT en curso' },
  { key: 'pausada', label: 'OT pausadas' },
];

function PlanningBoard() {
  const { companyId, user } = useAuth();
  const { data: workOrders, loading } = useFirestoreCollection('workOrders', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 150 });
  const { data: users } = useFirestoreCollection('users', { orderBy: { field: 'name', direction: 'asc' } });
  const mechanics = users.filter(item => item.role === 'mecanico' && item.active !== false && item.active !== 'false');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ assignedToId: '', dueDate: '', priority: 'media' });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const grouped = useMemo(() => planningColumns.reduce((acc, column) => ({ ...acc, [column.key]: workOrders.filter(item => item.status === column.key) }), {}), [workOrders]);

  const open = ot => {
    setSelected(ot);
    setForm({ assignedToId: ot.assignedToId || ot.assignedTo || '', dueDate: ot.dueDate || '', priority: ot.priority || 'media' });
  };

  const save = async () => {
    const mechanic = mechanics.find(item => (item.uid || item.id) === form.assignedToId);
    const payload = {
      assignedToId: form.assignedToId,
      assignedTo: form.assignedToId,
      assignedToName: mechanic?.name || mechanic?.email || '',
      assignedToEmail: mechanic?.email || '',
      dueDate: form.dueDate,
      priority: form.priority,
      status: form.assignedToId && form.dueDate ? 'programada' : 'en_planificacion',
    };
    setSaving(true);
    try {
      await updateDocument(companyId, 'workOrders', selected.id, payload, user);
      if (payload.status === 'programada') await createWorkOrderAssignmentNotification(companyId, { ...selected, ...payload }, user);
      setToast({ type: 'success', message: payload.status === 'programada' ? 'OT programada y notificada al mecánico.' : 'OT actualizada en planificación.' });
      setSelected(null);
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState/>;

  return <section className="space-y-4">
    <div><h3 className="text-lg font-bold text-slate-900">Planificación de trabajos</h3><p className="text-sm text-slate-500">Asigna técnico, fecha compromiso y prioridad para mover OT a programada.</p></div>
    <div className="grid gap-4 xl:grid-cols-4">{planningColumns.map(column => <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-bold text-slate-800">{column.label}</h4><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{grouped[column.key]?.length || 0}</span></div><div className="space-y-3">{grouped[column.key]?.length ? grouped[column.key].map(ot => <article key={ot.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-900">{ot.folio || ot.id}</p><p className="text-xs text-slate-500">{ot.equipmentCode || ot.equipmentName || 'Equipo'} · {ot.title || 'OT'}</p></div><Badge value={ot.priority}/></div><p className="mt-2 text-xs text-slate-600"><b>Técnico:</b> {ot.assignedToName || ot.assignedTo || 'Sin asignar'}</p><p className="text-xs text-slate-600"><b>Fecha compromiso:</b> {ot.dueDate || 'Sin fecha'}</p><button className="mt-3 w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => open(ot)}>Planificar</button></article>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Sin OT en este estado.</p>}</div></div>)}</div>
    {selected && <Modal title={`Planificar OT ${selected.folio || ''}`} onClose={() => setSelected(null)}><div className="space-y-3"><FormField label="Técnico responsable"><select className={inputClass} value={form.assignedToId} onChange={event => setForm({ ...form, assignedToId: event.target.value })}><option value="">Sin técnico</option>{mechanics.map(item => <option key={item.uid || item.id} value={item.uid || item.id}>{item.name || item.email} · {item.email || 'sin email'}</option>)}</select></FormField><FormField label="Fecha compromiso"><input className={inputClass} type="date" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })}/></FormField><FormField label="Prioridad"><select className={inputClass} value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{PRIORITIES.map(priority => <option key={priority} value={priority}>{priority}</option>)}</select></FormField><div className="flex justify-end gap-2"><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={() => setSelected(null)}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={save}>{saving ? 'Guardando...' : 'Guardar planificación'}</button></div></div></Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}

export default function MaintenancePlansPage({ navigationKey }){
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  if (navigationKey === 'planning' && canAny(['planning.view', 'planning.manage', 'workOrders.manage'])) return <PlanningBoard/>;
  return <div className="space-y-4"><div className="flex justify-end"><MaintenancePlanImport companyId={companyId} user={user} canImport={canAny(['maintenancePlans.import', 'maintenancePlans.manage'])}/></div><EntityPage type="maintenancePlans"/></div>;
}
import EntityPage from './EntityPage';
export default function MaintenancePlansPage(){ return <EntityPage type="maintenancePlans"/>; }
