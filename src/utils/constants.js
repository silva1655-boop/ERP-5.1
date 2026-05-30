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
    'equipment.updateHourmeter',
    'equipment.setOutOfService',
    'workOrders.create',
    'workOrders.manage',
    'requests.manage',
    'requests.review',
    'requests.approve',
    'requests.sendToMaintenance',
    'findings.review',
    'checklists.view',
    'checklists.create',
    'checklists.manage',
    'maintenancePlans.manage',
    'maintenancePlans.import',
    'workOrders.manage',
    'requests.manage',
    'checklists.manage',
    'maintenancePlans.manage',
    'reports.view',
    'settings.manage',
  ],
  supervisor: [
    'equipment.view',
    'equipment.manage',
    'equipment.updateHourmeter',
    'equipment.setOutOfService',
    'workOrders.create',
    'workOrders.manage',
    'planning.view',
    'planning.manage',
    'requests.view',
    'requests.review',
    'requests.approve',
    'requests.sendToMaintenance',
    'findings.review',
    'checklists.view',
    'reports.view',
  ],
  operaciones: ['requests.view', 'requests.review', 'requests.sendToMaintenance', 'findings.review', 'checklists.view', 'equipment.view', 'reports.view'],
  mecanico: ['workOrders.viewAssigned', 'workOrders.updateAssigned', 'equipment.view', 'checklists.create'],
  operador: ['checklists.create', 'checklists.view', 'requests.create', 'requests.view', 'equipment.view'],
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
  notifications: 'notifications',
  findings: 'findings',
};

export const EQUIPMENT_STATUS = ['operativo', 'observado', 'mantenimiento', 'fuera_servicio', 'falla', 'inactivo'];
export const WORK_ORDER_STATUS = ['en_planificacion', 'programada', 'en_curso', 'pausada', 'finalizada_mecanico', 'cerrada_supervisor', 'cancelada'];
export const REQUEST_STATUS = ['pendiente_revision_mantenimiento', 'aprobada', 'rechazada', 'convertida_en_ot', 'convertida_ot', 'pendiente', 'pendiente_operaciones', 'en_revision', 'enviada_mantenimiento', 'cerrada_sin_mantenimiento', 'mas_informacion', 'convertida'];
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
