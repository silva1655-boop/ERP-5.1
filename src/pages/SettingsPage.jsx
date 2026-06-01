import { useState } from 'react';
import FormField, { inputClass } from '../components/forms/FormField';
import Toast from '../components/common/Toast';
import { useAuth } from '../hooks/useAuth.jsx';
import { saveCompanySettings } from '../services/firestoreService';
import { handleError } from '../utils/errorHandler';

export default function SettingsPage() {
  const { companyId, user, companySettings, setCompanySettings } = useAuth();
  const [form, setForm] = useState(companySettings);
  const [toast, setToast] = useState(null);
  const save = async () => {
    try { await saveCompanySettings(companyId, form, user); setCompanySettings(form); setToast({ message: 'Configuración guardada.' }); } catch (error) { setToast({ type:'error', message: handleError(error) }); }
  };
  return <section className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><FormField label="Nombre empresa"><input className={inputClass} value={form.companyName || ''} onChange={event => setForm({ ...form, companyName: event.target.value })}/></FormField><FormField label="Logo URL"><input className={inputClass} value={form.logoUrl || ''} onChange={event => setForm({ ...form, logoUrl: event.target.value })}/></FormField><FormField label="Color primario"><input className={inputClass} type="color" value={form.primaryColor || '#0f3b82'} onChange={event => setForm({ ...form, primaryColor: event.target.value })}/></FormField><FormField label="Color secundario"><input className={inputClass} type="color" value={form.secondaryColor || '#0ea5e9'} onChange={event => setForm({ ...form, secondaryColor: event.target.value })}/></FormField><FormField label="Zona horaria"><input className={inputClass} value={form.timezone || ''} onChange={event => setForm({ ...form, timezone: event.target.value })}/></FormField><FormField label="Moneda"><input className={inputClass} value={form.currency || ''} onChange={event => setForm({ ...form, currency: event.target.value })}/></FormField></div><button onClick={save} className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Guardar configuración</button><Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/></section>;
}
