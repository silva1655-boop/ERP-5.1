export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const cls = type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return <button onClick={onClose} className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-left text-sm shadow-lg ${cls}`}>{message}</button>;
}
