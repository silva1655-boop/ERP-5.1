import { useMemo } from 'react';
import { PERMISSIONS } from '../utils/constants';
import { useAuth } from './useAuth';

export function hasPermission(role, permission) {
  const permissions = PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function usePermissions() {
  const { user } = useAuth();
  return useMemo(() => {
    const role = user?.role;
    const can = permission => hasPermission(role, permission);
    const canAny = permissions => permissions.some(can);
    const canAll = permissions => permissions.every(can);
    return { role, can, canAny, canAll, permissions: PERMISSIONS[role] || [] };
  }, [user?.role]);
}
