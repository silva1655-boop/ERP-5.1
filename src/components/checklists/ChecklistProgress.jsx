const counters = answers => Object.values(answers || {}).reduce((acc, answer) => {
  const status = answer?.status || 'pending';
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, { good: 0, conditional: 0, bad: 0, na: 0, pending: 0 });

export default function ChecklistProgress({ total, answers }) {
  const counts = counters(answers);
  const completed = counts.good + counts.conditional + counts.bad + counts.na;
  const pending = Math.max(total - completed, 0);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const chips = [
    ['Buenos', counts.good, 'bg-emerald-100 text-emerald-700'],
    ['Condicionales', counts.conditional, 'bg-amber-100 text-amber-700'],
    ['Malos', counts.bad, 'bg-red-100 text-red-700'],
    ['Pendientes', pending, 'bg-slate-100 text-slate-600'],
  ];
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">Progreso de inspección</p><p className="text-xs text-slate-500">{completed} de {total} ítems respondidos</p></div><span className="text-lg font-bold text-blue-700">{pct}%</span></div>
    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }}/></div>
    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">{chips.map(([label, value, className]) => <span key={label} className={`rounded-xl px-3 py-2 text-xs font-semibold ${className}`}>{label}: {value}</span>)}</div>
  </div>;
}
