import { useState } from "react";
import { Bell, CheckCircle, AlertTriangle, ClipboardList, X, Check } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { NV, card } from "../utils/constants";
import { fmt } from "../utils/helpers";
import toast from "react-hot-toast";

export function NotificationsPage({ user, data, setData, saveData }) {
  const { requests, wos, equip } = data;
  const [filter, setFilter] = useState("all");

  // Build notification list from:
  // 1. Requests (pending) for the user's role
  // 2. Work orders assigned to mechanic
  // 3. Checklist-sourced requests
  const myRequests = requests.filter(r => {
    if (user.role === "operaciones") return r.requestedBy === user.id;
    if (user.role === "operador") return r.requestedBy === user.id;
    return false;
  });

  const requestsFromCL = requests.filter(r =>
    r.source === "checklist" && r.requestedBy === user.id
  );

  const myWOs = wos.filter(w =>
    w.assignedTo === user.id && w.status !== "completada" && w.status !== "cancelada"
  );

  // Build unified notification list
  const notifications = [
    ...myRequests.map(r => ({
      id: `req-${r.id}`,
      type: "request",
      title: r.title,
      sub: `Equipo: ${equip.find(e => e.id === r.equipId)?.code || "?"} · ${fmt(r.createdAt)}`,
      status: r.status,
      date: r.createdAt,
      raw: r,
    })),
    ...myWOs.map(w => ({
      id: `wo-${w.id}`,
      type: "workorder",
      title: w.title,
      sub: `${equip.find(e => e.id === w.equipId)?.name || "?"} · Programado: ${fmt(w.scheduledDate)}`,
      status: w.status,
      date: w.scheduledDate || w.createdAt,
      raw: w,
    })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  const markRequestDone = (reqId) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: "revisado" } : r);
    setData(d => ({ ...d, requests: updated }));
    saveData("requests", updated);
    toast.success("Marcado como revisado");
  };

  const pendingCount = notifications.filter(n => n.status === "pendiente" || (n.type === "workorder" && n.status !== "completada")).length;

  const typeIcons = {
    request: Bell,
    workorder: ClipboardList,
  };

  const typeColors = {
    request: { bg: "bg-blue-100", icon: "text-blue-600" },
    workorder: { bg: "bg-purple-100", icon: "text-purple-600" },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Notificaciones</h1>
          <p className="text-gray-500 text-sm">
            {pendingCount > 0 ? `${pendingCount} pendientes` : "Sin notificaciones pendientes"}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full">
            {pendingCount} sin leer
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[["all","Todas"],["request","Solicitudes"],["workorder","Órdenes de Trabajo"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filter === v ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
            style={filter === v ? { background: NV.blue } : {}}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <Bell size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-400 text-sm">No hay notificaciones</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(n => {
          const Icon = typeIcons[n.type] || Bell;
          const colors = typeColors[n.type] || typeColors.request;
          const isPending = n.status === "pendiente";
          return (
            <div key={n.id} className={`${card} p-4 flex items-start gap-3 ${isPending ? "border-l-4 border-l-amber-400" : ""}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.bg}`}>
                <Icon size={15} className={colors.icon}/>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.sub}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge s={n.status}/>
                  {n.type === "workorder" && <span className="text-xs text-gray-400">OT asignada a ti</span>}
                </div>
              </div>
              {n.type === "request" && isPending && (
                <button onClick={() => markRequestDone(n.raw.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition"
                  style={{ background: NV.blue }}>
                  <Check size={11}/>Revisado
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      {notifications.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className={`${card} p-4`}>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Mis Solicitudes</p>
            <div className="space-y-1">
              {["pendiente","revisado","aprobada","rechazada"].map(s => {
                const count = myRequests.filter(r => r.status === s).length;
                if (count === 0) return null;
                return (
                  <div key={s} className="flex justify-between items-center">
                    <Badge s={s}/>
                    <span className="text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                );
              })}
              {myRequests.length === 0 && <p className="text-gray-400 text-xs">Sin solicitudes</p>}
            </div>
          </div>
          {user.role === "mecanico" && (
            <div className={`${card} p-4`}>
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Mis OTs</p>
              <div className="space-y-1">
                {["pendiente","en_proceso","completada"].map(s => {
                  const count = myWOs.filter(w => w.status === s).length + (s === "completada" ? wos.filter(w => w.assignedTo === user.id && w.status === "completada").length : 0);
                  if (count === 0) return null;
                  return (
                    <div key={s} className="flex justify-between items-center">
                      <Badge s={s}/>
                      <span className="text-sm font-semibold text-gray-700">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
