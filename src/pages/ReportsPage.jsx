import { useState } from "react";
import { FileText, Download, Printer, BarChart2, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { NV, card, btnPrimary } from "../utils/constants";
import { fmt, printMonthlyReport, downloadCSV } from "../utils/helpers";

export function ReportsPage({ user, data }) {
  const { wos, equip, requests, checklists } = data;
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthWOs = wos.filter(w => w.scheduledDate?.startsWith(selectedMonth));
  const monthCLs = (checklists || []).filter(c => c.createdAt?.startsWith(selectedMonth));
  const completedWOs = monthWOs.filter(w => w.status === "completada");
  const total = equip.length || 1;
  const operativos = equip.filter(e => e.status === "operativo").length;
  const disponibilidad = Math.round((operativos / total) * 100);

  const exportWOsCSV = () => {
    const rows = monthWOs.map(w => {
      const eq = equip.find(e => e.id === w.equipId);
      return {
        Código: w.code,
        Título: w.title,
        Equipo: eq?.code || "",
        Tipo: w.type,
        Estado: w.status,
        Prioridad: w.priority,
        "Fecha Programada": fmt(w.scheduledDate),
        "Fecha Completada": fmt(w.completedAt),
      };
    });
    downloadCSV(`OTs_${selectedMonth}.csv`, rows);
  };

  const exportEquipCSV = () => {
    const rows = equip.map(e => ({
      Código: e.code,
      Nombre: e.name,
      Tipo: e.type,
      Ubicación: e.location,
      Criticidad: e.criticality,
      Estado: e.status,
      "Horómetro (h)": e.hours,
      "Próx. Mantención": fmt(e.nextMaint),
    }));
    downloadCSV(`Equipos_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const printReport = () => {
    printMonthlyReport({ wos: monthWOs, equip, requests, checklists: monthCLs }, equip, data.users || [], selectedMonth);
  };

  const statItems = [
    { label: "OTs del mes", value: monthWOs.length, sub: `${completedWOs.length} completadas`, color: NV.navy },
    { label: "Disponibilidad flota", value: `${disponibilidad}%`, sub: `${operativos}/${total} operativos`, color: disponibilidad >= 80 ? "#16a34a" : "#d97706" },
    { label: "Checklists realizados", value: monthCLs.length, sub: `${monthCLs.filter(c => c.hasIssues).length} con observaciones`, color: NV.blue },
    { label: "Solicitudes", value: requests.filter(r => r.createdAt?.startsWith(selectedMonth)).length, sub: `${requests.filter(r => r.status === "pendiente").length} pendientes`, color: "#7c3aed" },
  ];

  const reportActions = [
    {
      title: "OTs del Mes",
      desc: "Exporta todas las órdenes de trabajo del mes seleccionado",
      icon: FileText,
      action: exportWOsCSV,
      label: "Exportar CSV",
      count: monthWOs.length,
    },
    {
      title: "Inventario de Equipos",
      desc: "Exporta el estado actual de todos los equipos",
      icon: BarChart2,
      action: exportEquipCSV,
      label: "Exportar CSV",
      count: equip.length,
    },
    {
      title: "Informe Mensual",
      desc: "Genera un informe mensual completo para imprimir",
      icon: Printer,
      action: printReport,
      label: "Imprimir",
      count: null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Informes</h1>
          <p className="text-gray-500 text-sm">Reportes y exportaciones de datos</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-500 text-sm font-medium">Mes:</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400"/>
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map(s => (
          <div key={s.label} className={`${card} p-5`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{s.label}</p>
            <p className="font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Report actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportActions.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.title} className={`${card} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NV.blue}15` }}>
                  <Icon size={18} style={{ color: NV.blue }}/>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                  {r.count !== null && <p className="text-xs text-gray-400">{r.count} registros</p>}
                </div>
              </div>
              <p className="text-gray-500 text-xs mb-4">{r.desc}</p>
              <button onClick={r.action} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90" style={{ background: NV.blue }}>
                <Download size={14}/>{r.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* OTs Table */}
      <div className={card}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-sm" style={{ color: NV.navy }}>OTs del Mes — {selectedMonth}</h2>
          <span className="text-xs text-gray-400">{monthWOs.length} registros</span>
        </div>
        {monthWOs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin órdenes de trabajo para el mes seleccionado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-white" style={{ background: NV.navyMid }}>
                  <th className="text-left px-4 py-2.5">Código</th>
                  <th className="text-left px-4 py-2.5">Título</th>
                  <th className="text-left px-4 py-2.5 hidden md:table-cell">Equipo</th>
                  <th className="text-left px-4 py-2.5">Tipo</th>
                  <th className="text-left px-4 py-2.5">Estado</th>
                  <th className="text-left px-4 py-2.5 hidden lg:table-cell">Programada</th>
                </tr>
              </thead>
              <tbody>
                {monthWOs.map((w, i) => {
                  const eq = equip.find(e => e.id === w.equipId);
                  return (
                    <tr key={w.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <td className="px-4 py-2.5 font-mono font-bold text-xs" style={{ color: NV.blue }}>{w.code}</td>
                      <td className="px-4 py-2.5 text-gray-800 text-sm max-w-[200px] truncate">{w.title}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-gray-500 text-xs">{eq?.code || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs capitalize">{w.type}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${w.status === "completada" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : w.status === "pendiente" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-blue-700 bg-blue-50 border-blue-200"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500 text-xs">{fmt(w.scheduledDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
