export default function FormField({ label, error, children }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<div className="mt-1">{children}</div>{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</label>;
}
export const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
