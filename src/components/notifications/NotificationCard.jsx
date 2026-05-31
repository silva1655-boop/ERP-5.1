import Badge from '../common/Badge';
import { formatDate } from '../../utils/dates';

export default function NotificationCard({ notification, onAction, onMarkRead, actionLabel = 'Ver detalle' }) {
  const data = notification.data || {};
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-sm font-bold text-slate-900">{notification.title}</p><p className="text-xs text-slate-500">{formatDate(notification.createdAt)}</p></div>
      <Badge value={notification.priority || notification.type}/>
    </div>
    <p className="mt-2 text-sm text-slate-700">{notification.message}</p>
    <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 md:grid-cols-2">
      <p><b>Folio OT:</b> {notification.workOrderFolio || notification.workOrderId || '—'}</p>
      <p><b>Equipo:</b> {notification.equipmentCode || notification.equipmentName || '—'}</p>
      <p><b>Responsable:</b> {notification.mechanicName || notification.createdByName || '—'}</p>
      <p><b>HH:</b> {data.laborHours ?? '—'}</p>
      <p className="md:col-span-2"><b>Diagnóstico:</b> {data.diagnosis || '—'}</p>
      <p className="md:col-span-2"><b>Trabajo realizado:</b> {data.workPerformed || '—'}</p>
      <p><b>Estado final:</b> {data.finalEquipmentStatus || '—'}</p>
      <p><b>Fecha término:</b> {formatDate(data.finishedAt || notification.createdAt)}</p>
    </div>
    <div className="mt-3 flex flex-wrap justify-end gap-2">
      {onAction && <button className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" onClick={() => onAction(notification)}>{actionLabel}</button>}
      {onMarkRead && <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => onMarkRead(notification)}>Marcar como revisado</button>}
    </div>
  </article>;
}
