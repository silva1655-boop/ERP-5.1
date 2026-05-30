import EntityPage from './EntityPage';
import MaintenancePlanImport from '../components/maintenance/MaintenancePlanImport';
import { useAuth } from '../hooks/useAuth.jsx';
import { usePermissions } from '../hooks/usePermissions';

export default function MaintenancePlansPage(){
  const { companyId, user } = useAuth();
  const { canAny } = usePermissions();
  return <div className="space-y-4"><div className="flex justify-end"><MaintenancePlanImport companyId={companyId} user={user} canImport={canAny(['maintenancePlans.import', 'maintenancePlans.manage'])}/></div><EntityPage type="maintenancePlans"/></div>;
}
