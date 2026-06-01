import { useMemo } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useAuth } from './useAuth.jsx';
import { isNotificationUnreadForUser, notificationTargets } from '../services/notificationService';

export function useNotifications() {
  const { user } = useAuth();
  const { data, loading, error } = useFirestoreCollection('notifications', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 150 });

  const unreadNotifications = useMemo(() => data.filter(item => isNotificationUnreadForUser(item, user)), [data, user]);
  const unreadByTarget = useMemo(() => unreadNotifications.reduce((acc, item) => {
    notificationTargets(item, user).forEach(target => { acc[target] = (acc[target] || 0) + 1; });
    return acc;
  }, {}), [unreadNotifications, user]);

  return {
    notifications: data,
    unread: unreadNotifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    unreadByTarget,
    unreadByTargetPage: unreadByTarget,
    loading,
    error,
  };
}
