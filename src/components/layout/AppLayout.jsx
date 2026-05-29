import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ activePage, onNavigate, title, children, branding }) {
  return <div className="flex min-h-screen bg-slate-100"><Sidebar activePage={activePage} onNavigate={onNavigate} branding={branding}/><div className="flex min-w-0 flex-1 flex-col"><Header title={title}/><main className="flex-1 overflow-auto p-6">{children}</main></div></div>;
}
