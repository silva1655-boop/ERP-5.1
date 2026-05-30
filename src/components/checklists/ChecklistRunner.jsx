import { useMemo, useState } from 'react';
import FormField, { inputClass } from '../forms/FormField';
import ChecklistTemplateSelector from './ChecklistTemplateSelector';
import ChecklistProgress from './ChecklistProgress';
import ChecklistItemCard from './ChecklistItemCard';
import ChecklistSummary from './ChecklistSummary';
import { getChecklistTemplate } from '../../utils/checklistTemplates';
import { savePreoperationalChecklist, buildChecklistFindings } from '../../services/checklistService';
import { handleError } from '../../utils/errorHandler';

const displayName = user => user?.name || user?.email || 'Usuario';

export default function ChecklistRunner({ companyId, user, equipment, canOverrideHourmeter, onSaved }) {
  const [templateId, setTemplateId] = useState('tracto');
  const template = getChecklistTemplate(templateId);
  const [form, setForm] = useState({ equipmentId: '', hourmeter: '', fuelLevel: '', terminal: user?.terminal || '', shift: '', vesselOrTask: '', observations: '' });
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedEquipment = equipment.find(item => item.id === form.equipmentId) || null;

  const findings = useMemo(() => buildChecklistFindings(template, answers), [template, answers]);
  const groupedItems = useMemo(() => template.sections.map(section => ({ section, items: template.items.filter(item => item.section === section) })).filter(group => group.items.length), [template]);

  const setEquipment = equipmentId => {
    const next = equipment.find(item => item.id === equipmentId);
    setForm(prev => ({ ...prev, equipmentId, terminal: prev.terminal || next?.terminal || '', hourmeter: next?.hourmeter ?? prev.hourmeter }));
  };

  const validate = () => {
    if (!selectedEquipment) return 'Debe seleccionar un equipo.';
    if (form.hourmeter === '' || Number.isNaN(Number(form.hourmeter))) return 'Debe ingresar un horómetro numérico.';
    const currentHourmeter = Number(selectedEquipment.hourmeter || selectedEquipment.horometroActual || 0);
    if (!canOverrideHourmeter && Number(form.hourmeter) < currentHourmeter) return `El horómetro no puede ser menor al actual (${currentHourmeter}).`;
    const missing = template.items.find(item => !answers[item.id]?.status);
    if (missing) return `Falta responder: ${missing.name}.`;
    const missingObservation = findings.find(item => !item.observation?.trim());
    if (missingObservation) return `Debe ingresar observación obligatoria para: ${missingObservation.name}.`;
    const missingPhoto = template.items.find(item => answers[item.id]?.status === 'bad' && !answers[item.id]?.photoFile && !answers[item.id]?.photoMeta);
    if (missingPhoto) return `Debe adjuntar foto obligatoria para el ítem Malo: ${missingPhoto.name}.`;
    return '';
  };

  const save = async () => {
    const validation = validate();
    if (validation) { setError(validation); return; }
    const hasCritical = findings.some(item => item.status === 'bad' || item.priority === 'alta');
    if (hasCritical && !window.confirm('Existe al menos un ítem Malo o prioridad alta. La inspección quedará crítica y puede dejar el equipo fuera de servicio. ¿Deseas continuar?')) return;
    setSaving(true);
    setError('');
    try {
      const result = await savePreoperationalChecklist({ companyId, template, form, answers, equipment: selectedEquipment, user });
      setAnswers({});
      setForm({ equipmentId: '', hourmeter: '', fuelLevel: '', terminal: user?.terminal || '', shift: '', vesselOrTask: '', observations: '' });
      onSaved?.(result);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs uppercase tracking-[0.2em] text-blue-100">Inspección preoperacional</p><h3 className="text-xl font-extrabold">Checklist {template.label}</h3><p className="mt-1 text-sm text-blue-100">Diseñado para captura rápida desde celular o tablet.</p></div>
          <p className="rounded-xl bg-white/15 px-3 py-2 text-sm">Operador: <b>{displayName(user)}</b></p>
        </div>
      </div>
      <div className="p-4"><ChecklistTemplateSelector value={templateId} onChange={next => { setTemplateId(next); setAnswers({}); }}/></div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-900">Identificación del equipo</h4><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{new Date().toLocaleString('es-CL')}</span></div>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <FormField label="Equipo / TAG"><select className={inputClass} value={form.equipmentId} onChange={event => setEquipment(event.target.value)}><option value="">Seleccione equipo</option>{equipment.map(item => <option key={item.id} value={item.id}>{item.code || item.id} · {item.name || item.type || 'Equipo'} · {item.status || 's/e'}</option>)}</select></FormField>
        <FormField label="Horómetro actual"><input className={inputClass} type="number" value={form.hourmeter} onChange={event => setForm({ ...form, hourmeter: event.target.value })}/></FormField>
        <FormField label={template.fuelLabel}><select className={inputClass} value={form.fuelLevel} onChange={event => setForm({ ...form, fuelLevel: event.target.value })}><option value="">Seleccione</option>{template.fuelOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></FormField>
        <FormField label="Terminal"><input className={inputClass} value={form.terminal} onChange={event => setForm({ ...form, terminal: event.target.value })}/></FormField>
        <FormField label="Turno"><input className={inputClass} value={form.shift} onChange={event => setForm({ ...form, shift: event.target.value })} placeholder="Opcional"/></FormField>
        <FormField label="Buque / faena"><input className={inputClass} value={form.vesselOrTask} onChange={event => setForm({ ...form, vesselOrTask: event.target.value })} placeholder="Opcional"/></FormField>
      </div>
      {selectedEquipment && <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-4"><span><b>TAG:</b> {selectedEquipment.code || selectedEquipment.id}</span><span><b>Nombre:</b> {selectedEquipment.name || '—'}</span><span><b>Estado:</b> {selectedEquipment.status || '—'}</span><span><b>Horómetro previo:</b> {selectedEquipment.hourmeter ?? selectedEquipment.horometroActual ?? 0}</span></div>}
    </div>

    <ChecklistProgress total={template.items.length} answers={answers}/>

    {groupedItems.map(group => {
      const answered = group.items.filter(item => answers[item.id]?.status).length;
      return <section key={group.section} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:p-4"><div className="sticky top-0 z-10 -mx-3 -mt-3 rounded-t-2xl border-b border-slate-200 bg-slate-50/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:-mt-4 sm:px-4"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-900">{group.section}</h4><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{answered}/{group.items.length}</span></div></div>{group.items.map(item => <ChecklistItemCard key={item.id} item={item} answer={answers[item.id]} onChange={next => setAnswers(prev => ({ ...prev, [item.id]: next }))}/>)}</section>;
    })}

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><FormField label="Observaciones finales"><textarea className={inputClass} rows="3" value={form.observations} onChange={event => setForm({ ...form, observations: event.target.value })}/></FormField></div>
    <ChecklistSummary findings={findings}/>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="flex justify-end"><button disabled={saving} onClick={save} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">{saving ? 'Guardando...' : findings.length ? 'Guardar y crear hallazgos' : 'Guardar checklist'}</button></div>
  </div>;
}
