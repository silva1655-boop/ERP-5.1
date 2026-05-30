import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import DataTable from '../components/tables/DataTable';
import LoadingState from '../components/common/LoadingState';
import Modal from '../components/modals/Modal';
import Toast from '../components/common/Toast';
import ChecklistRunner from '../components/checklists/ChecklistRunner';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePermissions } from '../hooks/usePermissions';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate } from '../utils/dates';

const countAnswers = (answers = {}) => Object.values(answers).reduce((acc, answer = {}) => {
  const status = answer.status || answer.value;
  if (status === 'good' || status === 'Bueno') acc.good += 1;
  if (status === 'conditional' || status === 'Condicional') acc.conditional += 1;
  if (status === 'bad' || status === 'Malo') acc.bad += 1;
  return acc;
}, { good: 0, conditional: 0, bad: 0 });

const historyColumns = [
  { key: 'createdAt', label: 'Fecha', render: row => formatDate(row.createdAt) },
  { key: 'equipmentCode', label: 'Equipo', render: row => row.equipmentCode || row.equipmentName || '—' },
  { key: 'checklistTypeLabel', label: 'Tipo checklist', render: row => row.checklistTypeLabel || row.checklistType || '—' },
  { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> },
  { key: 'goodCount', label: 'Buenos', render: row => countAnswers(row.answers).good },
  { key: 'conditionalCount', label: 'Condicionales', render: row => countAnswers(row.answers).conditional },
  { key: 'badCount', label: 'Malos', render: row => countAnswers(row.answers).bad },
  { key: 'findingCount', label: 'Hallazgos', render: row => row.findingCount ?? row.findings?.length ?? (row.hasFindings ? countAnswers(row.answers).conditional + countAnswers(row.answers).bad : 0) },
];

function ChecklistDetail({ checklist }) {
  const answers = Object.entries(checklist.answers || {});
  return <div className="space-y-4">
    <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 md:grid-cols-2">
      <p><b>Folio:</b> {checklist.folio || '—'}</p>
      <p><b>Equipo:</b> {checklist.equipmentCode || checklist.equipmentName || '—'}</p>
      <p><b>Tipo:</b> {checklist.checklistTypeLabel || checklist.checklistType || '—'}</p>
      <p><b>Fecha:</b> {formatDate(checklist.createdAt)}</p>
      <p><b>Estado:</b> <Badge value={checklist.status}/></p>
      <p><b>Hallazgos:</b> {checklist.findingCount ?? checklist.findings?.length ?? 0}</p>
    </div>
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-slate-900">Respuestas</h4>
      {answers.length ? answers.map(([key, answer]) => <div key={key} className="rounded-xl border border-slate-200 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-700">{key}</span><Badge value={answer.status || answer.value}/></div>
        {answer.observation && <p className="mt-2 text-slate-600">{answer.observation}</p>}
        {answer.photoMeta?.url && <a className="mt-2 inline-block text-xs font-semibold text-blue-700" href={answer.photoMeta.url} target="_blank" rel="noreferrer">Ver evidencia</a>}
      </div>) : <p className="text-sm text-slate-500">Sin respuestas registradas.</p>}
    </div>
  </div>;
}

export default function ChecklistsPage({ navigationKey }) {
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  const { data: equipment } = useFirestoreCollection('equipment', { orderBy: { field: 'code', direction: 'asc' } });
  const isOperatorHistory = navigationKey === 'myInspections';
  const isOperatorNew = navigationKey === 'newInspection';
  const checklistQueryOptions = user?.role === 'operador'
    ? { where: [['operatorId', '==', user?.uid || '']], limit: 100 }
    : { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 };
  const { data: checklists, loading } = useFirestoreCollection('checklists', checklistQueryOptions);
  const sortedChecklists = useMemo(() => [...checklists].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [checklists]);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const canCreate = canAny(['checklists.create', 'checklists.manage']);
  const canOverrideHourmeter = canAny(['equipment.updateHourmeter', 'equipment.manage']);
  const showRunner = canCreate && !isOperatorHistory;
  const showHistory = !isOperatorNew;

  return <section className="space-y-5">
    {showRunner && <ChecklistRunner companyId={companyId} user={user} equipment={equipment.filter(item => item.status !== 'fuera_servicio')} canOverrideHourmeter={canOverrideHourmeter} onSaved={({ findings, checklist }) => setToast({ type: 'success', message: findings?.length ? `Checklist ${checklist.folio} guardado con ${findings.length} hallazgo(s) individual(es) para revisión.` : `Checklist ${checklist.folio} guardado sin hallazgos.` })}/>}
    {showHistory && <div className="space-y-3"><div><h3 className="text-lg font-bold text-slate-900">{isOperatorHistory ? 'Mis inspecciones' : 'Historial de checklists'}</h3><p className="text-sm text-slate-500">{isOperatorHistory ? 'Solo lectura de inspecciones creadas por tu usuario.' : 'Últimas inspecciones preoperacionales registradas.'}</p></div>{loading ? <LoadingState/> : <DataTable columns={historyColumns} rows={sortedChecklists} actions={row => <button onClick={() => setSelected(row)} className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Ver detalle</button>}/>}</div>}
    {selected && <Modal title={`Detalle inspección ${selected.folio || ''}`} onClose={() => setSelected(null)} wide><ChecklistDetail checklist={selected}/></Modal>}
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}
