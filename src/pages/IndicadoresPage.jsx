import { useMemo } from "react";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Gauge, BarChart2 } from "lucide-react";
import { NV, card } from "../utils/constants";
import { fmt } from "../utils/helpers";

export function IndicadoresPage({ user, data }) {
  const { wos, equip, checklists } = data;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();

  const kpi = useMemo(() => {
    const total = equip.length || 1;
    const operativos = equip.filter(e => e.status === "operativo").length;
    const enFalla    = equip.filter(e => e.status === "falla").length;
    const enMant     = equip.filter(e => e.status === "mantenimiento").length;
    const disponibilidad = Math.round((operativos / total) * 100);

    const wosMonth  = wos.filter(w => w.scheduledDate?.startsWith(thisMonth));
    const completed = wosMonth.filter(w => w.status === "completada").length;
    const pending   = wosMonth.filter(w => w.status !== "completada" && w.status !== "cancelada").length;
    const overdue   = wos.filter(w => {
      if (w.status === "completada" || w.status === "cancelada") return false;
      if (!w.scheduledDate) return false;
      return w.scheduledDate < new Date().toISOString().slice(0, 10);
    }).length;

    const clMonth   = (checklists || []).filter(c => c.createdAt?.startsWith(thisMonth));
    const clIssues  = clMonth.filter(c => c.hasIssues).length;
    const clOK      = clMonth.length - clIssues;

    const preventivas = wos.filter(w => w.type === "preventiva").length;
    const correctivas = wos.filter(w => w.type === "correctiva").length;
    const totalTypes  = preventivas + correctivas || 1;

    return {
      disponibilidad, operativos, enFalla, enMant, total,
      completed, pending, overdue,
      clMonth: clMonth.length, clIssues, clOK,
      preventivas, correctivas,
      pctPrev: Math.round((preventivas / totalTypes) * 100),
      pctCorr: Math.round((correctivas / totalTypes) * 100),
    };
  }, [wos, equip, checklists, thisMonth]);

  const StatBox = ({ label, value, unit = "", color = NV.navy, sub }) => (
    <div className={`${card} p-5`}>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="font-bold text-3xl" style={{ color }}>{value}<span className="text-base font-medium ml-1 text-gray-400">{unit}</span></p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );

  const donut = (pct, color) => {
    const r = 30, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)"/>
        <text x="40" y="45" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{pct}%</text>
      </svg>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-gray-900 font-bold text-xl">Indicadores KPI</h1>
        <p className="text-gray-500 text-sm">Resumen operacional del mes actual</p>
      </div>

      {/* Disponibilidad flota */}
      <section>
        <h2 className="font-semibold text-sm mb-3" style={{ color: NV.navy }}>Disponibilidad de Flota</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${card} p-5 col-span-2 lg:col-span-1 flex items-center gap-4`}>
            {donut(kpi.disponibilidad, kpi.disponibilidad >= 80 ? "#16a34a" : kpi.disponibilidad >= 60 ? "#f59e0b" : "#ef4444")}
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Disponibilidad</p>
              <p className="text-gray-800 text-sm mt-1">{kpi.operativos} operativos</p>
              <p className="text-amber-600 text-xs">{kpi.enMant} en mantención</p>
              <p className="text-red-600 text-xs">{kpi.enFalla} en falla</p>
            </div>
          </div>
          <StatBox label="Total Equipos" value={kpi.total} sub={`${kpi.operativos} operativos`} color={NV.navy}/>
          <StatBox label="En Falla" value={kpi.enFalla} color={kpi.enFalla > 0 ? "#dc2626" : "#16a34a"} sub={kpi.enFalla > 0 ? "Requiere atención" : "Sin fallas"}/>
          <StatBox label="En Mantención" value={kpi.enMant} color="#d97706" sub="En proceso"/>
        </div>
      </section>

      {/* OTs del mes */}
      <section>
        <h2 className="font-semibold text-sm mb-3" style={{ color: NV.navy }}>Órdenes de Trabajo — Este Mes</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="OT Completadas" value={kpi.completed} color="#16a34a" unit="OT"/>
          <StatBox label="OT Pendientes" value={kpi.pending} color={NV.blue} unit="OT"/>
          <StatBox label="OT Vencidas" value={kpi.overdue} color={kpi.overdue > 0 ? "#dc2626" : "#16a34a"} unit="OT" sub={kpi.overdue > 0 ? "Sin completar a fecha" : "Sin atrasos"}/>
          <div className={`${card} p-5`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">Distribución por Tipo</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-600 font-medium">Preventivas</span>
                  <span className="text-gray-500">{kpi.preventivas} ({kpi.pctPrev}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${kpi.pctPrev}%`, background: NV.blue }}/>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600 font-medium">Correctivas</span>
                  <span className="text-gray-500">{kpi.correctivas} ({kpi.pctCorr}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${kpi.pctCorr}%` }}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Checklists */}
      <section>
        <h2 className="font-semibold text-sm mb-3" style={{ color: NV.navy }}>Checklists Pre-operacionales — Este Mes</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatBox label="Checklists Realizados" value={kpi.clMonth} color={NV.navy} unit="CL"/>
          <StatBox label="Sin Observaciones" value={kpi.clOK} color="#16a34a" unit="CL"/>
          <StatBox label="Con Observaciones" value={kpi.clIssues} color={kpi.clIssues > 0 ? "#d97706" : "#16a34a"} unit="CL" sub={kpi.clIssues > 0 ? "Requiere seguimiento" : "Todo OK"}/>
        </div>
      </section>

      {/* Estado por equipo */}
      <section>
        <h2 className="font-semibold text-sm mb-3" style={{ color: NV.navy }}>Estado Actual por Equipo</h2>
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-white font-semibold uppercase tracking-wider" style={{ background: NV.navyMid }}>
                <th className="text-left px-4 py-2.5">Código</th>
                <th className="text-left px-4 py-2.5">Nombre</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Ubicación</th>
                <th className="text-left px-4 py-2.5">Estado</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">Horómetro</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">Próx. Mant.</th>
                <th className="text-right px-4 py-2.5">OT Mes</th>
              </tr>
            </thead>
            <tbody>
              {equip.map((e, i) => {
                const eqWos = wos.filter(w => w.equipId === e.id && w.scheduledDate?.startsWith(thisMonth));
                const statusColors = { operativo: "bg-emerald-500", mantenimiento: "bg-amber-400", falla: "bg-red-500" };
                const statusLabels = { operativo: "Operativo", mantenimiento: "Mantención", falla: "Falla" };
                return (
                  <tr key={e.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-4 py-2.5"><span className="font-mono font-bold text-xs" style={{ color: NV.blue }}>{e.code}</span></td>
                    <td className="px-4 py-2.5 text-gray-800 text-sm">{e.name}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">{e.location}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full ${statusColors[e.status] || "bg-gray-400"}`}/>
                        {statusLabels[e.status] || e.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-gray-600 font-mono text-xs">{(e.hours || 0).toLocaleString()}h</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500 text-xs">{fmt(e.nextMaint)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-xs font-semibold ${eqWos.length > 0 ? "text-blue-600" : "text-gray-300"}`}>{eqWos.length}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default IndicadoresPage;
