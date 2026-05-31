export const CHECKLIST_ITEM_STATUS = {
  good: 'Bueno',
  conditional: 'Condicional',
  bad: 'Malo',
  na: 'No aplica',
};

export const CHECKLIST_STATUS_LABELS = CHECKLIST_ITEM_STATUS;

const criteria = name => ({
  good: `${name}: condición normal, funcional y segura para operar.`,
  conditional: `${name}: condición aceptable con restricción; requiere observación y seguimiento.`,
  bad: `${name}: condición insegura o falla que requiere detención, fotografía y revisión inmediata.`,
});

const item = (id, section, name, method, criticality = 'media', extra = {}) => ({
  id,
  section,
  name,
  method,
  criticality,
  requiresPhotoOnBad: true,
  requiresObservationOnCondOrBad: true,
  hasLevel: false,
  levelRef: '',
  allowNa: true,
  criteria: criteria(name),
  ...extra,
});

const buildItems = sections => sections.flatMap(section => section.items.map(entry => item(
  entry.id,
  section.name,
  entry.name,
  entry.method || `Inspeccionar y probar: ${entry.name}.`,
  entry.criticality || 'media',
  entry.extra || {},
)));

const tractoSectionsConfig = [
  { name: 'Identificación', items: [
    { id: 'tag_visible', name: 'TAG / código visible' },
    { id: 'patente_identificacion', name: 'Patente o identificación interna si aplica', criticality: 'baja' },
    { id: 'horometro', name: 'Horómetro', criticality: 'media', extra: { hasLevel: true, levelRef: 'hourmeter' } },
    { id: 'combustible', name: 'Nivel de combustible', extra: { hasLevel: true, levelRef: 'fuel' } },
    { id: 'terminal_faena', name: 'Terminal / faena', criticality: 'baja' },
  ] },
  { name: 'Cabina y seguridad', items: ['Cinturón de seguridad', 'Bocina', 'Alarma de retroceso', 'Baliza', 'Espejos', 'Extintor', 'Limpieza y orden de cabina'].map((name, index) => ({ id: `cabina_${index}`, name, criticality: ['Cinturón de seguridad', 'Alarma de retroceso'].includes(name) ? 'alta' : 'media' })) },
  { name: 'Motor y fluidos', items: ['Nivel aceite motor', 'Nivel refrigerante', 'Fugas visibles de aceite', 'Fugas visibles de refrigerante', 'Fugas visibles de combustible', 'Estado correas/mangueras visibles'].map((name, index) => ({ id: `motor_${index}`, name, criticality: name.includes('Fugas') ? 'alta' : 'media', extra: name.startsWith('Nivel') ? { hasLevel: true, levelRef: name.toLowerCase().replaceAll(' ', '_') } : {} })) },
  { name: 'Sistema eléctrico y luces', items: ['Luces delanteras', 'Luces traseras', 'Luces de freno', 'Luces de retroceso', 'Intermitentes', 'Tablero sin alarmas críticas'].map((name, index) => ({ id: `electrico_${index}`, name, criticality: name.includes('alarmas') ? 'alta' : 'media' })) },
  { name: 'Neumáticos y ruedas', items: ['Estado neumáticos delanteros', 'Estado neumáticos traseros', 'Tuercas visibles', 'Presión visual adecuada', 'Cortes o deformaciones'].map((name, index) => ({ id: `neumaticos_${index}`, name, criticality: 'alta' })) },
  { name: 'Frenos y aire', items: ['Presión de aire correcta', 'Freno de servicio', 'Freno estacionamiento', 'Fugas de aire audibles', 'Acople líneas de aire'].map((name, index) => ({ id: `frenos_${index}`, name, criticality: 'alta' })) },
  { name: 'Quinta rueda / acople', items: ['Estado quinta rueda', 'Seguro de quinta rueda', 'Lubricación quinta rueda', 'Mangueras y conexiones al acoplado', 'Pasador / sistema de bloqueo'].map((name, index) => ({ id: `quinta_${index}`, name, criticality: 'alta' })) },
  { name: 'Sistema hidráulico si aplica', items: ['Nivel hidráulico', 'Fugas hidráulicas', 'Mangueras hidráulicas visibles', 'Acoples hidráulicos'].map((name, index) => ({ id: `hidraulico_${index}`, name, criticality: name.includes('Fugas') ? 'alta' : 'media', extra: name.includes('Nivel') ? { hasLevel: true, levelRef: 'nivel_hidraulico' } : {} })) },
  { name: 'Prueba operacional', items: ['Dirección', 'Avance / retroceso', 'Respuesta de acelerador', 'Ruidos anormales', 'Vibraciones anormales'].map((name, index) => ({ id: `prueba_${index}`, name, criticality: ['Ruidos anormales', 'Vibraciones anormales'].includes(name) ? 'alta' : 'media' })) },
];

const gruaHorquillaSectionsConfig = [
  { name: 'Identificación', items: ['TAG / código visible', 'Horómetro', 'Combustible o carga de batería si aplica', 'Terminal / faena'].map((name, index) => ({ id: `gh_id_${index}`, name, extra: name.includes('Horómetro') || name.includes('Combustible') ? { hasLevel: true, levelRef: name.toLowerCase().replaceAll(' ', '_') } : {} })) },
  { name: 'Seguridad', items: ['Cinturón', 'Bocina', 'Alarma de retroceso', 'Baliza', 'Espejos', 'Extintor', 'Techo protector', 'Respaldo de carga'].map((name, index) => ({ id: `gh_seg_${index}`, name, criticality: ['Cinturón', 'Alarma de retroceso', 'Techo protector', 'Respaldo de carga'].includes(name) ? 'alta' : 'media' })) },
  { name: 'Motor / energía', items: ['Nivel aceite motor', 'Nivel refrigerante', 'Fugas de aceite', 'Fugas de combustible', 'Estado batería', 'Tablero sin alarmas críticas'].map((name, index) => ({ id: `gh_motor_${index}`, name, criticality: name.includes('Fugas') || name.includes('alarmas') ? 'alta' : 'media', extra: name.startsWith('Nivel') ? { hasLevel: true, levelRef: name.toLowerCase().replaceAll(' ', '_') } : {} })) },
  { name: 'Sistema hidráulico', items: ['Nivel hidráulico', 'Fugas hidráulicas', 'Cilindros de levante', 'Cilindro de inclinación', 'Mangueras hidráulicas', 'Acoples visibles'].map((name, index) => ({ id: `gh_hid_${index}`, name, criticality: 'alta', extra: name.includes('Nivel') ? { hasLevel: true, levelRef: 'nivel_hidraulico' } : {} })) },
  { name: 'Mástil y horquillas', items: ['Estado mástil', 'Cadenas de levante', 'Rodillos', 'Horquillas sin fisuras ni deformación', 'Seguro de horquillas', 'Desplazador lateral si aplica'].map((name, index) => ({ id: `gh_mastil_${index}`, name, criticality: 'alta' })) },
  { name: 'Neumáticos y ruedas', items: ['Estado neumáticos', 'Cortes o desgaste', 'Tuercas visibles', 'Llantas sin daño visible'].map((name, index) => ({ id: `gh_neu_${index}`, name, criticality: 'alta' })) },
  { name: 'Frenos y dirección', items: ['Freno de servicio', 'Freno de estacionamiento', 'Dirección', 'Juego excesivo en dirección'].map((name, index) => ({ id: `gh_frenos_${index}`, name, criticality: 'alta' })) },
  { name: 'Prueba operacional', items: ['Levante', 'Descenso', 'Inclinación adelante / atrás', 'Avance', 'Retroceso', 'Ruidos anormales', 'Vibraciones anormales'].map((name, index) => ({ id: `gh_prueba_${index}`, name, criticality: ['Ruidos anormales', 'Vibraciones anormales'].includes(name) ? 'alta' : 'media' })) },
];

const lifttecSectionsConfig = [
  { name: 'Identificación', items: ['TAG / código visible', 'Terminal', 'Horómetro si aplica'].map((name, index) => ({ id: `lf_id_${index}`, name, extra: name.includes('Horómetro') ? { hasLevel: true, levelRef: 'hourmeter' } : {} })) },
  { name: 'Seguridad', items: ['Bocina', 'Alarma retroceso', 'Baliza', 'Luces', 'Extintor'].map((name, index) => ({ id: `lf_seg_${index}`, name, criticality: ['Alarma retroceso', 'Luces'].includes(name) ? 'alta' : 'media' })) },
  { name: 'Estructura', items: ['Estado general estructura', 'Fisuras visibles', 'Golpes o deformaciones', 'Puntos de anclaje'].map((name, index) => ({ id: `lf_est_${index}`, name, criticality: name.includes('Fisuras') ? 'alta' : 'media' })) },
  { name: 'Hidráulico', items: ['Fugas hidráulicas', 'Mangueras', 'Cilindros', 'Acoples'].map((name, index) => ({ id: `lf_hid_${index}`, name, criticality: 'alta' })) },
  { name: 'Neumáticos / rodado', items: ['Estado neumáticos', 'Tuercas', 'Desgaste'].map((name, index) => ({ id: `lf_rodado_${index}`, name, criticality: 'media' })) },
  { name: 'Prueba operacional', items: ['Movimiento principal', 'Dirección', 'Frenos', 'Ruidos anormales'].map((name, index) => ({ id: `lf_prueba_${index}`, name, criticality: ['Frenos', 'Ruidos anormales'].includes(name) ? 'alta' : 'media' })) },
];

const makeTemplate = ({ id, label, equipmentType, description, fuelLabel, fuelOptions, sections }) => ({
  id,
  label,
  equipmentType,
  description,
  fuelLabel,
  fuelOptions,
  sections: sections.map(section => section.name),
  items: buildItems(sections),
});

export const checklistTemplates = {
  tracto: makeTemplate({
    id: 'tracto',
    label: 'Tracto portuario',
    equipmentType: 'tracto',
    description: 'Inspección preoperacional real para tractos portuarios y terminal tractors.',
    fuelLabel: 'Nivel de combustible',
    fuelOptions: ['E', '1/4', '1/2', '3/4', 'F'],
    sections: tractoSectionsConfig,
  }),
  grua_horquilla: makeTemplate({
    id: 'grua_horquilla',
    label: 'Grúa horquilla Komatsu',
    equipmentType: 'grua_horquilla',
    description: 'Checklist operacional para grúa horquilla Komatsu.',
    fuelLabel: 'Combustible / batería',
    fuelOptions: ['E', '1/4', '1/2', '3/4', 'F', 'Batería baja', 'Batería media', 'Batería completa'],
    sections: gruaHorquillaSectionsConfig,
  }),
  lifttec: makeTemplate({
    id: 'lifttec',
    label: 'Lifttec',
    equipmentType: 'lifttec',
    description: 'Checklist general para equipos Lifttec.',
    fuelLabel: 'Energía / combustible',
    fuelOptions: ['No aplica', 'Bajo', 'Medio', 'Alto', 'Completo'],
    sections: lifttecSectionsConfig,
  }),
};

checklistTemplates.grua = { ...checklistTemplates.grua_horquilla, id: 'grua' };

export function normalizeEquipmentType(type = '') {
  const value = String(type).toLowerCase().trim();
  if (['tracto', 'terminal_tractor', 'tractor', 'tractos'].includes(value)) return 'tracto';
  if (['grua_horquilla', 'grúa horquilla', 'grua horquilla', 'horquilla', 'komatsu', 'grua'].includes(value)) return 'grua_horquilla';
  if (['lifttec', 'lift_tec'].includes(value)) return 'lifttec';
  return value;
}

export function getTemplateIdForEquipment(equipment) {
  const normalized = normalizeEquipmentType(equipment?.type || equipment?.equipmentType || '');
  return checklistTemplates[normalized] ? normalized : 'tracto';
}

export function getChecklistTemplate(id) {
  return checklistTemplates[id] || checklistTemplates.tracto;
}

export const checklistTemplateOptions = ['tracto', 'grua_horquilla', 'lifttec'].map(key => ({ ...checklistTemplates[key], value: key }));

export function getChecklistTemplateOptions() {
  return checklistTemplateOptions;
}
