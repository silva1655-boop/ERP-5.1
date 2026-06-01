export default function NotificationBadge({ count }) {
  if (!count) return null;
  return <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black leading-none text-white shadow-sm ring-2 ring-slate-950">{count > 99 ? '99+' : count}</span>;
}
