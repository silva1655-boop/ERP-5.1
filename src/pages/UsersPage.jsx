import { useMemo, useState } from 'react';
import DataTable from '../components/tables/DataTable';
import Modal from '../components/modals/Modal';
import FormField, { inputClass } from '../components/forms/FormField';
import Toast from '../components/common/Toast';
import Badge from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { createDocument, updateDocument } from '../services/firestoreService';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { handleError } from '../utils/errorHandler';
import { isValidEmail, isValidRole, validateRequiredFields } from '../utils/validators';

const empty = { uid: '', name: '', email: '', role: 'operador', terminal: '', active: true };

export default function UsersPage() {
  const { companyId, user } = useAuth();
  const { data } = useFirestoreCollection('users');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const filtered = useMemo(() => data.filter(item => !query || [item.name, item.email, item.role, item.terminal].some(value => String(value || '').toLowerCase().includes(query.toLowerCase()))), [data, query]);
  const save = async () => {
    const nextErrors = validateRequiredFields(form, ['uid', 'name', 'email', 'role']);
    if (!isValidEmail(form.email)) nextErrors.email = 'Email inválido';
    if (!isValidRole(form.role)) nextErrors.role = 'Rol inválido';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const payload = { ...form, companyId };
    try {
      if (editing?.id) await updateDocument(companyId, 'users', editing.id, payload, user);
      else await createDocument(companyId, 'users', payload, user, form.uid);
      setToast({ message: 'Usuario guardado.' }); setEditing(null);
    } catch (error) { setToast({ type: 'error', message: handleError(error) }); }
  };
  return <section className="space-y-4"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">La creación de credenciales debe realizarse en Firebase Authentication o mediante un backend seguro con Admin SDK. Esta pantalla administra el perfil multiempresa y permite asignar correctamente roles operador y mecánico.</div><div className="flex justify-between gap-3"><input className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2 text-sm" placeholder="Buscar usuarios..." value={query} onChange={event => setQuery(event.target.value)}/><button onClick={() => { setEditing({}); setForm(empty); }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Nuevo perfil</button></div><DataTable rows={filtered} columns={[{key:'name',label:'Nombre'}, {key:'email',label:'Email'}, {key:'role',label:'Rol', render: row => ROLE_LABELS[row.role] || row.role}, {key:'terminal',label:'Terminal'}, {key:'active',label:'Estado', render: row => <Badge value={row.active ? 'activo' : 'inactivo'}/>}]} actions={row => <button onClick={() => { setEditing(row); setForm({ ...empty, ...row }); }} className="rounded-lg border px-3 py-1 text-xs font-semibold">Editar</button>}/>{editing && <Modal title="Perfil de usuario" onClose={() => setEditing(null)}><div className="space-y-4"><FormField label="UID Firebase Auth" error={errors.uid}><input className={inputClass} value={form.uid} disabled={Boolean(editing.id)} onChange={event => setForm({ ...form, uid: event.target.value })}/></FormField><FormField label="Nombre" error={errors.name}><input className={inputClass} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></FormField><FormField label="Email" error={errors.email}><input className={inputClass} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></FormField><FormField label="Rol" error={errors.role}><select className={inputClass} value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>{ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></FormField><FormField label="Terminal"><input className={inputClass} value={form.terminal || ''} onChange={event => setForm({ ...form, terminal: event.target.value })}/></FormField><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })}/> Usuario activo</label><div className="flex justify-end gap-2"><button className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={() => setEditing(null)}>Cancelar</button><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button></div></div></Modal>}<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/></section>;
}
