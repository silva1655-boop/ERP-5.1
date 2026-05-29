export const ROLES = [
  'superadmin',
  'admin_empresa',
  'supervisor',
  'operaciones',
  'mecanico',
  'operador',
  'cliente_lectura',
];

export const ROLE_LABELS = {
  superadmin: 'Superadmin',
  admin_empresa: 'Admin empresa',
  supervisor: 'Supervisor',
  operaciones: 'Operaciones',
  mecanico: 'Mecánico',
  operador: 'Operador',
  cliente_lectura: 'Cliente lectura',
};

export const PERMISSIONS = {
  superadmin: ['*'],
  admin_empresa: [
    'users.manage',
    'equipment.manage',
    'workOrders.manage',
    'requests.manage',
    'checklists.manage',
    'maintenancePlans.manage',
    'reports.view',
    'settings.manage',
  ],
  supervisor: [
    'equipment.view',
    'workOrders.manage',
    'requests.approve',
    'requests.view',
    'checklists.view',
    'reports.view',
  ],
  operaciones: ['requests.create', 'requests.view', 'checklists.create', 'equipment.view'],
  mecanico: ['workOrders.viewAssigned', 'workOrders.updateAssigned', 'equipment.view', 'checklists.create'],
  operador: ['checklists.create', 'equipment.view'],
  cliente_lectura: ['reports.view', 'equipment.view', 'workOrders.view'],
};

export const COLLECTIONS = {
  users: 'users',
  equipment: 'equipment',
  workOrders: 'workOrders',
  requests: 'requests',
  checklists: 'checklists',
  maintenancePlans: 'maintenancePlans',
  spareParts: 'spareParts',
  auditLogs: 'auditLogs',
  settings: 'settings',
  counters: 'counters',
};

export const EQUIPMENT_STATUS = ['operativo', 'mantenimiento', 'falla', 'inactivo'];
export const WORK_ORDER_STATUS = ['pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada'];
export const REQUEST_STATUS = ['pendiente', 'aprobada', 'rechazada', 'convertida'];
export const PRIORITIES = ['baja', 'media', 'alta', 'critica'];

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'Mantek ERP',
  logoUrl: '',
  primaryColor: '#0f3b82',
  secondaryColor: '#0ea5e9',
  timezone: 'America/Santiago',
  currency: 'CLP',
  language: 'es',
  modulesEnabled: {
    dashboard: true,
    equipment: true,
    workOrders: true,
    requests: true,
    checklists: true,
    maintenancePlans: true,
    users: true,
    reports: true,
    settings: true,
  },
};
