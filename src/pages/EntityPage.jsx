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

const CHECKLIST_SECTIONS = [
  { title: 'Identificación del equipo', items: [{ key: 'identificacion_visual', label: 'Identificación visible y legible' }, { key: 'documentacion', label: 'Documentación / permiso operativo disponible' }] },
  { title: 'Niveles de fluidos', items: [{ key: 'aceite_motor', label: 'Nivel de aceite de motor' }, { key: 'refrigerante', label: 'Nivel de refrigerante' }, { key: 'hidraulico', label: 'Nivel de aceite hidráulico' }] },
  { title: 'Sistema eléctrico / luces', items: [{ key: 'luces_frontales', label: 'Luces frontales y traseras' }, { key: 'baliza', label: 'Baliza / alarma de retroceso' }, { key: 'bateria', label: 'Batería y conexiones' }] },
  { title: 'Neumáticos', items: [{ key: 'presion_neumaticos', label: 'Presión de neumáticos' }, { key: 'estado_neumaticos', label: 'Estado general de neumáticos' }] },
  { title: 'Frenos / aire', items: [{ key: 'freno_servicio', label: 'Freno de servicio' }, { key: 'freno_estacionamiento', label: 'Freno de estacionamiento' }, { key: 'sistema_aire', label: 'Sistema de aire sin fugas' }] },
  { title: 'Seguridad', items: [{ key: 'extintor', label: 'Extintor vigente' }, { key: 'cinturon', label: 'Cinturón de seguridad' }, { key: 'elementos_seguridad', label: 'Elementos de seguridad completos' }] },
];

const requestEditableStatuses = ['pendiente'];
const checklistAnswers = ['OK', 'Observación', 'No aplica'];

const entityConfig = {
  equipment: {
    title: 'Equipos',
    permission: 'equipment.manage',
    viewPermissions: ['equipment.view', 'equipment.manage'],
    createPermissions: ['equipment.manage'],
    editPermissions: ['equipment.manage'],
    deletePermissions: ['equipment.manage'],
    collection: 'equipment',
    search: ['code', 'name', 'status', 'terminal'],
    required: ['code', 'name', 'type', 'status'],
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
    title: 'Órdenes de trabajo',
    permission: 'workOrders.manage',
    viewPermissions: ['workOrders.view', 'workOrders.manage', 'workOrders.viewAssigned'],
    createPermissions: ['workOrders.manage'],
    editPermissions: ['workOrders.manage', 'workOrders.updateAssigned'],
    deletePermissions: ['workOrders.manage'],
    collection: 'workOrders',
    search: ['folio', 'title', 'status', 'equipmentCode'],
    folioPrefix: 'OT',
    required: ['title', 'equipmentId', 'priority', 'status'],
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
    title: 'Solicitudes',
    permission: 'requests.manage',
    viewPermissions: ['requests.view', 'requests.manage', 'requests.approve'],
    createPermissions: ['requests.create', 'requests.manage'],
    editPermissions: ['requests.manage'],
    deletePermissions: ['requests.manage'],
    approvePermissions: ['requests.approve', 'requests.manage'],
    collection: 'requests',
    search: ['folio', 'title', 'status', 'equipmentCode', 'terminal', 'requestedBy'],
    folioPrefix: 'SOL',
    required: ['title', 'equipmentId', 'priority'],
    defaults: { status: 'pendiente', priority: 'media', evidenceUrls: [], observations: '' },
    columns: [
      { key: 'folio', label: 'Folio' }, { key: 'title', label: 'Título' }, { key: 'equipmentCode', label: 'Equipo' }, { key: 'terminal', label: 'Terminal' }, { key: 'requestedBy', label: 'Solicitado por' }, { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> }, { key: 'priority', label: 'Prioridad', render: row => <Badge value={row.priority}/> },
    ],
  },
  checklists: {
    title: 'Checklists',
    permission: 'checklists.manage',
    viewPermissions: ['checklists.view', 'checklists.create', 'checklists.manage'],
    createPermissions: ['checklists.create', 'checklists.manage'],
    editPermissions: ['checklists.manage'],
    deletePermissions: ['checklists.manage'],
    collection: 'checklists',
    search: ['folio', 'equipmentId', 'equipmentCode', 'terminal', 'operatorName', 'status'],
    folioPrefix: 'CHK',
    required: ['equipmentId', 'checklistType'],
    defaults: { answers: {}, observations: '', hasDeviation: false, evidenceUrls: [], status: 'completado' },
    columns: [
      { key: 'folio', label: 'Folio' }, { key: 'equipmentCode', label: 'Equipo' }, { key: 'operatorName', label: 'Operador' }, { key: 'terminal', label: 'Terminal' }, { key: 'status', label: 'Estado', render: row => <Badge value={row.status}/> }, { key: 'hasDeviation', label: 'Desv.', render: row => row.hasDeviation ? <Badge value="observación"/> : '—' }, { key: 'createdAt', label: 'Fecha', render: row => formatDate(row.createdAt) },
    ],
  },
  maintenancePlans: {
    title: 'Planes de mantenimiento',
    permission: 'maintenancePlans.manage',
    viewPermissions: ['maintenancePlans.manage'],
    createPermissions: ['maintenancePlans.manage'],
    editPermissions: ['maintenancePlans.manage'],
    deletePermissions: ['maintenancePlans.manage'],
    collection: 'maintenancePlans',
    search: ['name', 'equipmentType'],
    folioPrefix: 'PM',
    required: ['name', 'frequencyType', 'frequencyValue'],
    defaults: { active: true, tasks: [], equipmentIds: [] },
    fields: [['name', 'Nombre'], ['equipmentType', 'Tipo equipo'], ['frequencyType', 'Frecuencia', 'select', ['dias', 'horas', 'km']], ['frequencyValue', 'Valor frecuencia', 'number'], ['nextExecutionAt', 'Próxima ejecución', 'date']],
    columns: [{ key: 'name', label: 'Nombre' }, { key: 'equipmentType', label: 'Tipo equipo' }, { key: 'frequencyType', label: 'Frecuencia' }, { key: 'frequencyValue', label: 'Valor' }, { key: 'nextExecutionAt', label: 'Próxima', render: row => formatDate(row.nextExecutionAt) }],
  },
};

const userDisplayName = user => user?.name || user?.email || 'Usuario autenticado';

function selectEquipment(equipment, equipmentId) {
  return equipment.find(item => item.id === equipmentId || item.code === equipmentId) || null;
}

function getDefaultForm(config, type, user) {
  if (type === 'requests') {
    return { ...config.defaults, requestedBy: userDisplayName(user), requestedById: user?.uid || '', terminal: user?.terminal || '' };
  }
  if (type === 'checklists') {
    return { ...config.defaults, operatorId: user?.uid || '', operatorName: userDisplayName(user), terminal: user?.terminal || '', checklistType: 'preoperacional' };
  }
  return { ...config.defaults };
}

function EntityForm({ config, type, value, onChange, errors, equipment, canChangeStatus }) {
  if (type === 'requests') return <RequestForm value={value} onChange={onChange} errors={errors} equipment={equipment} canChangeStatus={canChangeStatus}/>;
  if (type === 'checklists') return <ChecklistForm value={value} onChange={onChange} errors={errors} equipment={equipment}/>;
  return <div className="grid gap-4 md:grid-cols-2">{config.fields.map(([key, label, fieldType = 'text', options]) => <FormField key={key} label={label} error={errors[key]}><Input fieldKey={key} type={fieldType} options={options} value={value[key] ?? ''} onChange={next => onChange({ ...value, [key]: next })}/></FormField>)}</div>;
}

function Input({ fieldKey, type, options, value, onChange, disabled = false }) {
  if (type === 'select') return <select className={inputClass} value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>;
  if (type === 'textarea') return <textarea className={inputClass} rows="3" value={value} onChange={event => onChange(event.target.value)} disabled={disabled} />;
  return <input className={inputClass} type={type} value={value} onChange={event => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} autoComplete={fieldKey === 'email' ? 'email' : 'off'} disabled={disabled} />;
}

function RequestForm({ value, onChange, errors, equipment, canChangeStatus }) {
  const selectedEquipment = selectEquipment(equipment, value.equipmentId);
  const setEquipment = equipmentId => {
    const nextEquipment = selectEquipment(equipment, equipmentId);
    onChange({ ...value, equipmentId, equipmentCode: nextEquipment?.code || '', terminal: value.terminal || nextEquipment?.terminal || '' });
  };
  return <div className="grid gap-4 md:grid-cols-2">
    <FormField label="Título" error={errors.title}><Input fieldKey="title" type="text" value={value.title || ''} onChange={next => onChange({ ...value, title: next })}/></FormField>
    <FormField label="Equipo" error={errors.equipmentId}><select className={inputClass} value={value.equipmentId || ''} onChange={event => setEquipment(event.target.value)}><option value="">Seleccione equipo</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ${item.name || item.type || item.id}` : item.name || item.id}</option>)}</select></FormField>
    <FormField label="Código de equipo"><Input fieldKey="equipmentCode" type="text" value={value.equipmentCode || selectedEquipment?.code || ''} onChange={next => onChange({ ...value, equipmentCode: next })}/></FormField>
    <FormField label="Prioridad" error={errors.priority}><Input fieldKey="priority" type="select" options={PRIORITIES} value={value.priority || 'media'} onChange={next => onChange({ ...value, priority: next })}/></FormField>
    <FormField label="Terminal"><Input fieldKey="terminal" type="text" value={value.terminal || ''} onChange={next => onChange({ ...value, terminal: next })}/></FormField>
    <FormField label="Solicitado por"><Input fieldKey="requestedBy" type="text" value={value.requestedBy || ''} onChange={next => onChange({ ...value, requestedBy: next })}/></FormField>
    {canChangeStatus && <FormField label="Estado"><Input fieldKey="status" type="select" options={REQUEST_STATUS} value={value.status || 'pendiente'} onChange={next => onChange({ ...value, status: next })}/></FormField>}
    <div className="md:col-span-2"><FormField label="Descripción"><Input fieldKey="description" type="textarea" value={value.description || ''} onChange={next => onChange({ ...value, description: next })}/></FormField></div>
    <div className="md:col-span-2"><FormField label="Observaciones"><Input fieldKey="observations" type="textarea" value={value.observations || ''} onChange={next => onChange({ ...value, observations: next })}/></FormField></div>
    {canChangeStatus && <div className="md:col-span-2"><FormField label="Motivo rechazo"><Input fieldKey="rejectionReason" type="textarea" value={value.rejectionReason || ''} onChange={next => onChange({ ...value, rejectionReason: next })}/></FormField></div>}
  </div>;
}

function ChecklistForm({ value, onChange, errors, equipment }) {
  const setAnswer = (key, patch) => onChange({ ...value, answers: { ...(value.answers || {}), [key]: { ...(value.answers?.[key] || { value: 'OK', observation: '' }), ...patch } } });
  const setEquipment = equipmentId => {
    const nextEquipment = selectEquipment(equipment, equipmentId);
    onChange({ ...value, equipmentId, equipmentCode: nextEquipment?.code || '', terminal: value.terminal || nextEquipment?.terminal || '' });
  };
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Equipo" error={errors.equipmentId}><select className={inputClass} value={value.equipmentId || ''} onChange={event => setEquipment(event.target.value)}><option value="">Seleccione equipo</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.code ? `${item.code} · ${item.name || item.type || item.id}` : item.name || item.id}</option>)}</select></FormField>
      <FormField label="Tipo checklist" error={errors.checklistType}><Input fieldKey="checklistType" type="select" options={['preoperacional', 'diario', 'semanal', 'seguridad']} value={value.checklistType || 'preoperacional'} onChange={next => onChange({ ...value, checklistType: next })}/></FormField>
      <FormField label="Código de equipo"><Input fieldKey="equipmentCode" type="text" value={value.equipmentCode || ''} onChange={next => onChange({ ...value, equipmentCode: next })}/></FormField>
      <FormField label="Terminal"><Input fieldKey="terminal" type="text" value={value.terminal || ''} onChange={next => onChange({ ...value, terminal: next })}/></FormField>
      <FormField label="Operador"><Input fieldKey="operatorName" type="text" value={value.operatorName || ''} onChange={next => onChange({ ...value, operatorName: next })}/></FormField>
    </div>
    {CHECKLIST_SECTIONS.map(section => <div key={section.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-800">{section.title}</h4>
      <div className="mt-3 space-y-3">{section.items.map(item => {
        const current = value.answers?.[item.key] || { value: 'OK', observation: '' };
        return <div key={item.key} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_170px]">
            <p className="text-sm font-medium text-slate-700">{item.label}</p>
            <select className={inputClass} value={current.value} onChange={event => setAnswer(item.key, { value: event.target.value })}>{checklistAnswers.map(answer => <option key={answer} value={answer}>{answer}</option>)}</select>
          </div>
          {(current.value === 'Observación' || current.observation) && <textarea className={`${inputClass} mt-3`} rows="2" placeholder="Observación del ítem" value={current.observation || ''} onChange={event => setAnswer(item.key, { observation: event.target.value })}/>}
        </div>;
      })}</div>
    </div>)}
    <FormField label="Observaciones finales"><Input fieldKey="observations" type="textarea" value={value.observations || ''} onChange={next => onChange({ ...value, observations: next })}/></FormField>
  </div>;
}

function buildPayload({ type, config, form, user, canChangeStatus, equipment }) {
  const payload = { ...form };
  const chosenEquipment = selectEquipment(equipment, payload.equipmentId);
  if (chosenEquipment) payload.equipmentCode = payload.equipmentCode || chosenEquipment.code || '';

  if (type === 'requests') {
    payload.status = canChangeStatus ? (payload.status || 'pendiente') : 'pendiente';
    payload.requestedBy = payload.requestedBy || userDisplayName(user);
    payload.requestedById = payload.requestedById || user?.uid || '';
    payload.terminal = payload.terminal || user?.terminal || chosenEquipment?.terminal || '';
    payload.evidenceUrls = payload.evidenceUrls || [];
  }

  if (type === 'checklists') {
    const answers = payload.answers || {};
    const hasDeviation = Object.values(answers).some(answer => answer?.value === 'Observación');
    payload.operatorId = payload.operatorId || user?.uid || '';
    payload.operatorName = payload.operatorName || userDisplayName(user);
    payload.terminal = payload.terminal || user?.terminal || chosenEquipment?.terminal || '';
    payload.hasDeviation = hasDeviation;
    payload.status = hasDeviation ? 'pendiente_revision' : 'completado';
    payload.evidenceUrls = payload.evidenceUrls || [];
  }

  config.required?.forEach(key => { if (typeof payload[key] === 'string') payload[key] = payload[key].trim(); });
  return payload;
}

export default function EntityPage({ type }) {
  const config = entityConfig[type];
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  const { data, loading } = useFirestoreCollection(config.collection, { orderBy: { field: 'createdAt', direction: 'desc' } });
  const { data: equipment } = useFirestoreCollection('equipment', { orderBy: { field: 'code', direction: 'asc' } });
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(getDefaultForm(config, type, user));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const canView = canAny(config.viewPermissions || [config.permission]);
  const canCreate = canAny(config.createPermissions || [config.permission]);
  const canEditBase = canAny(config.editPermissions || [config.permission]);
  const canDelete = canAny(config.deletePermissions || [config.permission]);
  const canApprove = canAny(config.approvePermissions || []);
  const canChangeStatus = type !== 'requests' || canApprove || canAny(['requests.manage']);

  const canEditRow = item => {
    if (!canEditBase) return false;
    if (type === 'checklists' && item.operatorId && item.operatorId !== user?.uid && !canAny(['checklists.manage'])) return false;
    if (type === 'checklists' && item.status && item.status !== 'pendiente' && !canAny(['checklists.manage'])) return false;
    if (type === 'workOrders' && canAny(['workOrders.updateAssigned']) && !canAny(['workOrders.manage'])) return item.assignedTo === user?.uid || item.assignedTo === userDisplayName(user);
    return true;
  };

  const filtered = useMemo(() => data.filter(item => !query || config.search.some(key => String(item[key] || '').toLowerCase().includes(query.toLowerCase()))), [data, query, config.search]);

  const openCreate = () => { setEditing({}); setForm(getDefaultForm(config, type, user)); setErrors({}); };
  const openEdit = item => { setEditing(item); setForm({ ...getDefaultForm(config, type, user), ...item }); setErrors({}); };
  const close = () => setEditing(null);
  const save = async () => {
    const payload = buildPayload({ type, config, form, user, canChangeStatus, equipment });
    const validation = config.validate ? config.validate(payload) : validateRequiredFields(payload, config.required || []);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    try {
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
  const approveRequest = async (item, status) => {
    try {
      await updateDocument(companyId, config.collection, item.id, { ...item, status, approvedBy: status === 'aprobada' ? userDisplayName(user) : item.approvedBy, rejectedBy: status === 'rechazada' ? userDisplayName(user) : item.rejectedBy }, user);
      setToast({ type: 'success', message: status === 'aprobada' ? 'Solicitud aprobada.' : 'Solicitud rechazada.' });
    } catch (error) { setToast({ type: 'error', message: handleError(error) }); }
  };

  if (!canView) return <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No tienes permisos para ver este módulo.</section>;

  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><input className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2 text-sm" placeholder="Buscar por folio, equipo, estado o fecha..." value={query} onChange={event => setQuery(event.target.value)} />{canCreate && <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Nuevo</button>}</div>{loading ? <LoadingState/> : <DataTable columns={config.columns} rows={filtered} actions={(canEditBase || canDelete || canApprove) ? row => {
    const canEditThisRow = canEditRow(row);
    const showApprove = type === 'requests' && canApprove && requestEditableStatuses.includes(row.status || 'pendiente');
    if (!canEditThisRow && !canDelete && !showApprove) return null;
    return <div className="flex justify-end gap-2">{canEditThisRow && <button onClick={() => openEdit(row)} className="rounded-lg border px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Editar</button>}{showApprove && <button onClick={() => approveRequest(row, 'aprobada')} className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Aprobar</button>}{showApprove && <button onClick={() => approveRequest(row, 'rechazada')} className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">Rechazar</button>}{canDelete && <button onClick={() => remove(row)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Eliminar</button>}</div>;
  } : null}/>} {editing && <Modal title={editing.id ? `Editar ${config.title}` : `Nuevo ${config.title}`} onClose={close} wide><EntityForm config={config} type={type} value={form} onChange={setForm} errors={errors} equipment={equipment} canChangeStatus={canChangeStatus}/><div className="mt-6 flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={close}>Cancelar</button><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button></div></Modal>}<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/></section>;
}
