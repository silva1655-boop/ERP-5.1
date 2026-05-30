export const CHECKLIST_ITEM_STATUS = {
  good: 'Bueno',
  conditional: 'Condicional',
  bad: 'Malo',
  na: 'No aplica',
};

export const CHECKLIST_STATUS_LABELS = {
  good: 'Bueno',
  conditional: 'Condicional',
  bad: 'Malo',
  na: 'No aplica',
};

const criteria = name => ({
  good: `${name}: condición normal, funcional y segura para operar.`,
  conditional: `${name}: desviación controlable; requiere observación, seguimiento o programación de corrección.`,
  bad: `${name}: falla, condición insegura o defecto que requiere detención/revisión inmediata.`,
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

const tractoSections = [
  'Identificación del equipo',
  'Estado general',
  'Motor',
  'Sistema hidráulico',
  'Sistema eléctrico',
  'Neumáticos',
  'Frenos',
  'Quinta rueda',
  'Luces',
  'Cabina',
  'Seguridad',
  'Observaciones finales',
];

const gruaSections = [
  'Identificación del equipo',
  'Estado general',
  'Motor',
  'Sistema hidráulico',
  'Sistema eléctrico',
  'Estabilizadores',
  'Pluma / brazo',
  'Gancho / cable / accesorios',
  'Neumáticos o tren de rodado',
  'Frenos',
  'Luces',
  'Seguridad',
  'Observaciones finales',
];

export const checklistTemplates = {
  tracto: {
    id: 'tracto',
    label: 'Tracto',
    equipmentType: 'Tracto',
    description: 'Inspección preoperacional móvil para tractos, terminal tractors y equipos de arrastre.',
    fuelLabel: 'Combustible',
    fuelOptions: ['E', '1/4', '1/2', '3/4', 'F'],
    sections: tractoSections,
    items: [
      item('identificacion_tag', 'Identificación del equipo', 'TAG / código visible', 'Confirmar que el TAG o código corresponde al equipo seleccionado.', 'media'),
      item('identificacion_documentos', 'Identificación del equipo', 'Documentación / permisos visibles', 'Verificar que documentación operacional requerida esté disponible si aplica.', 'baja'),
      item('carroceria_general', 'Estado general', 'Estado general de carrocería y chasis', 'Inspeccionar golpes, deformaciones, corrosión, piezas sueltas o daños visibles.', 'media'),
      item('fugas_generales', 'Estado general', 'Fugas visibles bajo el equipo', 'Revisar piso y bajos del tracto antes de moverlo.', 'alta'),
      item('aceite_motor', 'Motor', 'Nivel aceite motor', 'Verificar varilla o indicador de nivel.', 'alta', { hasLevel: true, levelRef: 'aceite_motor' }),
      item('refrigerante', 'Motor', 'Nivel refrigerante', 'Inspeccionar depósito, tapas y posibles alertas.', 'alta', { hasLevel: true, levelRef: 'refrigerante' }),
      item('fugas_motor_transmision', 'Motor', 'Fugas visibles motor/transmisión', 'Revisar motor, caja, mangueras y conexiones.', 'alta'),
      item('ruidos_motor', 'Motor', 'Ruido / vibración anormal del motor', 'Arrancar y escuchar funcionamiento antes de operar.', 'alta'),
      item('brazo_hidraulico', 'Sistema hidráulico', 'Brazo de elevación / sistema hidráulico', 'Probar operación, ruidos, holguras y respuesta hidráulica.', 'alta'),
      item('aceite_hidraulico', 'Sistema hidráulico', 'Nivel aceite hidráulico', 'Verificar indicador o visor de nivel.', 'alta', { hasLevel: true, levelRef: 'aceite_hidraulico' }),
      item('mangueras_hidraulicas', 'Sistema hidráulico', 'Mangueras y acoples hidráulicos', 'Inspeccionar desgaste, fugas, rozaduras y fijaciones.', 'alta'),
      item('bateria_conexiones', 'Sistema eléctrico', 'Batería y conexiones', 'Revisar bornes, fijación, sulfatación y cables visibles.', 'media'),
      item('tablero_indicadores', 'Sistema eléctrico', 'Tablero e indicadores', 'Comprobar alertas, indicadores y testigos al energizar.', 'media'),
      item('neumatico_di', 'Neumáticos', 'Estado neumático delantero izquierdo', 'Inspección visual de cortes, desgaste y presión aparente.', 'alta'),
      item('neumatico_dd', 'Neumáticos', 'Estado neumático delantero derecho', 'Inspección visual de cortes, desgaste y presión aparente.', 'alta'),
      item('neumatico_ti', 'Neumáticos', 'Estado neumático trasero izquierdo', 'Inspección visual de cortes, desgaste y presión aparente.', 'alta'),
      item('neumatico_td', 'Neumáticos', 'Estado neumático trasero derecho', 'Inspección visual de cortes, desgaste y presión aparente.', 'alta'),
      item('presion_neumaticos', 'Neumáticos', 'Presión/condición visual neumáticos', 'Verificar presión aparente, tuercas y condición general.', 'media'),
      item('freno_servicio', 'Frenos', 'Frenos de servicio', 'Probar respuesta de frenado a baja velocidad antes de operar.', 'alta'),
      item('freno_estacionamiento', 'Frenos', 'Freno de estacionamiento', 'Comprobar retención del equipo detenido.', 'alta'),
      item('quinta_rueda', 'Quinta rueda', 'Quinta rueda', 'Verificar lubricación, fisuras, fijación y operación de seguros.', 'alta'),
      item('clavijas_seguros', 'Quinta rueda', 'Clavijas o seguros de cabina', 'Comprobar presencia, fijación y condición de seguros.', 'alta'),
      item('luces_delanteras', 'Luces', 'Luces delanteras', 'Encender y verificar funcionamiento.', 'media'),
      item('luces_traseras', 'Luces', 'Luces traseras', 'Encender y verificar funcionamiento.', 'media'),
      item('baliza', 'Luces', 'Baliza', 'Verificar giro/destello visible.', 'media'),
      item('alarma_retroceso', 'Luces', 'Alarma de retroceso', 'Enganchar reversa y verificar alarma.', 'alta'),
      item('cabina_controles', 'Cabina', 'Cabina y controles', 'Revisar tablero, comandos, asiento y condición interior.', 'media'),
      item('espejos', 'Cabina', 'Espejos', 'Verificar presencia, fijación, limpieza y visibilidad.', 'media'),
      item('limpiaparabrisas', 'Cabina', 'Limpiaparabrisas', 'Probar barrido y estado de plumillas.', 'baja'),
      item('cinturon', 'Seguridad', 'Cinturón de seguridad', 'Verificar anclaje, bloqueo y estado de cinta.', 'alta'),
      item('bocina', 'Seguridad', 'Bocina', 'Probar señal sonora.', 'media'),
      item('extintor', 'Seguridad', 'Extintor si aplica', 'Verificar presencia, presión, sello y vencimiento.', 'media'),
      item('observaciones_finales', 'Observaciones finales', 'Condición final para operar', 'Registrar cualquier condición relevante no cubierta por otros ítems.', 'media'),
    ],
  },
  grua: {
    id: 'grua',
    label: 'Grúa',
    equipmentType: 'Grúa',
    description: 'Inspección preoperacional para grúas con pluma, brazo, gancho, cables y estabilizadores.',
    fuelLabel: 'Combustible / energía',
    fuelOptions: ['E', '1/4', '1/2', '3/4', 'F', 'Batería baja', 'Batería media', 'Batería completa'],
    sections: gruaSections,
    items: [
      item('identificacion_tag', 'Identificación del equipo', 'TAG / código visible', 'Confirmar que el TAG o código corresponde al equipo seleccionado.', 'media'),
      item('documentacion_capacidad', 'Identificación del equipo', 'Tabla de carga / documentación visible', 'Verificar disponibilidad de tabla de carga, permiso o documentación aplicable.', 'alta'),
      item('estructura_general', 'Estado general', 'Estructura general y chasis', 'Inspeccionar golpes, fisuras, deformaciones, corrosión o partes sueltas.', 'alta'),
      item('fugas_generales', 'Estado general', 'Fugas visibles bajo el equipo', 'Revisar piso, bajos, motor y zonas hidráulicas.', 'alta'),
      item('aceite_motor', 'Motor', 'Nivel aceite motor', 'Verificar varilla o indicador.', 'alta', { hasLevel: true, levelRef: 'aceite_motor' }),
      item('refrigerante', 'Motor', 'Nivel refrigerante', 'Revisar depósito, tapas y alertas.', 'alta', { hasLevel: true, levelRef: 'refrigerante' }),
      item('ruidos_motor', 'Motor', 'Ruido / vibración anormal del motor', 'Arrancar y escuchar funcionamiento antes de operar.', 'alta'),
      item('aceite_hidraulico', 'Sistema hidráulico', 'Nivel aceite hidráulico', 'Verificar visor o indicador de nivel.', 'alta', { hasLevel: true, levelRef: 'aceite_hidraulico' }),
      item('cilindros_hidraulicos', 'Sistema hidráulico', 'Cilindros hidráulicos', 'Inspeccionar vástagos, sellos, fugas y fijaciones.', 'alta'),
      item('mangueras_hidraulicas', 'Sistema hidráulico', 'Mangueras hidráulicas', 'Revisar fugas, rozaduras, cortes y acoples.', 'alta'),
      item('tablero_indicadores', 'Sistema eléctrico', 'Tablero e indicadores', 'Comprobar alertas, limitadores y testigos al energizar.', 'alta'),
      item('bateria_conexiones', 'Sistema eléctrico', 'Batería y conexiones', 'Revisar bornes, fijación y cables visibles.', 'media'),
      item('estabilizadores_estado', 'Estabilizadores', 'Estabilizadores', 'Probar extensión/retracción, apoyos, fisuras y fijación.', 'alta'),
      item('patines_apoyo', 'Estabilizadores', 'Patines / apoyos de estabilizadores', 'Verificar estado, pasadores y superficie de apoyo.', 'alta'),
      item('pluma_brazo', 'Pluma / brazo', 'Pluma / brazo', 'Inspeccionar fisuras, deformación, soldaduras y holguras.', 'alta'),
      item('extension_pluma', 'Pluma / brazo', 'Extensión / retracción de pluma', 'Probar movimientos suaves sin golpes, alarmas o bloqueos.', 'alta'),
      item('gancho', 'Gancho / cable / accesorios', 'Gancho y pestillo de seguridad', 'Verificar deformación, giro, pestillo y seguro operativo.', 'alta'),
      item('cable_cadena', 'Gancho / cable / accesorios', 'Cable / cadena / eslingas asociadas', 'Inspeccionar desgaste, hebras cortadas, aplastamiento o deformación.', 'alta'),
      item('accesorios_izaje', 'Gancho / cable / accesorios', 'Accesorios de izaje', 'Verificar grilletes, seguros, identificación y condición visual.', 'alta'),
      item('neumaticos_tren', 'Neumáticos o tren de rodado', 'Neumáticos o tren de rodado', 'Inspección visual de cortes, desgaste, presión aparente y rodado.', 'alta'),
      item('tuercas_llantas', 'Neumáticos o tren de rodado', 'Tuercas, llantas o zapatas', 'Revisar fijaciones, fisuras, desgaste y condición general.', 'media'),
      item('freno_servicio', 'Frenos', 'Frenos de servicio', 'Probar respuesta de frenado a baja velocidad.', 'alta'),
      item('freno_estacionamiento', 'Frenos', 'Freno de estacionamiento', 'Comprobar retención del equipo detenido.', 'alta'),
      item('luces_delanteras', 'Luces', 'Luces delanteras', 'Encender y verificar funcionamiento.', 'media'),
      item('luces_traseras', 'Luces', 'Luces traseras', 'Encender y verificar funcionamiento.', 'media'),
      item('baliza', 'Luces', 'Baliza', 'Verificar giro/destello visible.', 'media'),
      item('alarma_retroceso', 'Luces', 'Alarma de retroceso', 'Enganchar reversa y verificar alarma.', 'alta'),
      item('limitador_carga', 'Seguridad', 'Limitador / alarma de carga', 'Verificar funcionamiento o ausencia de alertas críticas.', 'alta'),
      item('cinturon', 'Seguridad', 'Cinturón de seguridad', 'Verificar anclaje, bloqueo y estado de cinta.', 'alta'),
      item('bocina', 'Seguridad', 'Bocina', 'Probar señal sonora.', 'media'),
      item('extintor', 'Seguridad', 'Extintor', 'Verificar presencia, presión, sello y vencimiento.', 'media'),
      item('observaciones_finales', 'Observaciones finales', 'Condición final para operar', 'Registrar cualquier condición relevante no cubierta por otros ítems.', 'media'),
    ],
  },
};

checklistTemplates.grua_horquilla = {
  ...checklistTemplates.grua,
  id: 'grua_horquilla',
  label: 'Grúa horquilla / legacy',
};

export function getChecklistTemplate(id) {
  return checklistTemplates[id] || checklistTemplates.tracto;
}

export const checklistTemplateOptions = [checklistTemplates.tracto, checklistTemplates.grua].map(template => ({ ...template, value: template.id }));

export function getChecklistTemplateOptions() {
  return checklistTemplateOptions;
}
