import { useState } from 'react';
import Badge from '../components/common/Badge';
import DataTable from '../components/tables/DataTable';
import LoadingState from '../components/common/LoadingState';
import Toast from '../components/common/Toast';
import ChecklistRunner from '../components/checklists/ChecklistRunner';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePermissions } from '../hooks/usePermissions';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate } from '../utils/dates';

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'checklistTypeLabel', label: 'Tipo', render: row => row.checklistTypeLabel || row.checklistType || '—' },
  { key: 'equipmentCode', label: 'Equipo' },
  { key: 'operatorName', label: 'Operador' },
  { key: 'hourmeter', label: 'Horómetro' },
  { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> },
  { key: 'maxPriority', label: 'Prioridad', render: row => row.hasFindings ? <Badge value={row.maxPriority}/> : '—' },
  { key: 'createdAt', label: 'Fecha', render: row => formatDate(row.createdAt) },
];

export default function ChecklistsPage() {
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  const { data: equipment } = useFirestoreCollection('equipment', { orderBy: { field: 'code', direction: 'asc' } });
  const checklistQueryOptions = user?.role === 'operador'
    ? { where: [['operatorId', '==', user?.uid || '']], orderBy: { field: 'createdAt', direction: 'desc' }, limit: 50 }
    : { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 50 };
  const { data: checklists, loading } = useFirestoreCollection('checklists', checklistQueryOptions);
  const [toast, setToast] = useState(null);
  const canCreate = canAny(['checklists.create', 'checklists.manage']);
  const canOverrideHourmeter = canAny(['equipment.updateHourmeter', 'equipment.manage']);

  return <section className="space-y-5">
    {canCreate && <ChecklistRunner companyId={companyId} user={user} equipment={equipment.filter(item => item.status !== 'fuera_servicio')} canOverrideHourmeter={canOverrideHourmeter} onSaved={({ findings, checklist }) => setToast({ type: 'success', message: findings?.length ? `Checklist ${checklist.folio} guardado con ${findings.length} hallazgo(s) individual(es) para revisión.` : `Checklist ${checklist.folio} guardado sin hallazgos.` })}/>}
    <div className="space-y-3"><div><h3 className="text-lg font-bold text-slate-900">Historial de checklists</h3><p className="text-sm text-slate-500">Últimas inspecciones preoperacionales registradas.</p></div>{loading ? <LoadingState/> : <DataTable columns={columns} rows={checklists}/>}</div>
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </section>;
}
