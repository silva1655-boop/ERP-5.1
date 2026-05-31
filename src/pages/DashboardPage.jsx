import Badge from '../components/common/Badge';
import NotificationsPanel from '../components/notifications/NotificationsPanel';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

export default function DashboardPage() {
  const equipment = useFirestoreCollection('equipment');
  const workOrders = useFirestoreCollection('workOrders');
  const requests = useFirestoreCollection('requests');
  const cards = [
    ['Equipos activos', equipment.data.filter(item => item.active !== false).length],
    ['OT abiertas', workOrders.data.filter(item => !['completada', 'cancelada'].includes(item.status)).length],
    ['Solicitudes pendientes', requests.data.filter(item => item.status === 'pendiente').length],
    ['Equipos en falla', equipment.data.filter(item => item.status === 'falla').length],
  ];
  return <section className="space-y-6"><NotificationsPanel/><div className="grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-900">Últimas órdenes</h3><div className="mt-4 space-y-3">{workOrders.data.slice(0,5).map(item => <div key={item.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="font-semibold text-slate-900">{item.folio || item.title}</p><p className="text-sm text-slate-500">{item.equipmentCode || item.equipmentId}</p></div><Badge value={item.status}/></div>)}</div></div><div className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-900">Estado de flota</h3><div className="mt-4 space-y-3">{['operativo','mantenimiento','falla'].map(status => <div key={status} className="flex items-center justify-between"><Badge value={status}/><span className="font-bold">{equipment.data.filter(item => item.status === status).length}</span></div>)}</div></div></div></section>;
}
