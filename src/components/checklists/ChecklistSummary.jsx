export default function ChecklistSummary({ findings }) {
  const hasCritical = findings.some(item => item.status === 'bad' || item.priority === 'alta');
  if (!findings.length) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><b>Resumen:</b> inspección sin hallazgos. El equipo se mantiene operativo.</div>;
  return <div className={`rounded-2xl border p-4 text-sm ${hasCritical ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
    <p className="font-bold">{hasCritical ? 'Equipo dado de baja por hallazgo crítico en checklist.' : 'Checklist con hallazgos: se crearán hallazgos individuales para Operaciones.'}</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">{findings.map(item => <li key={item.itemId}>{item.section} · {item.name} · estado {item.status === 'bad' ? 'Malo' : 'Condicional'} · prioridad {item.priority}</li>)}</ul>
  </div>;
}
