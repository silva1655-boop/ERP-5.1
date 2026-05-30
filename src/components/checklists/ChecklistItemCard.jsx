import { inputClass } from '../forms/FormField';

const buttonStyles = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100',
  conditional: 'border-amber-200 bg-amber-50 text-amber-700 ring-amber-100',
  bad: 'border-red-200 bg-red-50 text-red-700 ring-red-100',
  na: 'border-slate-200 bg-slate-50 text-slate-600 ring-slate-100',
};

const statusHelp = {
  good: 'Sin observación requerida.',
  conditional: 'Requiere observación. Foto opcional.',
  bad: 'Requiere observación y foto obligatoria.',
  na: 'No aplica para este equipo/condición.',
};

export default function ChecklistItemCard({ item, answer = {}, onChange }) {
  const status = answer.status || '';
  const hasFinding = ['conditional', 'bad'].includes(status);
  const patch = next => onChange({ ...answer, ...next });
  const selectStatus = key => patch({
    status: key,
    priority: key === 'bad' ? 'alta' : key === 'conditional' ? (answer.priority || 'media') : '',
    observation: ['good', 'na'].includes(key) ? '' : answer.observation,
    recommendation: ['good', 'na'].includes(key) ? '' : answer.recommendation,
  });

  return <article className={`rounded-2xl border bg-white p-4 shadow-sm ${status === 'bad' ? 'border-red-200' : status === 'conditional' ? 'border-amber-200' : 'border-slate-200'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{item.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.method}</p></div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.criticality === 'alta' ? 'bg-red-100 text-red-700' : item.criticality === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>Crit. {item.criticality}</span>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-4">{[
      ['good', 'Bueno'], ['conditional', 'Condicional'], ['bad', 'Malo'], ['na', 'No aplica'],
    ].map(([key, label]) => <button key={key} type="button" onClick={() => selectStatus(key)} className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition ${buttonStyles[key]} ${status === key ? 'ring-2' : 'opacity-80 hover:opacity-100'}`}>{label}</button>)}</div>
    {status && <p className={`mt-2 text-xs font-medium ${status === 'bad' ? 'text-red-700' : status === 'conditional' ? 'text-amber-700' : 'text-slate-500'}`}>{statusHelp[status]}</p>}
    <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-700">Criterios de evaluación</summary>
      <div className="mt-2 grid gap-2 md:grid-cols-3"><p><b>Bueno:</b> {item.criteria.good}</p><p><b>Condicional:</b> {item.criteria.conditional}</p><p><b>Malo:</b> {item.criteria.bad}</p></div>
    </details>
    {item.hasLevel && <div className="mt-3"><label className="text-xs font-semibold text-slate-600">Nivel / porcentaje</label><input className={inputClass} type="number" min="0" max="100" value={answer.level || ''} onChange={event => patch({ level: event.target.value })} placeholder="0 - 100"/></div>}
    {hasFinding && <div className="mt-3 grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Observación obligatoria</label><textarea className={inputClass} rows="2" value={answer.observation || ''} onChange={event => patch({ observation: event.target.value })} placeholder="Describe la condición encontrada y el riesgo operacional"/></div>
      <div><label className="text-xs font-semibold text-slate-600">Prioridad</label><select className={inputClass} value={answer.priority || (status === 'bad' ? 'alta' : 'media')} onChange={event => patch({ priority: event.target.value })}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div>
      <div><label className="text-xs font-semibold text-slate-600">Foto / evidencia {status === 'bad' ? '(obligatoria)' : '(opcional)'}</label><input className={inputClass} type="file" accept="image/*" onChange={event => patch({ photoFile: event.target.files?.[0] || null })}/>{answer.photoFile && <p className="mt-1 text-xs text-slate-500">{answer.photoFile.name}</p>}</div>
      <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600">Recomendación</label><input className={inputClass} value={answer.recommendation || ''} onChange={event => patch({ recommendation: event.target.value })} placeholder="Acción sugerida"/></div>
    </div>}
  </article>;
}
