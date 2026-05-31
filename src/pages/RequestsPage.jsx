import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import DataTable from '../components/tables/DataTable';
import FormField, { inputClass } from '../components/forms/FormField';
import LoadingState from '../components/common/LoadingState';
import Toast from '../components/common/Toast';
import OperationsFindingsBoard from '../components/findings/OperationsFindingsBoard';
import NotificationCard from '../components/notifications/NotificationCard';
import MaintenanceRequestsBoard from '../components/requests/MaintenanceRequestsBoard';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePermissions } from '../hooks/usePermissions';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { createManualFindingReport } from '../services/findingService';
import { markNotificationAsRead } from '../services/notificationService';
import { formatDate } from '../utils/dates';
import { handleError } from '../utils/errorHandler';
import EntityPage from './EntityPage';

const systemOptions = ['Motor', 'Sistema hidráulico', 'Sistema eléctrico', 'Neumáticos', 'Frenos', 'Luces', 'Cabina', 'Seguridad', 'Otro'];
const priorityOptions = ['baja', 'media', 'alta'];

const statusColumns = [
  { key: 'createdAt', label: 'Fecha', render: row => formatDate(row.createdAt || row.detectedAt) },
  { key: 'equipmentCode', label: 'Equipo', render: row => row.equipmentCode || row.equipmentName || '—' },
  { key: 'failure', label: 'Falla', render: row => row.failure || row.itemName || row.title || row.systemAffected || '—' },
  { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> },
  { key: 'comment', label: 'Comentario operaciones', render: row => row.comment || row.rejectionComment || row.operationalComment || row.reviewComment || row.rejectionReason || '—' },
  { key: 'maintenance', label: 'Derivación', render: row => row.maintenanceRequestFolio || row.sourceFindingId || row.workOrderFolio ? <span className="text-xs font-semibold text-blue-700">{row.workOrderFolio ? `OT ${row.workOrderFolio}` : row.maintenanceRequestFolio ? `Solicitud ${row.maintenanceRequestFolio}` : 'Derivada'}</span> : '—' },
];

function OperatorFailureReport() {
  const { companyId, user } = useAuth();
  const { data: equipment, loading } = useFirestoreCollection('equipment', { orderBy: { field: 'code', direction: 'asc' } });
  const [form, setForm] = useState({ equipmentId: '', systemAffected: systemOptions[0], description: '', priority: 'media', photoFile: null });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const selectedEquipment = equipment.find(item => item.id === form.equipmentId);

  const submit = async event => {
    event.preventDefault();
    if (!form.equipmentId || !form.systemAffected || !form.description.trim()) {
      setToast({ type: 'error', message: 'Selecciona equipo, sistema afectado y describe la falla.' });
      return;
    }
    setSaving(true);
    try {
      const finding = await createManualFindingReport(companyId, { ...form, equipment: selectedEquipment }, user);
      setForm({ equipmentId: '', systemAffected: systemOptions[0], description: '', priority: 'media', photoFile: null });
      setToast({ type: 'success', message: `Falla reportada como hallazgo ${finding.id}. Operaciones la revisará.` });
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setSaving(false);
    }
  };

  return <section className="space-y-4">
    <div><h3 className="text-lg font-bold text-slate-900">Reportar falla</h3><p className="text-sm text-slate-500">Registra una falla manual. Se creará un hallazgo individual para revisión de Operaciones; no se crea OT directa.</p></div>
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Equipo"><select className={inputClass} value={form.equipmentId} onChange={event => setForm({ ...form, equipmentId: event.target.value })}><option value="">Selecciona equipo</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.code || item.id} · {item.name || item.type || 'Equipo'}</option>)}</select></FormField>
        <FormField label="Sistema afectado"><select className={inputClass} value={form.systemAffected} onChange={event => setForm({ ...form, systemAffected: event.target.value })}>{systemOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></FormField>
        <FormField label="Prioridad percibida"><select className={inputClass} value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{priorityOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></FormField>
        <FormField label="Fotografía opcional"><input className={inputClass} type="file" accept="image/*" onChange={event => setForm({ ...form, photoFile: event.target.files?.[0] || null })}/>{form.photoFile && <p className="mt-1 text-xs text-slate-500">{form.photoFile.name}</p>}</FormField>
        <div className="md:col-span-2"><FormField label="Descripción de la falla"><textarea className={inputClass} rows="4" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Describe qué falla observaste, condiciones y riesgos operacionales"/></FormField></div>
      </div>
      <div className="mt-4 flex justify-end"><button disabled={saving || loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{saving ? 'Enviando...' : 'Enviar reporte'}</button></div>
    </form>
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}


function FinishedWorkNotifications() {
  const { companyId, user } = useAuth();
  const { data: notifications, loading } = useFirestoreCollection('notifications', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 });
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const rows = useMemo(() => notifications.filter(item => ['work_order_finished', 'work_order_closed'].includes(item.type) && (item.targetPage === 'requests' || (item.recipientRoles || item.recipientsRoles || item.targetRoles || []).includes('operaciones'))), [notifications]);
  const markRead = async notification => {
    try {
      await markNotificationAsRead(companyId, notification.id, user);
      setToast({ type: 'success', message: 'Notificación marcada como revisada.' });
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    }
  };

  return <section className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold text-slate-900">Trabajos finalizados</h3><p className="text-sm text-slate-600">Trazabilidad de OT finalizadas o cerradas para revisión operacional.</p></div><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-700">{rows.length}</span></div>
    {loading ? <LoadingState/> : <div className="grid gap-3 xl:grid-cols-2">{rows.length ? rows.map(notification => <NotificationCard key={notification.id} notification={notification} actionLabel="Ver detalle" onAction={setSelected} onMarkRead={markRead}/>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Sin trabajos finalizados pendientes de revisión.</p>}</div>}
    {selected && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between gap-3"><h4 className="font-bold text-slate-900">Detalle {selected.workOrderFolio || selected.workOrderId}</h4><button className="text-sm font-bold text-slate-500" onClick={() => setSelected(null)}>Cerrar</button></div><NotificationCard notification={selected} onMarkRead={markRead}/></div>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}

function OperatorRequestStatus() {
  const { user } = useAuth();
  const requestOptions = { where: [['requestedById', '==', user?.uid || '__no_user__']], limit: 100 };
  const findingOptions = { where: [['operatorId', '==', user?.uid || '__no_user__']], limit: 100 };
  const { data: requests, loading: loadingRequests } = useFirestoreCollection('requests', requestOptions);
  const { data: findings, loading: loadingFindings } = useFirestoreCollection('findings', findingOptions);

  const rows = useMemo(() => {
    const findingRows = findings.map(item => ({
      ...item,
      type: 'finding',
      failure: `${item.systemAffected || 'Sistema'} · ${item.itemName || item.observation || 'Falla'}`,
      createdAt: item.createdAt || item.detectedAt,
    }));
    const requestRows = requests.map(item => ({
      ...item,
      type: 'request',
      failure: item.title || item.systemAffected || item.description,
      comment: item.reviewComment || item.operationalComment || item.rejectionReason,
    }));
    return [...findingRows, ...requestRows].sort((a, b) => {
      const av = a.createdAt?.seconds || a.detectedAt?.seconds || 0;
      const bv = b.createdAt?.seconds || b.detectedAt?.seconds || 0;
      return bv - av;
    });
  }, [findings, requests]);

  return <section className="space-y-4">
    <div><h3 className="text-lg font-bold text-slate-900">Estado de solicitudes</h3><p className="text-sm text-slate-500">Consulta solo tus hallazgos y solicitudes originadas por tus inspecciones o reportes.</p></div>
    {loadingRequests || loadingFindings ? <LoadingState/> : <DataTable columns={statusColumns} rows={rows}/>}
  </section>;
}

export default function RequestsPage({ navigationKey }) {
  const { user } = useAuth();
  const { canAny } = usePermissions();
  const canReviewFindings = canAny(['requests.review', 'requests.manage', 'requests.sendToMaintenance', 'findings.review']);

  if (navigationKey === 'reportFailure') return <OperatorFailureReport/>;
  if (navigationKey === 'requestStatus') return <OperatorRequestStatus/>;
  if (user?.role === 'operaciones' && navigationKey === 'requests') return <div className="space-y-5"><FinishedWorkNotifications/><OperationsFindingsBoard/></div>;
  if (user?.role === 'supervisor' && navigationKey === 'requests') return <MaintenanceRequestsBoard/>;

  return <div className="space-y-6">
    {canReviewFindings && <OperationsFindingsBoard/>}
    <EntityPage type="requests"/>
  </div>;
}
