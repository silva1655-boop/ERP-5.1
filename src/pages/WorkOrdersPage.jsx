import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/modals/Modal';
import FormField, { inputClass } from '../components/forms/FormField';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate } from '../utils/dates';
import { handleError } from '../utils/errorHandler';
import {
  closeWorkOrderTechnically,
  finishWorkOrder,
  isWorkOrderAssignedToUser,
  pauseWorkOrder,
  reopenWorkOrder,
  resumeWorkOrder,
  startWorkOrder,
} from '../services/workOrderExecutionService';
import EntityPage from './EntityPage';

const pauseReasons = ['espera_repuesto', 'espera_tercero', 'equipo_no_disponible', 'falta_informacion', 'seguridad', 'otro'];
const finalEquipmentStatuses = ['operativo', 'observado', 'fuera_servicio', 'mantenimiento'];
const mechanicViews = {
  myWorkOrders: {
    title: 'Mis Órdenes de Trabajo',
    description: 'OT asignadas listas para iniciar trabajo.',
    statuses: ['programada', 'en_planificacion', 'pausada'],
  },
  workOrderExecution: {
    title: 'Ejecución de OT',
    description: 'Trabajos en curso o pausados bajo tu responsabilidad.',
    statuses: ['en_curso', 'pausada'],
  },
  workHistory: {
    title: 'Historial de Trabajos',
    description: 'OT finalizadas, cerradas o canceladas. Vista solo lectura.',
    statuses: ['finalizada_mecanico', 'cerrada_supervisor', 'cancelada'],
  },
};

function WorkOrderDetail({ workOrder }) {
  return <div className="space-y-3 text-sm text-slate-700">
    <div className="grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-2">
      <p><b>Folio:</b> {workOrder.folio || workOrder.id}</p>
      <p><b>Estado:</b> <Badge value={workOrder.status}/></p>
      <p><b>Equipo:</b> {workOrder.equipmentCode || workOrder.equipmentName || '—'}</p>
      <p><b>Prioridad:</b> <Badge value={workOrder.priority}/></p>
      <p><b>Técnico:</b> {workOrder.assignedToName || workOrder.assignedToEmail || workOrder.assignedTo || '—'}</p>
      <p><b>Fecha compromiso:</b> {workOrder.dueDate || '—'}</p>
    </div>
    <p><b>Título:</b> {workOrder.title || '—'}</p>
    <p><b>Descripción:</b> {workOrder.description || '—'}</p>
    {workOrder.pauseComment && <p><b>Pausa:</b> {workOrder.pauseReason} · {workOrder.pauseComment}</p>}
    {workOrder.mechanicDiagnosis && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p><b>Diagnóstico:</b> {workOrder.mechanicDiagnosis}</p><p><b>Trabajo realizado:</b> {workOrder.workPerformed}</p><p><b>HH:</b> {workOrder.laborHours || 0}</p><p><b>Estado final equipo:</b> {workOrder.finalEquipmentStatus || '—'}</p><p><b>Observaciones finales:</b> {workOrder.mechanicFinalComments || '—'}</p></div>}
  </div>;
}

function WorkOrderCard({ workOrder, actions }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-bold text-slate-900">{workOrder.folio || workOrder.id}</p><p className="text-xs text-slate-500">{workOrder.equipmentCode || workOrder.equipmentName || 'Equipo'} · {workOrder.title || 'OT'}</p></div>
      <Badge value={workOrder.status}/>
    </div>
    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p><b>Prioridad:</b> {workOrder.priority || '—'}</p><p><b>Fecha:</b> {workOrder.dueDate || '—'}</p><p><b>Asignado:</b> {workOrder.assignedToName || '—'}</p><p><b>Actualizado:</b> {formatDate(workOrder.updatedAt || workOrder.createdAt)}</p></div>
    <div className="mt-4 flex flex-wrap justify-end gap-2">{actions}</div>
  </article>;
}

function MechanicWorkOrdersView({ navigationKey }) {
  const { companyId, user } = useAuth();
  const { data: workOrders, loading } = useFirestoreCollection('workOrders', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 200 });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pauseForm, setPauseForm] = useState({ reason: pauseReasons[0], comment: '' });
  const [finishForm, setFinishForm] = useState({ mechanicDiagnosis: '', workPerformed: '', laborHours: '', finalEquipmentStatus: 'operativo', mechanicFinalComments: '', usedParts: '', futureRecommendation: '', evidenceFile: null });
  const view = mechanicViews[navigationKey] || mechanicViews.myWorkOrders;
  const rows = useMemo(() => workOrders.filter(item => isWorkOrderAssignedToUser(item, user) && view.statuses.includes(item.status)), [workOrders, user, view.statuses]);

  const runAction = async action => {
    setSaving(true);
    try {
      await action();
      setToast({ type: 'success', message: 'OT actualizada correctamente.' });
      setSelected(null);
      setMode('');
      setPauseForm({ reason: pauseReasons[0], comment: '' });
      setFinishForm({ mechanicDiagnosis: '', workPerformed: '', laborHours: '', finalEquipmentStatus: 'operativo', mechanicFinalComments: '', usedParts: '', futureRecommendation: '', evidenceFile: null });
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setSaving(false);
    }
  };

  const start = workOrder => runAction(() => startWorkOrder(companyId, workOrder, user));
  const resume = workOrder => runAction(() => resumeWorkOrder(companyId, workOrder, user));
  const pause = () => {
    if (!pauseForm.comment.trim()) { setToast({ type: 'error', message: 'Debe ingresar comentario de pausa.' }); return; }
    runAction(() => pauseWorkOrder(companyId, selected, pauseForm, user));
  };
  const finish = () => {
    if (!finishForm.mechanicDiagnosis.trim() || !finishForm.workPerformed.trim() || !finishForm.laborHours || !finishForm.mechanicFinalComments.trim()) {
      setToast({ type: 'error', message: 'Diagnóstico, trabajo realizado, HH y observaciones finales son obligatorios.' });
      return;
    }
    runAction(() => finishWorkOrder(companyId, selected, finishForm, user));
  };

  if (loading) return <LoadingState/>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{view.title}</h3><p className="text-sm text-slate-500">{view.description}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{rows.length} OT</span></div>
    <div className="grid gap-4 xl:grid-cols-2">{rows.length ? rows.map(workOrder => <WorkOrderCard key={workOrder.id} workOrder={workOrder} actions={<>
      <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => { setSelected(workOrder); setMode('detail'); }}>Ver detalle</button>
      {navigationKey === 'myWorkOrders' && ['programada', 'en_planificacion'].includes(workOrder.status) && <button className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => start(workOrder)}>Iniciar trabajo</button>}
      {navigationKey === 'workOrderExecution' && workOrder.status === 'en_curso' && <button className="rounded-xl border border-orange-200 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50" onClick={() => { setSelected(workOrder); setMode('pause'); }}>Pausar trabajo</button>}
      {navigationKey === 'workOrderExecution' && workOrder.status === 'pausada' && <button className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => resume(workOrder)}>Reanudar trabajo</button>}
      {navigationKey === 'workOrderExecution' && workOrder.status === 'en_curso' && <button className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => { setSelected(workOrder); setMode('finish'); }}>Finalizar trabajo</button>}
    </>}/>) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No hay OT para esta vista.</p>}</div>
    {selected && mode === 'detail' && <Modal title={`Detalle OT ${selected.folio || ''}`} onClose={() => setSelected(null)} wide><WorkOrderDetail workOrder={selected}/></Modal>}
    {selected && mode === 'pause' && <Modal title="Pausar trabajo" onClose={() => setSelected(null)}><div className="space-y-3"><FormField label="Motivo de pausa"><select className={inputClass} value={pauseForm.reason} onChange={event => setPauseForm({ ...pauseForm, reason: event.target.value })}>{pauseReasons.map(reason => <option key={reason} value={reason}>{reason.replaceAll('_', ' ')}</option>)}</select></FormField><FormField label="Comentario obligatorio"><textarea className={inputClass} rows="3" value={pauseForm.comment} onChange={event => setPauseForm({ ...pauseForm, comment: event.target.value })}/></FormField><div className="flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm font-bold" onClick={() => setSelected(null)}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={pause}>Guardar pausa</button></div></div></Modal>}
    {selected && mode === 'finish' && <Modal title="Finalizar trabajo" onClose={() => setSelected(null)} wide><div className="grid gap-3 md:grid-cols-2"><FormField label="Diagnóstico final"><textarea className={inputClass} rows="3" value={finishForm.mechanicDiagnosis} onChange={event => setFinishForm({ ...finishForm, mechanicDiagnosis: event.target.value })}/></FormField><FormField label="Trabajo realizado"><textarea className={inputClass} rows="3" value={finishForm.workPerformed} onChange={event => setFinishForm({ ...finishForm, workPerformed: event.target.value })}/></FormField><FormField label="Horas hombre utilizadas"><input className={inputClass} type="number" min="0" step="0.25" value={finishForm.laborHours} onChange={event => setFinishForm({ ...finishForm, laborHours: event.target.value })}/></FormField><FormField label="Estado final del equipo"><select className={inputClass} value={finishForm.finalEquipmentStatus} onChange={event => setFinishForm({ ...finishForm, finalEquipmentStatus: event.target.value })}>{finalEquipmentStatuses.map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></FormField><FormField label="Repuestos utilizados"><textarea className={inputClass} rows="2" value={finishForm.usedParts} onChange={event => setFinishForm({ ...finishForm, usedParts: event.target.value })}/></FormField><FormField label="Evidencia fotográfica"><input className={inputClass} type="file" accept="image/*" onChange={event => setFinishForm({ ...finishForm, evidenceFile: event.target.files?.[0] || null })}/></FormField><div className="md:col-span-2"><FormField label="Observaciones finales"><textarea className={inputClass} rows="3" value={finishForm.mechanicFinalComments} onChange={event => setFinishForm({ ...finishForm, mechanicFinalComments: event.target.value })}/></FormField></div><div className="md:col-span-2"><FormField label="Recomendación futura"><textarea className={inputClass} rows="2" value={finishForm.futureRecommendation} onChange={event => setFinishForm({ ...finishForm, futureRecommendation: event.target.value })}/></FormField></div><div className="flex justify-end gap-2 md:col-span-2"><button className="rounded-xl border px-4 py-2 text-sm font-bold" onClick={() => setSelected(null)}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={finish}>Finalizar trabajo</button></div></div></Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}

function SupervisorFinishedWorkReview() {
  const { companyId, user } = useAuth();
  const { data: workOrders, loading } = useFirestoreCollection('workOrders', { orderBy: { field: 'updatedAt', direction: 'desc' }, limit: 100 });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [comment, setComment] = useState('');
  const [reopenStatus, setReopenStatus] = useState('programada');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const finished = workOrders.filter(item => item.status === 'finalizada_mecanico');

  const submit = async () => {
    if (!comment.trim()) { setToast({ type: 'error', message: mode === 'close' ? 'El comentario de cierre es obligatorio.' : 'El comentario de reapertura es obligatorio.' }); return; }
    setSaving(true);
    try {
      if (mode === 'close') await closeWorkOrderTechnically(companyId, selected, comment, user);
      else await reopenWorkOrder(companyId, selected, { status: reopenStatus, comment }, user);
      setToast({ type: 'success', message: mode === 'close' ? 'OT cerrada técnicamente.' : 'OT reabierta y notificada al mecánico.' });
      setSelected(null); setMode(''); setComment('');
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState/>;

  return <section className="mb-5 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold text-slate-900">OT finalizadas por mecánico</h3><p className="text-sm text-slate-600">Revisa, cierra técnicamente o reabre trabajos incompletos.</p></div><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-emerald-700">{finished.length} pendientes</span></div>
    <div className="grid gap-3 xl:grid-cols-2">{finished.length ? finished.map(workOrder => <WorkOrderCard key={workOrder.id} workOrder={workOrder} actions={<><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => { setSelected(workOrder); setMode('detail'); }}>Revisar</button><button className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700" onClick={() => { setSelected(workOrder); setMode('close'); }}>Cerrar técnicamente</button><button className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700" onClick={() => { setSelected(workOrder); setMode('reopen'); }}>Reabrir</button></>}/>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">No hay trabajos esperando cierre técnico.</p>}</div>
    {selected && mode === 'detail' && <Modal title={`Revisión OT ${selected.folio || ''}`} onClose={() => setSelected(null)} wide><WorkOrderDetail workOrder={selected}/></Modal>}
    {selected && ['close', 'reopen'].includes(mode) && <Modal title={mode === 'close' ? 'Cerrar técnicamente' : 'Reabrir OT'} onClose={() => setSelected(null)}><div className="space-y-3">{mode === 'reopen' && <FormField label="Estado al reabrir"><select className={inputClass} value={reopenStatus} onChange={event => setReopenStatus(event.target.value)}><option value="programada">programada</option><option value="en_curso">en_curso</option></select></FormField>}<FormField label={mode === 'close' ? 'Comentario de cierre' : 'Comentario de reapertura'}><textarea className={inputClass} rows="3" value={comment} onChange={event => setComment(event.target.value)}/></FormField><div className="flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm font-bold" onClick={() => setSelected(null)}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={submit}>Confirmar</button></div></div></Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}

export default function WorkOrdersPage({ navigationKey }) {
  const { user } = useAuth();
  if (user?.role === 'mecanico') return <MechanicWorkOrdersView navigationKey={navigationKey}/>;
  if (user?.role === 'supervisor') return <><SupervisorFinishedWorkReview/><EntityPage type="workOrders"/></>;
  return <EntityPage type="workOrders"/>;
}
