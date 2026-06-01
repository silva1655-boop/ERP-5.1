export default function FilterBar({
  filters,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  statusOptions = [],
  priorityOptions = [],
  typeOptions = [],
  showDates = true,
}) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 xl:col-span-2" value={filters.text || ''} onChange={event => update('text', event.target.value)} placeholder={placeholder}/>
      {statusOptions.length > 0 && <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={filters.status || ''} onChange={event => update('status', event.target.value)}><option value="">Todos los estados</option>{statusOptions.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select>}
      {priorityOptions.length > 0 && <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={filters.priority || ''} onChange={event => update('priority', event.target.value)}><option value="">Todas las prioridades</option>{priorityOptions.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select>}
      {typeOptions.length > 0 && <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={filters.type || ''} onChange={event => update('type', event.target.value)}><option value="">Todos los tipos</option>{typeOptions.map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select>}
      {showDates && <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" type="date" value={filters.dateFrom || ''} onChange={event => update('dateFrom', event.target.value)}/>} 
      {showDates && <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" type="date" value={filters.dateTo || ''} onChange={event => update('dateTo', event.target.value)}/>} 
      <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={onClear}>Limpiar filtros</button>
    </div>
  </div>;
}
