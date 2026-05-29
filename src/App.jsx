import { useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/common/LoadingState';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { usePermissions } from './hooks/usePermissions';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import EquipmentPage from './pages/EquipmentPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import RequestsPage from './pages/RequestsPage';
import ChecklistsPage from './pages/ChecklistsPage';
import MaintenancePlansPage from './pages/MaintenancePlansPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

const pages = {
  dashboard: { title: 'Dashboard', component: DashboardPage, permissions: ['equipment.view', 'workOrders.view', 'workOrders.manage', 'reports.view'] },
  equipment: { title: 'Equipos', component: EquipmentPage, permissions: ['equipment.view', 'equipment.manage'] },
  workOrders: { title: 'Órdenes de trabajo', component: WorkOrdersPage, permissions: ['workOrders.view', 'workOrders.manage', 'workOrders.viewAssigned'] },
  requests: { title: 'Solicitudes', component: RequestsPage, permissions: ['requests.view', 'requests.create', 'requests.manage', 'requests.approve'] },
  checklists: { title: 'Checklists', component: ChecklistsPage, permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
  maintenancePlans: { title: 'Planes de mantenimiento', component: MaintenancePlansPage, permissions: ['maintenancePlans.manage', 'workOrders.manage'] },
  users: { title: 'Usuarios', component: UsersPage, permissions: ['users.manage'] },
  reports: { title: 'Reportes', component: ReportsPage, permissions: ['reports.view'] },
  settings: { title: 'Configuración', component: SettingsPage, permissions: ['settings.manage'] },
};

function ProtectedApp() {
  const { loading, isAuthenticated, companySettings, error } = useAuth();
  const { canAny } = usePermissions();
  const [activePage, setActivePage] = useState('dashboard');
  const allowedPages = useMemo(() => Object.entries(pages).filter(([, page]) => canAny(page.permissions)).map(([key]) => key), [canAny]);

  if (loading) return <main className="min-h-screen bg-slate-100 p-6"><LoadingState label="Validando sesión..."/></main>;
  if (!isAuthenticated) return <LoginPage/>;
  const safePage = allowedPages.includes(activePage) ? activePage : allowedPages[0] || 'dashboard';
  const page = pages[safePage];
  const Page = page?.component || DashboardPage;
  return <AppLayout activePage={safePage} onNavigate={setActivePage} title={page?.title || 'Dashboard'} branding={companySettings}>{error && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}<Page/></AppLayout>;
}

export default function App() {
  return <AuthProvider><ProtectedApp/></AuthProvider>;
}
