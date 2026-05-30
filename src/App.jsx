import { useMemo, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/common/LoadingState';
import FirebaseConfigNotice from './components/common/FirebaseConfigNotice';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { isFirebaseConfigured } from './services/firebase';
import { usePermissions } from './hooks/usePermissions';
import { getFirstAllowedNavigationItem, getNavigationForRole, PAGE_REGISTRY } from './config/navigation';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function ProtectedApp() {
  const { loading, isAuthenticated, companySettings, error } = useAuth();
  const { role, canAny } = usePermissions();
  const [activePage, setActivePage] = useState('dashboard');

  const allowedNavigation = useMemo(
    () => getNavigationForRole(role).filter(item => canAny(item.permissions)),
    [role, canAny],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <LoadingState label="Validando sesión..." />
      </main>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl">
          <FirebaseConfigNotice />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const activeNavigationItem =
    allowedNavigation.find(item => item.key === activePage) ||
    getFirstAllowedNavigationItem(role, canAny) ||
    allowedNavigation[0] ||
    { key: 'dashboard', page: 'dashboard', label: 'Dashboard' };

  const pageDefinition = PAGE_REGISTRY[activeNavigationItem.page] || PAGE_REGISTRY.dashboard;
  const Page = pageDefinition?.component || DashboardPage;

  return (
    <AppLayout
      activePage={activeNavigationItem.key}
      onNavigate={setActivePage}
      title={activeNavigationItem.label || pageDefinition.title}
      branding={companySettings}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <Page navigationKey={activeNavigationItem.key} />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
