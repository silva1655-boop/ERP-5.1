export default function Modal({ title, children, onClose, wide = false }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4"><div className={`max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl ${wide ? 'w-full max-w-3xl' : 'w-full max-w-xl'}`}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>✕</button></div>{children}</div></div>;
}
