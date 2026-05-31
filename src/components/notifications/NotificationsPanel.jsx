import NotificationCard from './NotificationCard';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNotifications } from '../../hooks/useNotifications';
import { markNotificationAsRead } from '../../services/notificationService';

export default function NotificationsPanel() {
  const { companyId, user } = useAuth();
  const { unread } = useNotifications();
  const visible = unread.slice(0, 6);
  if (!visible.length) return null;

  const markRead = notification => markNotificationAsRead(companyId, notification.id, user).catch(() => {});

  return <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-slate-900">Notificaciones pendientes</h3><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{visible.length}</span></div>
    <div className="space-y-3">{visible.map(item => <NotificationCard key={item.id} notification={item} onMarkRead={markRead}/>)}</div>
  </section>;
}
