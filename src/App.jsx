import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/common/LoadingState';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { useLegacyData } from './hooks/useLegacyData';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import EquipmentPage from './pages/EquipmentPage';
import PlansPage from './pages/PlansPage';
import IndicadoresPage from './pages/IndicadoresPage';
import RequestsPage from './pages/RequestsPage';
import ChecklistPage from './pages/ChecklistPage';
import DeviationsPage from './pages/DeviationsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';

// Nav allowed per role
const ROLE_NAV = {
  supervisor:  ['dashboard','workorders','equipment','plans','indicadores','requests','checklist','deviaciones','reports','users'],
  mecanico:    ['dashboard','workorders','deviaciones','reports'],
  operaciones: ['dashboard','requests','checklist','plans','notifications'],
  operador:    ['dashboard','checklist','notifications'],
};

function AppContent({ user, data, setData, saveData }) {
  const [page, setPage] = useState('dashboard');
  const { logout } = useAuth();

  const props = { user, data, setData, saveData, onNav: setPage };

  const PAGES = {
    dashboard:     <DashboardPage    {...props} />,
    workorders:    <WorkOrdersPage   {...props} />,
    equipment:     <EquipmentPage    {...props} />,
    plans:         <PlansPage        {...props} />,
    indicadores:   <IndicadoresPage  {...props} />,
    requests:      <RequestsPage     {...props} />,
    checklist:     <ChecklistPage    {...props} />,
    deviaciones:   <DeviationsPage   {...props} />,
    reports:       <ReportsPage      {...props} />,
    users:         <UsersPage        {...props} />,
    notifications: <NotificationsPage {...props} />,
  };

  const allowedNav = ROLE_NAV[user.role] || ['dashboard'];
  const activePage = allowedNav.includes(page) ? page : 'dashboard';

  // Count pending notifications
  const notifCount = (data.requests || []).filter(r =>
    r.status === 'pendiente' &&
    (user.role === 'supervisor' ||
     (user.role === 'operaciones' && r.source === 'checklist') ||
     r.requestedBy === user.id)
  ).length;

  return (
    <AppLayout
      active={activePage}
      onNav={setPage}
      user={user}
      allowedNav={allowedNav}
      notifications={notifCount}
      online={navigator.onLine}
      onLogout={logout}
      onChangePassword={() => {}}
    >
      {PAGES[activePage] || PAGES.dashboard}
    </AppLayout>
  );
}

function ProtectedApp() {
  const { loading, isAuthenticated, user } = useAuth();
  const legacyState = useLegacyData();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <LoadingState label="Validando sesión..." />
      </main>
    );
  }

  if (!isAuthenticated || !user) return <LoginPage />;

  return (
    <AppContent
      user={user}
      data={legacyState.data}
      setData={legacyState.setData}
      saveData={legacyState.saveData}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
