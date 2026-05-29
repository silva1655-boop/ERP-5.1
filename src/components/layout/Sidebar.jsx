import { BarChart3, ClipboardCheck, FileText, LayoutDashboard, Settings, Truck, Users, Wrench, CalendarCheck, MessageSquareWarning } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: ['equipment.view', 'workOrders.view', 'workOrders.manage', 'reports.view'] },
  { key: 'equipment', label: 'Equipos', icon: Truck, permissions: ['equipment.view', 'equipment.manage'] },
  { key: 'workOrders', label: 'Órdenes', icon: Wrench, permissions: ['workOrders.view', 'workOrders.manage', 'workOrders.viewAssigned'] },
  { key: 'requests', label: 'Solicitudes', icon: MessageSquareWarning, permissions: ['requests.view', 'requests.create', 'requests.manage', 'requests.approve'] },
  { key: 'checklists', label: 'Checklist', icon: ClipboardCheck, permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
  { key: 'maintenancePlans', label: 'Planes', icon: CalendarCheck, permissions: ['maintenancePlans.manage', 'workOrders.manage'] },
  { key: 'users', label: 'Usuarios', icon: Users, permissions: ['users.manage'] },
  { key: 'reports', label: 'Reportes', icon: BarChart3, permissions: ['reports.view'] },
  { key: 'settings', label: 'Configuración', icon: Settings, permissions: ['settings.manage'] },
];

export default function Sidebar({ activePage, onNavigate, branding }) {
  const { canAny } = usePermissions();
  const visible = items.filter(item => canAny(item.permissions));
  return <aside className="flex w-64 shrink-0 flex-col bg-slate-950 text-white"><div className="border-b border-white/10 p-5"><p className="text-xs uppercase tracking-[0.25em] text-sky-300">SaaS ERP</p><h1 className="mt-1 text-xl font-bold">{branding.companyName}</h1></div><nav className="flex-1 space-y-1 p-3">{visible.map(item => { const Icon = item.icon; const selected = activePage === item.key; return <button key={item.key} onClick={() => onNavigate(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${selected ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon size={18}/>{item.label}</button>; })}</nav><div className="border-t border-white/10 p-3 text-xs text-slate-400">Base comercial multiempresa</div></aside>;
}
