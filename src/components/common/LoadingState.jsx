export default function LoadingState({ label = 'Cargando...' }) {
  return <div className="flex items-center justify-center rounded-xl bg-white p-8 text-sm text-slate-500">{label}</div>;
}
