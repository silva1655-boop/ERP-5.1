export default function NotificationBadge({ count }) {
  if (!count) return null;
  return <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-sky-400 px-1.5 py-0.5 text-[10px] font-black leading-none text-slate-950 shadow-sm">{count > 99 ? '99+' : count}</span>;
}
