import { useMemo, useState } from 'react';
import Badge from '../common/Badge';
import LoadingState from '../common/LoadingState';
import Modal from '../modals/Modal';
import FormField, { inputClass } from '../forms/FormField';
import Toast from '../common/Toast';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { approveMaintenanceRequest, createWorkOrderFromMaintenanceRequest, rejectMaintenanceRequest } from '../../services/requestService';
import { formatDate } from '../../utils/dates';
import { handleError } from '../../utils/errorHandler';

const columns = [
  { key: 'pendiente_revision_mantenimiento', statuses: ['pendiente_revision_mantenimiento'], label: 'Pendientes', empty: 'Sin solicitudes pendientes.' },
  { key: 'aprobada', statuses: ['aprobada'], label: 'Aprobadas', empty: 'Sin solicitudes aprobadas.' },
  { key: 'convertida_en_ot', statuses: ['convertida_en_ot', 'convertida_ot'], label: 'OT creadas', empty: 'Sin OT creadas desde solicitudes.' },
];

function RequestCard({ request, onApprove, onReject, onCreateOt }) {
  const photo = request.photos?.[0] || request.evidenceUrls?.[0]?.url;
  return <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    {photo && <img src={photo} alt={`Evidencia ${request.folio}`} className="mb-3 h-32 w-full rounded-xl object-cover"/>}
    <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-900">{request.folio}</p><p className="text-xs text-slate-500">{request.equipmentCode || request.equipmentName} · {request.systemAffected}</p></div><Badge value={request.priority}/></div>
    <p className="mt-2 text-xs text-slate-500">Detectado: {formatDate(request.detectedAt || request.createdAt)}</p>
    <p className="mt-2 line-clamp-3 text-sm text-slate-700">{request.observations || request.description}</p>
    {request.status === 'pendiente_revision_mantenimiento' && <div className="mt-3 grid gap-2 sm:grid-cols-2"><button className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => onApprove(request)}>Aprobar solicitud</button><button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => onReject(request)}>Rechazar solicitud</button></div>}
    {request.status === 'aprobada' && <button className="mt-3 w-full rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => onCreateOt(request)}>Crear OT</button>}
    {request.workOrderFolio && <p className="mt-2 text-xs font-semibold text-blue-700">OT: {request.workOrderFolio}</p>}
  </article>;
}

export default function MaintenanceRequestsBoard() {
  const { companyId, user } = useAuth();
  const { data: requests, loading } = useFirestoreCollection('requests', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('No corresponde mantenimiento');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const individualRequests = useMemo(() => requests.filter(request => request.source === 'finding' || request.sourceFindingId), [requests]);
  const grouped = useMemo(() => columns.reduce((acc, column) => ({ ...acc, [column.key]: individualRequests.filter(item => column.statuses.includes(item.status)) }), {}), [individualRequests]);

  const open = (nextMode, request) => { setMode(nextMode); setSelected(request); setComment(''); setReason('No corresponde mantenimiento'); };
  const close = () => { setMode(''); setSelected(null); };

  const submit = async () => {
    if (mode === 'reject' && !comment.trim()) { setToast({ type: 'error', message: 'El comentario de rechazo es obligatorio.' }); return; }
    setSaving(true);
    try {
      if (mode === 'approve') {
        await approveMaintenanceRequest(companyId, selected, user, comment);
        setToast({ type: 'success', message: 'Solicitud aprobada.' });
      } else if (mode === 'reject') {
        await rejectMaintenanceRequest(companyId, selected, user, reason, comment);
        setToast({ type: 'success', message: 'Solicitud rechazada.' });
      } else {
        const ot = await createWorkOrderFromMaintenanceRequest(companyId, selected, user);
        setToast({ type: 'success', message: `OT ${ot.folio} creada con trazabilidad.` });
      }
      close();
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState/>;

  return <section className="space-y-3">
    <div><h3 className="text-lg font-bold text-slate-900">Bandeja Supervisor de Mantenimiento</h3><p className="text-sm text-slate-500">Solicitudes individuales derivadas desde hallazgos operacionales.</p></div>
    <div className="grid gap-4 xl:grid-cols-3">{columns.map(column => <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-bold text-slate-800">{column.label}</h4><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{grouped[column.key]?.length || 0}</span></div><div className="space-y-3">{grouped[column.key]?.length ? grouped[column.key].map(request => <RequestCard key={request.id} request={request} onApprove={item => open('approve', item)} onReject={item => open('reject', item)} onCreateOt={item => open('ot', item)}/>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">{column.empty}</p>}</div></div>)}</div>
    {selected && <Modal title={mode === 'ot' ? 'Crear OT' : mode === 'reject' ? 'Rechazar solicitud' : 'Aprobar solicitud'} onClose={close}>
      <div className="space-y-3"><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>{selected.folio}</b> · {selected.equipmentCode} · {selected.systemAffected}<p className="mt-1 text-xs">{selected.observations || selected.description}</p></div>{mode === 'reject' && <FormField label="Motivo rechazo"><input className={inputClass} value={reason} onChange={event => setReason(event.target.value)}/></FormField>}{mode !== 'ot' && <FormField label="Comentario"><textarea className={inputClass} rows="3" value={comment} onChange={event => setComment(event.target.value)}/></FormField>}<div className="flex justify-end gap-2"><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={close}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={submit}>{saving ? 'Guardando...' : 'Confirmar'}</button></div></div>
    </Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}
