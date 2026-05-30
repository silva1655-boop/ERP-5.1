import DashboardPage from '../pages/DashboardPage';
import EquipmentPage from '../pages/EquipmentPage';
import WorkOrdersPage from '../pages/WorkOrdersPage';
import RequestsPage from '../pages/RequestsPage';
import ChecklistsPage from '../pages/ChecklistsPage';
import MaintenancePlansPage from '../pages/MaintenancePlansPage';
import UsersPage from '../pages/UsersPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';

export const PAGE_REGISTRY = {
  dashboard: { title: 'Dashboard', component: DashboardPage, permissions: ['equipment.view', 'workOrders.view', 'workOrders.manage', 'reports.view'] },
  companies: { title: 'Empresas', component: SettingsPage, permissions: ['companies.manage', 'settings.manage'] },
  users: { title: 'Usuarios', component: UsersPage, permissions: ['users.manage'] },
  equipment: { title: 'Equipos', component: EquipmentPage, permissions: ['equipment.view', 'equipment.manage'] },
  inspections: { title: 'Inspecciones', component: ChecklistsPage, permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
  requests: { title: 'Solicitudes', component: RequestsPage, permissions: ['requests.view', 'requests.create', 'requests.manage', 'requests.review', 'requests.approve', 'requests.sendToMaintenance'] },
  workOrders: { title: 'Órdenes de Trabajo', component: WorkOrdersPage, permissions: ['workOrders.view', 'workOrders.manage', 'workOrders.viewAssigned', 'workOrders.updateAssigned'] },
  planning: { title: 'Planificación', component: MaintenancePlansPage, permissions: ['maintenancePlans.manage', 'maintenancePlans.import', 'workOrders.manage'] },
  reports: { title: 'Reportes', component: ReportsPage, permissions: ['reports.view'] },
  settings: { title: 'Configuración', component: SettingsPage, permissions: ['settings.manage'] },
};

export const NAVIGATION_BY_ROLE = {
  superadmin: [
    { key: 'companies', page: 'companies', label: 'Empresas', icon: 'building', permissions: ['companies.manage', 'settings.manage'] },
    { key: 'users', page: 'users', label: 'Usuarios', icon: 'users', permissions: ['users.manage'] },
    { key: 'inspections', page: 'inspections', label: 'Inspecciones', icon: 'clipboard', permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
    { key: 'requests', page: 'requests', label: 'Solicitudes', icon: 'request', permissions: ['requests.view', 'requests.create', 'requests.manage', 'requests.review', 'requests.approve', 'requests.sendToMaintenance'] },
    { key: 'workOrders', page: 'workOrders', label: 'Órdenes de Trabajo', icon: 'wrench', permissions: ['workOrders.view', 'workOrders.manage'] },
    { key: 'reports', page: 'reports', label: 'Reportes', icon: 'reports', permissions: ['reports.view'] },
    { key: 'settings', page: 'settings', label: 'Configuración', icon: 'settings', permissions: ['settings.manage'] },
  ],
  admin_empresa: [
    { key: 'users', page: 'users', label: 'Usuarios', icon: 'users', permissions: ['users.manage'] },
    { key: 'equipment', page: 'equipment', label: 'Equipos', icon: 'truck', permissions: ['equipment.view', 'equipment.manage'] },
    { key: 'inspections', page: 'inspections', label: 'Inspecciones', icon: 'clipboard', permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
    { key: 'requests', page: 'requests', label: 'Solicitudes', icon: 'request', permissions: ['requests.view', 'requests.create', 'requests.manage', 'requests.review', 'requests.approve', 'requests.sendToMaintenance'] },
    { key: 'workOrders', page: 'workOrders', label: 'Órdenes de Trabajo', icon: 'wrench', permissions: ['workOrders.view', 'workOrders.manage'] },
    { key: 'reports', page: 'reports', label: 'Reportes', icon: 'reports', permissions: ['reports.view'] },
    { key: 'companySettings', page: 'settings', label: 'Configuración Empresa', icon: 'settings', permissions: ['settings.manage'] },
  ],
  supervisor: [
    { key: 'inspections', page: 'inspections', label: 'Inspecciones', icon: 'clipboard', permissions: ['checklists.view', 'checklists.manage'] },
    { key: 'requests', page: 'requests', label: 'Solicitudes', icon: 'request', permissions: ['requests.view', 'requests.review', 'requests.approve', 'requests.sendToMaintenance'] },
    { key: 'workOrders', page: 'workOrders', label: 'Órdenes de Trabajo', icon: 'wrench', permissions: ['workOrders.view', 'workOrders.manage'] },
    { key: 'planning', page: 'planning', label: 'Planificación', icon: 'calendar', permissions: ['maintenancePlans.manage', 'workOrders.manage'] },
    { key: 'reports', page: 'reports', label: 'Reportes', icon: 'reports', permissions: ['reports.view'] },
  ],
  operaciones: [
    { key: 'inspections', page: 'inspections', label: 'Inspecciones', icon: 'clipboard', permissions: ['checklists.view', 'checklists.create', 'checklists.manage'] },
    { key: 'requests', page: 'requests', label: 'Solicitudes', icon: 'request', permissions: ['requests.view', 'requests.create', 'requests.review', 'requests.sendToMaintenance'] },
    { key: 'equipmentStatus', page: 'equipment', label: 'Estado de Equipos', icon: 'truck', permissions: ['equipment.view'] },
    { key: 'operationalReports', page: 'reports', label: 'Reportes Operacionales', icon: 'reports', permissions: ['reports.view'] },
  ],
  mecanico: [
    { key: 'myWorkOrders', page: 'workOrders', label: 'Mis Órdenes de Trabajo', icon: 'wrench', permissions: ['workOrders.viewAssigned', 'workOrders.updateAssigned'] },
    { key: 'workOrderExecution', page: 'workOrders', label: 'Ejecución de OT', icon: 'wrench', permissions: ['workOrders.updateAssigned', 'workOrders.manage'] },
    { key: 'workHistory', page: 'workOrders', label: 'Historial de Trabajos', icon: 'history', permissions: ['workOrders.viewAssigned', 'workOrders.updateAssigned'] },
  ],
  operador: [
    { key: 'newInspection', page: 'inspections', label: 'Nueva Inspección', icon: 'clipboard', permissions: ['checklists.create'] },
    { key: 'myInspections', page: 'inspections', label: 'Mis Inspecciones', icon: 'clipboard', permissions: ['checklists.create', 'checklists.view'] },
    { key: 'reportFailure', page: 'requests', label: 'Reportar Falla', icon: 'request', permissions: ['requests.create'] },
    { key: 'requestStatus', page: 'requests', label: 'Estado de Solicitudes', icon: 'request', permissions: ['requests.view', 'requests.create'] },
  ],
  cliente_lectura: [
    { key: 'dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', permissions: ['reports.view', 'equipment.view'] },
    { key: 'reports', page: 'reports', label: 'Reportes', icon: 'reports', permissions: ['reports.view'] },
    { key: 'equipmentStatus', page: 'equipment', label: 'Estado de Equipos', icon: 'truck', permissions: ['equipment.view'] },
  ],
};

const fallbackNavigation = [
  { key: 'dashboard', page: 'dashboard', label: 'Dashboard', icon: 'dashboard', permissions: PAGE_REGISTRY.dashboard.permissions },
];

export function getNavigationForRole(role) {
  return NAVIGATION_BY_ROLE[role] || fallbackNavigation;
}

export function getFirstAllowedNavigationItem(role, canAny) {
  return getNavigationForRole(role).find(item => canAny(item.permissions));
}

export function getNavigationItemByKey(role, key) {
  return getNavigationForRole(role).find(item => item.key === key);
}
