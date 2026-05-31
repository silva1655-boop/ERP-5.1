import { BarChart3, BriefcaseBusiness, Building2, ClipboardCheck, Clock3, LayoutDashboard, Settings, Truck, Users, Wrench, CalendarCheck, MessageSquareWarning } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { getNavigationForRole } from '../../config/navigation';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBadge from '../notifications/NotificationBadge';

const icons = {
  building: Building2,
  calendar: CalendarCheck,
  clipboard: ClipboardCheck,
  dashboard: LayoutDashboard,
  history: Clock3,
  reports: BarChart3,
  request: MessageSquareWarning,
  settings: Settings,
  truck: Truck,
  users: Users,
  wrench: Wrench,
  default: BriefcaseBusiness,
};

export default function Sidebar({ activePage, onNavigate, branding }) {
  const { role, canAny } = usePermissions();
  const { unreadByTargetPage } = useNotifications();
  const visible = getNavigationForRole(role).filter(item => canAny(item.permissions));
  return <aside className="flex w-64 shrink-0 flex-col bg-slate-950 text-white"><div className="border-b border-white/10 p-5"><p className="text-xs uppercase tracking-[0.25em] text-sky-300">SaaS ERP</p><h1 className="mt-1 text-xl font-bold">{branding.companyName}</h1></div><nav className="flex-1 space-y-1 p-3">{visible.map(item => { const Icon = icons[item.icon] || icons.default; const selected = activePage === item.key; return <button key={item.key} onClick={() => onNavigate(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${selected ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/><span className="truncate">{item.label}</span><NotificationBadge count={unreadByTargetPage[item.key] || unreadByTargetPage[item.page] || 0}/></button>; })}</nav><div className="border-t border-white/10 p-3 text-xs text-slate-400">Base comercial multiempresa</div></aside>;
}
