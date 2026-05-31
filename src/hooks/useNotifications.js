import { useMemo } from 'react';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useAuth } from './useAuth.jsx';
import { isNotificationUnreadForUser } from '../services/notificationService';

export function useNotifications() {
  const { user } = useAuth();
  const { data, loading, error } = useFirestoreCollection('notifications', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 });

  const unread = useMemo(() => data.filter(item => isNotificationUnreadForUser(item, user)), [data, user]);
  const unreadByTargetPage = useMemo(() => unread.reduce((acc, item) => {
    const pages = item.targetPages || [item.targetPage || 'dashboard'];
    pages.forEach(page => { acc[page] = (acc[page] || 0) + 1; });
    return acc;
  }, {}), [unread]);

  return { notifications: data, unread, unreadByTargetPage, loading, error };
}
