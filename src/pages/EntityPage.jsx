import { useMemo, useState } from 'react';
import Badge from '../components/common/Badge';
import LoadingState from '../components/common/LoadingState';
import Toast from '../components/common/Toast';
import Modal from '../components/modals/Modal';
import FormField, { inputClass } from '../components/forms/FormField';
import DataTable from '../components/tables/DataTable';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { usePermissions } from '../hooks/usePermissions';
import { createDocument, deleteDocument, generateFolio, updateDocument } from '../services/firestoreService';
import { handleError } from '../utils/errorHandler';
import { formatDate } from '../utils/dates';
import { PRIORITIES, REQUEST_STATUS, WORK_ORDER_STATUS } from '../utils/constants';
import { validateRequiredFields, validateWorkOrder } from '../utils/validators';

const entityConfig = {
  equipment: {
    title: 'Equipos', permission: 'equipment.manage', collection: 'equipment', search: ['code', 'name', 'status', 'terminal'], required: ['code', 'name', 'type', 'status'],
    defaults: { status: 'operativo', criticality: 'B', active: true, hourmeter: 0, odometer: 0 },
    fields: [
      ['code', 'Código'], ['name', 'Nombre'], ['brand', 'Marca'], ['model', 'Modelo'], ['serialNumber', 'Serie'], ['plate', 'Patente'], ['type', 'Tipo'], ['terminal', 'Terminal'],
      ['status', 'Estado', 'select', ['operativo', 'mantenimiento', 'falla', 'inactivo']], ['criticality', 'Criticidad', 'select', ['A', 'B', 'C']], ['hourmeter', 'Horómetro', 'number'], ['odometer', 'Odómetro', 'number'],
    ],
    columns: [
      { key: 'code', label: 'Código' }, { key: 'name', label: 'Equipo' }, { key: 'type', label: 'Tipo' }, { key: 'terminal', label: 'Terminal' }, { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> }, { key: 'criticality', label: 'Crit.' },
    ],
  },
  workOrders: {
    title: 'Órdenes de trabajo', permission: 'workOrders.manage', collection: 'workOrders', search: ['folio', 'title', 'status', 'equipmentCode'], folioPrefix: 'OT', required: ['title', 'equipmentId', 'priority', 'status'],
    defaults: { type: 'correctiva', status: 'pendiente', priority: 'media', laborHours: 0, partsUsed: [], evidenceUrls: [], totalCost: 0 },
    validate: validateWorkOrder,
    fields: [
      ['title', 'Título'], ['description', 'Descripción', 'textarea'], ['equipmentId', 'ID equipo'], ['equipmentCode', 'Código equipo'], ['type', 'Tipo', 'select', ['correctiva', 'preventiva', 'operacional']], ['status', 'Estado', 'select', WORK_ORDER_STATUS], ['priority', 'Prioridad', 'select', PRIORITIES], ['assignedTo', 'Técnico asignado'], ['requestedBy', 'Solicitado por'], ['dueDate', 'Fecha compromiso', 'date'], ['findings', 'Hallazgos', 'textarea'], ['rootCause', 'Causa raíz', 'textarea'], ['correctiveAction', 'Acción correctiva', 'textarea'], ['totalCost', 'Costo total', 'number'],
    ],
    columns: [
      { key: 'folio', label: 'Folio' }, { key: 'title', label: 'Título' }, { key: 'equipmentCode', label: 'Equipo' }, { key: 'assignedTo', label: 'Técnico' }, { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> }, { key: 'priority', label: 'Prioridad', render: row => <Badge value={row.priority}/> },
    ],
  },
  requests: {
    title: 'Solicitudes', permission: 'requests.manage', collection: 'requests', search: ['folio', 'title', 'status'], folioPrefix: 'SOL', required: ['title', 'equipmentId', 'priority'],
    defaults: { status: 'pendiente', priority: 'media', evidenceUrls: [] },
    fields: [['title', 'Título'], ['description', 'Descripción', 'textarea'], ['equipmentId', 'ID equipo'], ['status', 'Estado', 'select', REQUEST_STATUS], ['priority', 'Prioridad', 'select', PRIORITIES], ['requestedBy', 'Solicitado por'], ['rejectionReason', 'Motivo rechazo', 'textarea']],
    columns: [{ key: 'folio', label: 'Folio' }, { key: 'title', label: 'Título' }, { key: 'equipmentId', label: 'Equipo' }, { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> }, { key: 'priority', label: 'Prioridad', render: row => <Badge value={row.priority}/> }],
  },
  checklists: {
    title: 'Checklists', permission: 'checklists.manage', collection: 'checklists', search: ['folio', 'equipmentId', 'terminal'], folioPrefix: 'CHK', required: ['equipmentId', 'checklistType'],
    defaults: { answers: {}, hasDeviation: false, evidenceUrls: [] },
    fields: [['equipmentId', 'ID equipo'], ['operatorId', 'Operador'], ['terminal', 'Terminal'], ['checklistType', 'Tipo checklist'], ['observations', 'Observaciones', 'textarea']],
    columns: [{ key: 'folio', label: 'Folio' }, { key: 'equipmentId', label: 'Equipo' }, { key: 'operatorId', label: 'Operador' }, { key: 'terminal', label: 'Terminal' }, { key: 'createdAt', label: 'Fecha', render: row => formatDate(row.createdAt) }],
  },
  maintenancePlans: {
    title: 'Planes de mantenimiento', permission: 'maintenancePlans.manage', collection: 'maintenancePlans', search: ['name', 'equipmentType'], folioPrefix: 'PM', required: ['name', 'frequencyType', 'frequencyValue'],
    defaults: { active: true, tasks: [], equipmentIds: [] },
    fields: [['name', 'Nombre'], ['equipmentType', 'Tipo equipo'], ['frequencyType', 'Frecuencia', 'select', ['dias', 'horas', 'km']], ['frequencyValue', 'Valor frecuencia', 'number'], ['nextExecutionAt', 'Próxima ejecución', 'date']],
    columns: [{ key: 'name', label: 'Nombre' }, { key: 'equipmentType', label: 'Tipo equipo' }, { key: 'frequencyType', label: 'Frecuencia' }, { key: 'frequencyValue', label: 'Valor' }, { key: 'nextExecutionAt', label: 'Próxima', render: row => formatDate(row.nextExecutionAt) }],
  },
};

function EntityForm({ config, value, onChange, errors }) {
  return <div className="grid gap-4 md:grid-cols-2">{config.fields.map(([key, label, type = 'text', options]) => <FormField key={key} label={label} error={errors[key]}><Input fieldKey={key} type={type} options={options} value={value[key] ?? ''} onChange={next => onChange({ ...value, [key]: next })}/></FormField>)}</div>;
}
function Input({ fieldKey, type, options, value, onChange }) {
  if (type === 'select') return <select className={inputClass} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>;
  if (type === 'textarea') return <textarea className={inputClass} rows="3" value={value} onChange={event => onChange(event.target.value)} />;
  return <input className={inputClass} type={type} value={value} onChange={event => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} autoComplete={fieldKey === 'email' ? 'email' : 'off'} />;
}

export default function EntityPage({ type }) {
  const config = entityConfig[type];
  const { companyId, user } = useAuth();
  const { can } = usePermissions();
  const { data, loading } = useFirestoreCollection(config.collection, { orderBy: { field: 'createdAt', direction: 'desc' } });
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(config.defaults);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const canManage = can(config.permission);

  const filtered = useMemo(() => data.filter(item => !query || config.search.some(key => String(item[key] || '').toLowerCase().includes(query.toLowerCase()))), [data, query, config.search]);

  const openCreate = () => { setEditing({}); setForm(config.defaults); setErrors({}); };
  const openEdit = item => { setEditing(item); setForm({ ...config.defaults, ...item }); setErrors({}); };
  const close = () => setEditing(null);
  const save = async () => {
    const validation = config.validate ? config.validate(form) : validateRequiredFields(form, config.required || []);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    try {
      const payload = { ...form };
      if (!payload.folio && config.folioPrefix) payload.folio = await generateFolio(companyId, config.folioPrefix);
      if (editing?.id) await updateDocument(companyId, config.collection, editing.id, payload, user);
      else await createDocument(companyId, config.collection, payload, user);
      setToast({ type: 'success', message: 'Registro guardado correctamente.' });
      close();
    } catch (error) { setToast({ type: 'error', message: handleError(error) }); }
  };
  const remove = async item => {
    if (!window.confirm('¿Eliminar este registro? Esta acción generará auditoría.')) return;
    try { await deleteDocument(companyId, config.collection, item.id, user); setToast({ type: 'success', message: 'Registro eliminado.' }); } catch (error) { setToast({ type: 'error', message: handleError(error) }); }
  };

  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><input className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2 text-sm" placeholder="Buscar por folio, equipo, estado o fecha..." value={query} onChange={event => setQuery(event.target.value)} />{canManage && <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Nuevo</button>}</div>{loading ? <LoadingState/> : <DataTable columns={config.columns} rows={filtered} actions={canManage ? row => <div className="flex justify-end gap-2"><button onClick={() => openEdit(row)} className="rounded-lg border px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Editar</button><button onClick={() => remove(row)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button></div> : null}/>} {editing && <Modal title={editing.id ? `Editar ${config.title}` : `Nuevo ${config.title}`} onClose={close} wide><EntityForm config={config} value={form} onChange={setForm} errors={errors}/><div className="mt-6 flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={close}>Cancelar</button><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button></div></Modal>}<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/></section>;
}
