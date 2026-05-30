import OperationsFindingsBoard from '../components/findings/OperationsFindingsBoard';
import { usePermissions } from '../hooks/usePermissions';
import EntityPage from './EntityPage';

export default function RequestsPage() {
  const { canAny } = usePermissions();
  const canReviewFindings = canAny(['requests.review', 'requests.manage', 'requests.sendToMaintenance', 'findings.review']);
  return <div className="space-y-6">
    {canReviewFindings && <OperationsFindingsBoard/>}
    <EntityPage type="requests"/>
  </div>;
}
