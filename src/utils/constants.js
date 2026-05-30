import { BarChart2, ClipboardList, Package, Calendar, TrendingUp, Bell, CheckCircle, FileWarning, FileText, Users, Shield, Wrench, Activity } from 'lucide-react';

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
    'equipment.manage',
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

export const NV = {
  navy:    "#002060",
  blue:    "#0055A4",
  cyan:    "#00AEEF",
  navyMid: "#003087",
  light:   "#E8F2FB",
};

export const ST = {
  pendiente:     {label:"Pendiente",     cls:"text-gray-600    bg-gray-100    border-gray-300"   },
  asignada:      {label:"Asignada",      cls:"text-blue-700    bg-blue-50     border-blue-200"   },
  en_proceso:    {label:"En Proceso",    cls:"text-amber-700   bg-amber-50    border-amber-200"  },
  completada:    {label:"Completada",    cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  cancelada:     {label:"Cancelada",     cls:"text-red-700     bg-red-50      border-red-200"    },
  aprobada:      {label:"Aprobada",      cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  rechazada:     {label:"Rechazada",     cls:"text-red-700     bg-red-50      border-red-200"    },
  revisado:      {label:"Revisado",      cls:"text-blue-700    bg-blue-50     border-blue-200"   },
  operativo:     {label:"Operativo",     cls:"text-emerald-700 bg-emerald-50  border-emerald-200"},
  mantenimiento: {label:"Mantenimiento", cls:"text-amber-700   bg-amber-50    border-amber-200"  },
  falla:         {label:"Falla",         cls:"text-red-700     bg-red-50      border-red-200"    },
};

export const CRIT_CLS = {A:"text-red-700 bg-red-50 border-red-200",B:"text-amber-700 bg-amber-50 border-amber-200",C:"text-emerald-700 bg-emerald-50 border-emerald-200"};
export const PRI_CLS  = {alta:"text-red-700 bg-red-50 border-red-200",media:"text-amber-700 bg-amber-50 border-amber-200",baja:"text-emerald-700 bg-emerald-50 border-emerald-200"};
export const CRIT_LABEL = { A:"Crítico", B:"Importante", C:"Rutinario" };

export const ROLE_CFG = {
  supervisor: {label:"Supervisor", color:"text-cyan-300",  bg:"bg-cyan-900/40",   icon:Shield,        nav:["dashboard","workorders","equipment","plans","indicadores","requests","checklist","deviaciones","reports","users"]},
  mecanico:   {label:"Mecánico",   color:"text-amber-300", bg:"bg-amber-900/30",  icon:Wrench,        nav:["dashboard","workorders","deviaciones","reports"]},
  operaciones:{label:"Operaciones",color:"text-sky-300",   bg:"bg-sky-900/30",    icon:Activity,      nav:["dashboard","requests","checklist","plans","notifications"]},
  operador:   {label:"Operador",   color:"text-green-300", bg:"bg-green-900/30",  icon:ClipboardList, nav:["dashboard","checklist","notifications"]},
};

export const NAV_ITEMS = {
  dashboard:     {label:"Dashboard",            icon:BarChart2},
  workorders:    {label:"Órdenes de Trabajo",   icon:ClipboardList},
  equipment:     {label:"Equipos",              icon:Package},
  plans:         {label:"Plan Preventivo",      icon:Calendar},
  indicadores:   {label:"Indicadores KPI",      icon:TrendingUp},
  requests:      {label:"Solicitudes",          icon:Bell},
  notifications: {label:"Notificaciones",       icon:Bell},
  checklist:     {label:"Checklist Pre-op",     icon:CheckCircle},
  deviaciones:   {label:"Rep. Inspección",      icon:FileWarning},
  reports:       {label:"Informes",             icon:FileText},
  users:         {label:"Usuarios",             icon:Users},
};

export const iCls = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100";
export const sCls = "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-400";
export const card = "bg-white border border-gray-200 rounded-xl shadow-sm";
export const btnPrimary = "flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm hover:opacity-90";
export const btnSecondary = "flex items-center gap-2 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm hover:opacity-90 border";
export const COLL = "mantek_v2";

export const CL_STATUS = {
  bueno:   {bg:"#16a34a",lbl:"✓",cls:"text-emerald-700 bg-emerald-50 border-emerald-200"},
  regular: {bg:"#f59e0b",lbl:"~",cls:"text-amber-700 bg-amber-50 border-amber-200"},
  malo:    {bg:"#ef4444",lbl:"✗",cls:"text-red-700 bg-red-50 border-red-200"},
};

export const SEED_USERS = [
  { id:"u1", name:"Christopher Silva", role:"supervisor",  email:"csilva@navimag.cl",  password:"Navimag2026", avatar:"CS" },
  { id:"u2", name:"José Muñoz",        role:"supervisor",  email:"jmunoz@navimag.cl",  password:"Navimag2026", avatar:"JM" },
  { id:"u3", name:"Felipe Stein",      role:"operaciones", email:"fstein@navimag.cl",  password:"Navimag2026", avatar:"FS" },
  { id:"u4", name:"Jorge Soto",        role:"operaciones", email:"jsoto@navimag.cl",   password:"Navimag2026", avatar:"JS" },
  { id:"u5", name:"Operador 1",        role:"operador",    email:"op1@navimag.cl",     password:"Navimag2026", avatar:"O1" },
  { id:"u6", name:"Operador 2",        role:"operador",    email:"op2@navimag.cl",     password:"Navimag2026", avatar:"O2" },
];

export const SEED_EQUIPMENT = [
  { id:"mol1",   code:"MOL-01",  name:"Mol 1",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol2",   code:"MOL-02",  name:"Mol 2",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol3",   code:"MOL-03",  name:"Mol 3",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"mol4",   code:"MOL-04",  name:"Mol 4",       type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal69",  code:"KAL-69",  name:"Kalmar 69",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal71",  code:"KAL-71",  name:"Kalmar 71",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal72",  code:"KAL-72",  name:"Kalmar 72",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal73",  code:"KAL-73",  name:"Kalmar 73",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal75",  code:"KAL-75",  name:"Kalmar 75",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"kal76",  code:"KAL-76",  name:"Kalmar 76",   type:"Tracto Terminal",  location:"Patio Terminal", criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter648", code:"TER-648", name:"Terberg 648", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter659", code:"TER-659", name:"Terberg 659", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter779", code:"TER-779", name:"Terberg 779", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter789", code:"TER-789", name:"Terberg 789", type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter73",  code:"TER-73",  name:"Terberg 73",  type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"ter74",  code:"TER-74",  name:"Terberg 74",  type:"Tracto Portuario", location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif1",   code:"LIF-01",  name:"Liftec 1",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif2",   code:"LIF-02",  name:"Liftec 2",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"lif3",   code:"LIF-03",  name:"Liftec 3",    type:"Montacargas",      location:"Bodega",         criticality:"B", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru39",  code:"GRU-39",  name:"Grúa 39",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru40",  code:"GRU-40",  name:"Grúa 40",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
  { id:"gru41",  code:"GRU-41",  name:"Grúa 41",     type:"Grúa Portuaria",   location:"Muelle",         criticality:"A", status:"operativo", lastMaint:"", nextMaint:"", hours:0 },
];

export const CHECKLIST_TEMPLATES = {
  tracto:{
    label:"Tracto Camión",
    equipTypes:["Tracto Terminal","Tracto Portuario"],
    sections:[
      {label:"General", items:[
        {id:"tc_fugas",       name:"Fugas de aceite, líquido o aire",      method:"Visualmente / escuchando bajo el vehículo",    icon:"💧"},
      ]},
      {label:"Motor", items:[
        {id:"tc_aceite_m",    name:"Nivel de aceite motor",                method:"Varilla de medición",                          icon:"🛢️"},
        {id:"tc_refrig",      name:"Nivel de refrigerante",                method:"Visualmente — depósito / indicador panel CAN", icon:"🌡️"},
      ]},
      {label:"Frenos", items:[
        {id:"tc_frenos",      name:"Frenos — funcionamiento",              method:"Prueba después del desplazamiento",            icon:"🛑"},
      ]},
      {label:"Suspensión y Neumáticos", items:[
        {id:"tc_acopl",       name:"Acoplamiento de la rueda",                      method:"Visualmente",                                  icon:"🔩"},
        {id:"tc_neum_del_d",  name:"Neumático delantero derecho",                   method:"Visualmente — cortes, presión, deformación",   icon:"🔵"},
        {id:"tc_neum_del_i",  name:"Neumático delantero izquierdo",                 method:"Visualmente — cortes, presión, deformación",   icon:"🔵"},
        {id:"tc_neum_ti",     name:"Neumático trasero izquierdo (vista desde atrás)",method:"Visualmente — cortes, presión, deformación",  icon:"🔵"},
        {id:"tc_neum_td",     name:"Neumático trasero derecho (vista desde atrás)", method:"Visualmente — cortes, presión, deformación",   icon:"🔵"},
      ]},
      {label:"Cabina y Luces", items:[
        {id:"tc_luces_f",     name:"Luces faeneras y señalización",        method:"Visualmente / escuchando zumbadores",          icon:"🔦"},
        {id:"tc_controles",   name:"Controles e indicadores luminosos",    method:"Visualmente — antes y después de arrancar",    icon:"🎛️"},
        {id:"tc_clavijas",    name:"Clavijas de bloqueo de cabina",        method:"Visualmente — abrazaderas traseras",           icon:"🔒"},
        {id:"tc_luces_izq",   name:"Luces delanteras izquierda",           method:"Visualmente / comprobando funcionamiento",     icon:"💡"},
        {id:"tc_luces_der",   name:"Luces delanteras derecha",             method:"Visualmente / comprobando funcionamiento",     icon:"💡"},
        {id:"tc_limpia",      name:"Limpiaparabrisas / nivel líquido",     method:"Visualmente / comprobando nivel depósito",     icon:"🌊"},
      ]},
      {label:"Sistema Hidráulico y Carga", items:[
        {id:"tc_5ta_rueda",   name:"5ª Rueda y brazo de elevación",        method:"Visualmente — lubricación si necesario",       icon:"⚙️"},
        {id:"tc_aceite_h",    name:"Nivel de aceite hidráulico",           method:"Mirilla de medición",                          icon:"🔧"},
        {id:"tc_valvula",     name:"Válvula lógica de dirección",          method:"Funcional — girar ruedas y asiento",           icon:"🔄"},
      ]},
    ]
  },
  grua_horquilla:{
    label:"Grúa Horquilla",
    equipTypes:["Grúa Portuaria"],
    sections:[
      {label:"Motor", items:[
        {id:"gh_fugas",       name:"Fugas de aceite, líquido o aire",      method:"Visualmente bajo la máquina",                  icon:"💧"},
        {id:"gh_aceite_m",    name:"Nivel de aceite motor",                method:"Varilla de medición",                          icon:"🛢️"},
        {id:"gh_refrig",      name:"Nivel de refrigerante",                method:"Visualmente — depósito de expansión",          icon:"🌡️"},
      ]},
      {label:"Sistema Hidráulico", items:[
        {id:"gh_aceite_h",    name:"Nivel de aceite hidráulico",           method:"Mirilla / varilla de medición",                icon:"🔧"},
        {id:"gh_mangueras",   name:"Cilindros y mangueras hidráulicas",    method:"Visualmente — sin fugas activas",              icon:"🔩"},
      ]},
      {label:"Mástil y Horquillas", items:[
        {id:"gh_mastil",      name:"Estado del mástil",                    method:"Visualmente — fisuras, deformaciones",         icon:"📏"},
        {id:"gh_horquillas",  name:"Horquillas y porta-horquillas",        method:"Visualmente — deformación, grietas",           icon:"⚙️"},
        {id:"gh_cadenas",     name:"Cadenas de elevación",                 method:"Visualmente — elongación, corrosión",          icon:"⛓️"},
      ]},
      {label:"Ruedas y Frenos", items:[
        {id:"gh_ruedas",      name:"Estado de ruedas",                     method:"Visualmente — desgaste, cortes, deformación",  icon:"⭕"},
        {id:"gh_frenos",      name:"Frenos de servicio y parqueo",         method:"Prueba funcional antes de operar",             icon:"🛑"},
      ]},
      {label:"Cabina y Controles", items:[
        {id:"gh_cinturon",    name:"Cinturón de seguridad",                method:"Visualmente / funcional — bloqueo correcto",   icon:"🔒"},
        {id:"gh_luces",       name:"Luces y señalización acústica",        method:"Visualmente / funcional",                      icon:"🔦"},
        {id:"gh_controles",   name:"Controles e indicadores panel",        method:"Visualmente — antes y después de arrancar",    icon:"🎛️"},
        {id:"gh_bateria",     name:"Nivel batería / combustible GLP",      method:"Indicador carga / manómetro presión",          icon:"🔋"},
      ]},
    ]
  },
};
