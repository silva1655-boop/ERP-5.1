const STATUS = {
  pendiente: 'bg-slate-100 text-slate-700 border-slate-200',
  en_planificacion: 'bg-slate-100 text-slate-700 border-slate-200',
  programada: 'bg-blue-50 text-blue-700 border-blue-200',
  en_curso: 'bg-amber-50 text-amber-700 border-amber-200',
  pausada: 'bg-orange-50 text-orange-700 border-orange-200',
  finalizada_mecanico: 'bg-purple-50 text-purple-700 border-purple-200',
  cerrada_supervisor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  asignada: 'bg-blue-50 text-blue-700 border-blue-200',
  en_proceso: 'bg-amber-50 text-amber-700 border-amber-200',
  completada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelada: 'bg-red-50 text-red-700 border-red-200',
  aprobada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  convertida_en_ot: 'bg-blue-50 text-blue-700 border-blue-200',
  rechazada: 'bg-red-50 text-red-700 border-red-200',
  operativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mantenimiento: 'bg-amber-50 text-amber-700 border-amber-200',
  falla: 'bg-red-50 text-red-700 border-red-200',
  alta: 'bg-red-50 text-red-700 border-red-200',
  critica: 'bg-red-100 text-red-800 border-red-300',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baja: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
export default function Badge({ value }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS[value] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{String(value || '—').replaceAll('_', ' ')}</span>;
}
