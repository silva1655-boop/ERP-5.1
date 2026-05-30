import { checklistTemplateOptions } from '../../utils/checklistTemplates';

export default function ChecklistTemplateSelector({ value, onChange }) {
  return <div className="grid gap-3 md:grid-cols-2">{checklistTemplateOptions.map(option => {
    const selected = value === option.value;
    return <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`rounded-2xl border p-4 text-left shadow-sm transition ${selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}>
      <p className="text-sm font-bold text-slate-900">{option.label}</p>
      <p className="mt-1 text-xs text-slate-500">{option.description}</p>
    </button>;
  })}</div>;
}
