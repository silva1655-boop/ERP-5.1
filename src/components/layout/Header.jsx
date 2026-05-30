import { LogOut } from 'lucide-react';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Header({ title }) {
  const { user, companySettings, logout } = useAuth();
  return <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><div><h2 className="text-2xl font-bold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{companySettings.companyName} · {user?.terminal || 'Todas las terminales'}</p></div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{initials(user?.name || user?.email)}</div><div className="text-right"><p className="text-sm font-semibold text-slate-900">{user?.name || user?.email}</p><p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</p></div><button onClick={logout} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><LogOut size={18}/></button></div></header>;
}
