import { createSimplePdf, downloadPdf } from '../modules/reports/pdf';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate } from '../utils/dates';
import { money } from '../utils/formatters';

export default function ReportsPage() {
  const { companySettings, user } = useAuth();
  const workOrders = useFirestoreCollection('workOrders');
  const checklists = useFirestoreCollection('checklists');
  const equipment = useFirestoreCollection('equipment');
  const makeReport = type => {
    const totals = {
      availability: equipment.data.length ? Math.round((equipment.data.filter(item => item.status === 'operativo').length / equipment.data.length) * 100) : 0,
      costs: workOrders.data.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
    };
    const lines = [
      `Empresa: ${companySettings.companyName}`,
      `Fecha: ${formatDate(new Date())}`,
      `Responsable: ${user?.name || user?.email}`,
      `Tipo de reporte: ${type}`,
      `OT registradas: ${workOrders.data.length}`,
      `Checklists registrados: ${checklists.data.length}`,
      `Disponibilidad flota: ${totals.availability}%`,
      `Costos acumulados: ${money(totals.costs, companySettings.currency)}`,
      `Código de validación: ${companySettings.companyName}-${Date.now()}`,
      'Pie: Documento generado por Mantek ERP SaaS.',
    ];
    downloadPdf(createSimplePdf({ title: `Reporte ${type}`, lines }), `reporte-${type}.pdf`);
  };
  const reports = ['OT individual', 'Checklist', 'Mensual mantenimiento', 'Disponibilidad', 'Costos por equipo', 'Daños operacionales'];
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(report => <div key={report} className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900">{report}</h3><p className="mt-2 text-sm text-slate-500">PDF real con empresa, fecha, responsable, indicadores, validación y pie de página.</p><button onClick={() => makeReport(report)} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Generar PDF</button></div>)}</section>;
}
