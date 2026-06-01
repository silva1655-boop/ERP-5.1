import { createSimplePdf, downloadPdf } from '../modules/reports/pdf';
import { useAuth } from '../hooks/useAuth.jsx';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { formatDate } from '../utils/dates';
import { money } from '../utils/formatters';

const maintenanceReports = ['OT individual', 'Checklist', 'Mensual mantenimiento', 'Disponibilidad', 'Costos por equipo', 'Daños operacionales'];
const operationalReports = ['Disponibilidad operacional', 'Equipos con restricción', 'Daños operacionales', 'Cumplimiento de inspecciones', 'Hallazgos por equipo', 'Solicitudes derivadas a mantenimiento'];

export default function ReportsPage({ navigationKey }) {
  const { companySettings, user } = useAuth();
  const workOrders = useFirestoreCollection('workOrders');
  const checklists = useFirestoreCollection('checklists');
  const equipment = useFirestoreCollection('equipment');
  const findings = useFirestoreCollection('findings');
  const requests = useFirestoreCollection('requests');
  const isOperational = navigationKey === 'operationalReports' || user?.role === 'operaciones';

  const makeReport = type => {
    const availability = equipment.data.length ? Math.round((equipment.data.filter(item => ['operativo', 'observado'].includes(item.status)).length / equipment.data.length) * 100) : 0;
    const operationalLines = [
      `Empresa: ${companySettings.companyName}`,
      `Fecha: ${formatDate(new Date())}`,
      `Responsable: ${user?.name || user?.email}`,
      `Tipo de reporte: ${type}`,
      `Equipos registrados: ${equipment.data.length}`,
      `Disponibilidad operacional: ${availability}%`,
      `Inspecciones registradas: ${checklists.data.length}`,
      `Hallazgos abiertos: ${findings.data.filter(item => item.status === 'pendiente_revision_operaciones').length}`,
      `Solicitudes derivadas a mantenimiento: ${requests.data.filter(item => item.source === 'finding' || item.sourceFindingId).length}`,
      `Código de validación: ${companySettings.companyName}-${Date.now()}`,
      'Pie: Documento operacional generado por Mantek ERP SaaS.',
    ];
    const maintenanceLines = [
      `Empresa: ${companySettings.companyName}`,
      `Fecha: ${formatDate(new Date())}`,
      `Responsable: ${user?.name || user?.email}`,
      `Tipo de reporte: ${type}`,
      `OT registradas: ${workOrders.data.length}`,
      `Checklists registrados: ${checklists.data.length}`,
      `Disponibilidad flota: ${availability}%`,
      `Costos acumulados: ${money(workOrders.data.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), companySettings.currency)}`,
      `Código de validación: ${companySettings.companyName}-${Date.now()}`,
      'Pie: Documento generado por Mantek ERP SaaS.',
    ];
    downloadPdf(createSimplePdf({ title: `Reporte ${type}`, lines: isOperational ? operationalLines : maintenanceLines }), `reporte-${type}.pdf`);
  };

  const reports = isOperational ? operationalReports : maintenanceReports;
  return <section className="space-y-4">
    {isOperational && <div><h3 className="text-lg font-bold text-slate-900">Reportes operacionales</h3><p className="text-sm text-slate-500">Indicadores enfocados en disponibilidad, restricciones, daños, inspecciones y derivaciones a mantenimiento.</p></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(report => <div key={report} className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900">{report}</h3><p className="mt-2 text-sm text-slate-500">PDF con empresa, fecha, responsable, indicadores, validación y pie de página.</p><button onClick={() => makeReport(report)} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Generar PDF</button></div>)}</div>
  </section>;
}
