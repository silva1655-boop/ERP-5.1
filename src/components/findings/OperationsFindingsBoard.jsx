import { useMemo, useState } from 'react';
import Badge from '../common/Badge';
import LoadingState from '../common/LoadingState';
import FilterBar from '../common/FilterBar';
import Modal from '../modals/Modal';
import FormField, { inputClass } from '../forms/FormField';
import Toast from '../common/Toast';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { createMaintenanceRequestFromFinding, rejectFinding } from '../../services/findingService';
import { formatDate } from '../../utils/dates';
import { handleError } from '../../utils/errorHandler';

const columns = [
  { key: 'pendiente_revision_operaciones', statuses: ['pendiente_revision_operaciones'], label: 'Pendientes', empty: 'Sin hallazgos pendientes.' },
  { key: 'derivado_mantenimiento', statuses: ['derivado_mantenimiento', 'convertido_en_solicitud'], label: 'Derivados a mantenimiento', empty: 'Sin hallazgos derivados.' },
  { key: 'rechazado', statuses: ['rechazado'], label: 'Rechazados', empty: 'Sin hallazgos rechazados.' },
];

const rejectionReasons = ['Error de inspección', 'Duplicado', 'Condición normal', 'Hallazgo ya corregido'];

const emptyFindingFilters = { text: '', status: '', priority: '', dateFrom: '', dateTo: '' };
const findingPriorityOptions = ['baja', 'media', 'alta', 'critica'];

function findingDateValue(finding) {
  const value = finding.detectedAt || finding.createdAt;
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

function matchesFindingFilters(finding, filters) {
  const text = (filters.text || '').trim().toLowerCase();
  const haystack = [finding.equipmentCode, finding.equipmentName, finding.systemAffected, finding.itemName, finding.operatorName, finding.observation, finding.terminal].filter(Boolean).join(' ').toLowerCase();
  if (text && !haystack.includes(text)) return false;
  if (filters.status && finding.status !== filters.status) return false;
  if (filters.priority && (finding.priority || finding.suggestedPriority) !== filters.priority) return false;
  const date = findingDateValue(finding);
  if (!date || Number.isNaN(date.getTime())) return !filters.dateFrom && !filters.dateTo;
  if (filters.dateFrom && date < new Date(`${filters.dateFrom}T00:00:00`)) return false;
  if (filters.dateTo && date > new Date(`${filters.dateTo}T23:59:59`)) return false;
  return true;
}

function findingStatusColor(status) {
  if (status === 'bad') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'conditional') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function FindingCard({ finding, onCreateRequest, onReject }) {
  const photo = finding.photos?.[0] || finding.evidenceUrls?.[0]?.url;
  const pending = finding.status === 'pendiente_revision_operaciones';
  return <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    {photo && <img src={photo} alt={`Evidencia ${finding.itemName}`} className="mb-3 h-32 w-full rounded-xl object-cover"/>}
    <div className="flex items-start justify-between gap-2">
      <div><p className="text-sm font-bold text-slate-900">{finding.equipmentCode || finding.equipmentName || 'Equipo'}</p><p className="text-xs text-slate-500">{finding.equipmentType || 'Equipo'} · {finding.systemAffected} · {finding.itemName}</p></div>
      <Badge value={finding.priority || finding.suggestedPriority}/>
    </div>
    <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className={`rounded-full border px-2 py-1 font-semibold ${findingStatusColor(finding.detectedStatus)}`}>{finding.detectedStatusLabel || finding.detectedStatus}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{formatDate(finding.detectedAt || finding.createdAt)}</span></div>
    <p className="mt-2 text-xs text-slate-600"><b>Operador:</b> {finding.operatorName || '—'}</p><p className="mt-1 text-xs text-slate-600"><b>Tipo equipo:</b> {finding.equipmentType || '—'}</p>
    <p className="mt-2 line-clamp-3 text-sm text-slate-700">{finding.observation || 'Sin observación'}</p>
    {pending && <div className="mt-3 grid gap-2 sm:grid-cols-2"><button className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => onCreateRequest(finding)}>Crear Solicitud de Mantenimiento</button><button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => onReject(finding)}>Rechazar Hallazgo</button></div>}
  </article>;
}

export default function OperationsFindingsBoard() {
  const { companyId, user } = useAuth();
  const { data: findings, loading } = useFirestoreCollection('findings', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('');
  const [form, setForm] = useState({ priority: 'media', operationalComment: '', recommendation: '', rejectionReason: rejectionReasons[0], rejectionComment: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState(emptyFindingFilters);

  const filteredFindings = useMemo(() => findings.filter(item => matchesFindingFilters(item, filters)), [filters, findings]);
  const grouped = useMemo(() => columns.reduce((acc, column) => ({ ...acc, [column.key]: filteredFindings.filter(item => column.statuses.includes(item.status)) }), {}), [filteredFindings]);

  const openCreateRequest = finding => {
    setSelected(finding);
    setMode('request');
    setForm(prev => ({ ...prev, priority: finding.priority || finding.suggestedPriority || 'media', operationalComment: '', recommendation: finding.recommendation || '' }));
  };

  const openReject = finding => {
    setSelected(finding);
    setMode('reject');
    setForm(prev => ({ ...prev, rejectionReason: rejectionReasons[0], rejectionComment: '' }));
  };

  const close = () => { setSelected(null); setMode(''); };

  const submit = async () => {
    if (mode === 'reject' && !form.rejectionComment.trim()) { setToast({ type: 'error', message: 'Debe ingresar comentario de rechazo.' }); return; }
    if (mode === 'request' && !form.operationalComment.trim()) { setToast({ type: 'error', message: 'Debe ingresar comentario operacional.' }); return; }
    setSaving(true);
    try {
      if (mode === 'reject') {
        await rejectFinding(companyId, selected, { reason: form.rejectionReason, comment: form.rejectionComment }, user);
        setToast({ type: 'success', message: 'Hallazgo rechazado con trazabilidad.' });
      } else {
        const request = await createMaintenanceRequestFromFinding(companyId, selected, form, user);
        setToast({ type: 'success', message: `Solicitud ${request.folio} creada para el hallazgo individual.` });
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
    <div><h3 className="text-lg font-bold text-slate-900">Bandeja Supervisor de Operaciones</h3><p className="text-sm text-slate-500">Gestiona cada hallazgo individual antes de crear solicitudes de mantenimiento.</p></div>
    <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFindingFilters)} placeholder="Buscar equipo, sistema, operador, terminal o texto" statusOptions={columns.flatMap(column => column.statuses)} priorityOptions={findingPriorityOptions}/>
    <div className="grid gap-4 xl:grid-cols-3">{columns.map(column => <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-bold text-slate-800">{column.label}</h4><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{grouped[column.key]?.length || 0}</span></div><div className="space-y-3">{grouped[column.key]?.length ? grouped[column.key].map(finding => <FindingCard key={finding.id} finding={finding} onCreateRequest={openCreateRequest} onReject={openReject}/>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">{column.empty}</p>}</div></div>)}</div>
    {selected && <Modal title={mode === 'reject' ? 'Rechazar hallazgo' : 'Crear solicitud de mantenimiento'} onClose={close}>
      <div className="space-y-3"><div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>{selected.equipmentCode}</b> · {selected.systemAffected} · {selected.itemName}<p className="mt-1 text-xs">{selected.observation}</p></div>
      {mode === 'reject' ? <><FormField label="Motivo del rechazo"><select className={inputClass} value={form.rejectionReason} onChange={event => setForm({ ...form, rejectionReason: event.target.value })}>{rejectionReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></FormField><FormField label="Comentario obligatorio"><textarea className={inputClass} rows="3" value={form.rejectionComment} onChange={event => setForm({ ...form, rejectionComment: event.target.value })}/></FormField></> : <><FormField label="Prioridad"><select className={inputClass} value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></FormField><FormField label="Comentario operacional"><textarea className={inputClass} rows="3" value={form.operationalComment} onChange={event => setForm({ ...form, operationalComment: event.target.value })}/></FormField><FormField label="Recomendación"><textarea className={inputClass} rows="3" value={form.recommendation} onChange={event => setForm({ ...form, recommendation: event.target.value })}/></FormField></>}
      <div className="flex justify-end gap-2"><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600" onClick={close}>Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60" onClick={submit}>{saving ? 'Guardando...' : 'Confirmar'}</button></div></div>
    </Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}
