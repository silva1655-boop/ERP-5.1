import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils/dates';
import { seedNavimagEquipment } from '../services/equipmentSeedService';
import { handleError } from '../utils/errorHandler';
import EntityPage from './EntityPage';

const operationalStates = [
  { key: 'operativo', label: 'Operativo', aliases: ['operativo', 'disponible'] },
  { key: 'operativo_restriccion', label: 'Operativo con restricción', aliases: ['observado', 'operativo_restriccion', 'restringido'] },
  { key: 'mantenimiento', label: 'En mantenimiento', aliases: ['mantenimiento', 'en_mantenimiento'] },
  { key: 'fuera_servicio', label: 'Fuera de servicio', aliases: ['fuera_servicio', 'fuera de servicio', 'baja'] },
  { key: 'espera_repuesto', label: 'Espera repuesto', aliases: ['espera_repuesto'] },
  { key: 'espera_tercero', label: 'Espera tercero', aliases: ['espera_tercero'] },
  { key: 'stand_by', label: 'Stand by', aliases: ['stand_by', 'standby'] },
];

function normalizeStatus(status = '') {
  const value = String(status || 'operativo').toLowerCase();
  return operationalStates.find(state => state.aliases.includes(value))?.key || 'operativo';
}

function OperationalEquipmentBoard() {
  const equipment = useFirestoreCollection('equipment', { orderBy: { field: 'code', direction: 'asc' } });
  const checklists = useFirestoreCollection('checklists', { limit: 200 });
  const findings = useFirestoreCollection('findings', { limit: 200 });
  const workOrders = useFirestoreCollection('workOrders', { limit: 200 });

  const rowsByState = useMemo(() => {
    const latestChecklist = new Map();
    checklists.data.forEach(item => {
      const key = item.equipmentId || item.equipmentCode;
      const current = latestChecklist.get(key);
      if (!current || (item.createdAt?.seconds || 0) > (current.createdAt?.seconds || 0)) latestChecklist.set(key, item);
    });
    return operationalStates.reduce((acc, state) => ({ ...acc, [state.key]: equipment.data.filter(item => normalizeStatus(item.status || item.operationalStatus) === state.key).map(item => {
      const key = item.id || item.code;
      const openFindings = findings.data.filter(finding => (finding.equipmentId === item.id || finding.equipmentCode === item.code) && !['rechazado', 'derivado_mantenimiento', 'convertido_en_solicitud'].includes(finding.status));
      const openOt = workOrders.data.find(ot => (ot.equipmentId === item.id || ot.equipmentCode === item.code) && !['cerrada', 'completada', 'cancelada'].includes(ot.status));
      return { ...item, latestChecklist: latestChecklist.get(key) || latestChecklist.get(item.code), openFindings, openOt };
    }) }), {});
  }, [equipment.data, checklists.data, findings.data, workOrders.data]);

  if (equipment.loading || checklists.loading || findings.loading || workOrders.loading) return <LoadingState/>;

  return <section className="space-y-4">
    <div><h3 className="text-lg font-bold text-slate-900">Estado operacional de equipos</h3><p className="text-sm text-slate-500">Tablero operativo con inspecciones, hallazgos abiertos y OT vigentes por equipo.</p></div>
    <div className="grid gap-4 xl:grid-cols-3">{operationalStates.map(state => <div key={state.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-bold text-slate-800">{state.label}</h4><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{rowsByState[state.key]?.length || 0}</span></div>
      <div className="space-y-3">{rowsByState[state.key]?.length ? rowsByState[state.key].map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-900">{item.code || item.id}</p><p className="text-xs text-slate-500">{item.type || 'Equipo'} · {item.terminal || item.location || 'Sin terminal'}</p></div><Badge value={item.status || state.key}/></div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600"><p><b>Última inspección:</b> {item.latestChecklist ? formatDate(item.latestChecklist.createdAt) : '—'}</p><p><b>Hallazgos abiertos:</b> {item.openFindings.length}</p><p><b>OT abierta:</b> {item.openOt ? item.openOt.folio || item.openOt.id : '—'}</p></div>
      </article>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-500">Sin equipos en este estado.</p>}</div>
    </div>)}</div>
  </section>;
}


function EquipmentSeedPanel() {
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  if (!canAny(['equipment.manage'])) return null;

  const seed = async () => {
    if (!window.confirm('Se cargarán equipos Navimag solo si no existen por código/TAG. ¿Continuar?')) return;
    setLoading(true);
    try {
      const result = await seedNavimagEquipment(companyId, user);
      setToast({ type: 'success', message: `Seed completado: ${result.created.length} creados, ${result.skipped.length} existentes.` });
    } catch (error) {
      setToast({ type: 'error', message: handleError(error) });
    } finally {
      setLoading(false);
    }
  };

  return <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">Carga inicial de equipos Navimag</p><p className="text-blue-700">Crea tractos, grúas horquilla y Lifttec solo si no existen por código/TAG.</p></div><button disabled={loading} onClick={seed} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{loading ? 'Cargando...' : 'Cargar equipos preestablecidos'}</button></div>
    <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/>
  </div>;
}

export default function EquipmentPage({ navigationKey }) {
  const { user } = useAuth();
  if (navigationKey === 'equipmentStatus' || user?.role === 'operaciones') return <OperationalEquipmentBoard/>;
  return <><EquipmentSeedPanel/><EntityPage type="equipment"/></>;
}
import EntityPage from './EntityPage';
export default function EquipmentPage(){ return <EntityPage type="equipment"/>; }
