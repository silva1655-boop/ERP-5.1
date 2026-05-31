import Badge from '../common/Badge';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { formatDate } from '../../utils/dates';

function isVisible(notification, user) {
  const role = user?.role;
  const uid = user?.uid || user?.id;
  if (notification.targetUserId && notification.targetUserId === uid) return true;
  const roles = notification.recipientsRoles || notification.targetRoles || [];
  return Array.isArray(roles) && roles.includes(role);
}

export default function NotificationsPanel() {
  const { user } = useAuth();
  const { data: notifications } = useFirestoreCollection('notifications', { orderBy: { field: 'createdAt', direction: 'desc' }, limit: 30 });
  const visible = notifications.filter(item => item.status !== 'read' && isVisible(item, user)).slice(0, 6);
  if (!visible.length) return null;

  return <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-slate-900">Notificaciones pendientes</h3><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{visible.length}</span></div>
    <div className="space-y-3">{visible.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p></div><Badge value={item.priority || item.type}/></div>
      <p className="mt-2 text-slate-700">{item.message}</p>
      {item.type === 'work_order_finished' && <div className="mt-3 grid gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-slate-700 md:grid-cols-2"><p><b>Folio OT:</b> {item.workOrderFolio || item.workOrderId}</p><p><b>Equipo:</b> {item.equipmentCode || '—'}</p><p><b>Mecánico:</b> {item.mechanicName || '—'}</p><p><b>HH:</b> {item.data?.laborHours || 0}</p><p className="md:col-span-2"><b>Diagnóstico:</b> {item.data?.diagnosis || '—'}</p><p className="md:col-span-2"><b>Trabajo realizado:</b> {item.data?.workPerformed || '—'}</p><p><b>Estado final:</b> {item.data?.finalEquipmentStatus || '—'}</p><button className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">Ver OT</button></div>}
    </article>)}</div>
  </section>;
}
