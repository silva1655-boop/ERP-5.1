export const REQUIRED_SHEETS = ['Equipos', 'Planes_Mantenimiento', 'Ordenes_Trabajo', 'Historial_Mantenimiento'];
export const REQUIRED_COLUMNS = {
  Equipos: ['ID_Equipo', 'Nombre', 'Tipo', 'Horometro_Actual'],
  Planes_Mantenimiento: ['ID_Plan', 'ID_Equipo', 'Actividad_Plan', 'Tipo_Plan', 'Frecuencia'],
  Ordenes_Trabajo: ['ID_OT', 'ID_Plan', 'ID_Equipo', 'Estado'],
  Historial_Mantenimiento: ['ID_Historial', 'ID_OT', 'Fecha_Cierre'],
};

export function normalizeNumber(value) {
  if (value === null || value === undefined || value === '' || value === '$-') return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeBoolean(value) {
  return ['y', 'yes', 'si', 'sí', 'true', '1', 'activo'].includes(String(value || '').trim().toLowerCase());
}

export function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export function normalizeStatus(value) {
  const rawStatus = String(value || '').trim();
  const normalized = rawStatus.toLowerCase();
  if (normalized.includes('fuera')) return 'fuera_servicio';
  if (normalized.includes('mant')) return 'mantenimiento';
  if (normalized.includes('cerr')) return 'completada';
  if (normalized.includes('pend')) return 'pendiente';
  if (normalized.includes('oper')) return 'operativo';
  if (normalized.includes('obs')) return 'observado';
  return normalized || 'pendiente';
}

export function mapEquipment(row) {
  return {
    id: String(row.ID_Equipo || '').trim(), code: String(row.ID_Equipo || '').trim(), name: row.Nombre || '', model: row.Modelo || '', type: row.Tipo || '', location: row.Ubicacion || '',
    status: normalizeStatus(row.Estado), rawStatus: row.Estado || '', hourmeter: normalizeNumber(row.Horometro_Actual), horometroActual: normalizeNumber(row.Horometro_Actual),
    hourmeterUpdatedAt: normalizeDate(row.Fecha_Actualizacion_Horo), vessel: row.Buque || '', strategy: row.Estrategia || '', source: 'excel_import',
  };
}

export function mapPlan(row) {
  return {
    id: String(row.ID_Plan || '').trim(), vessel: row.Nave || '', area: row.Area || '', equipmentId: String(row.ID_Equipo || '').trim(), responsible: row.Responsable_Plan || '',
    activity: row.Actividad_Plan || '', name: row.Actividad_Plan || row.ID_Plan || '', planType: row.Tipo_Plan || '', frequencyValue: normalizeNumber(row.Frecuencia), frequencyUnit: row.Unidad || '',
    active: normalizeBoolean(row.Activo), subjectToConclusion: normalizeBoolean(row.Sujeto_a_Conclusion), lastWorkOrderDate: normalizeDate(row.Fecha_Ultima_OT),
    lastWorkOrderHourmeter: normalizeNumber(row.Horometro_Ultima_OT), nextDate: normalizeDate(row.Proxima_Fecha), nextHourmeter: normalizeNumber(row.Proximo_Horometro),
    sparePartCost: normalizeNumber(row['Valor Repuesto']), serviceCost: normalizeNumber(row['Valor Servicio']), criticality: row.Criticidad || '', source: 'excel_import',
  };
}

export function mapWorkOrder(row) {
  return {
    id: String(row.ID_OT || '').trim(), maintenancePlanId: String(row.ID_Plan || '').trim(), equipmentId: String(row.ID_Equipo || '').trim(), createdAtOriginal: normalizeDate(row.Fecha_Creacion),
    scheduledDate: normalizeDate(row.Fecha_Programada), status: normalizeStatus(row.Estado), rawStatus: row.Estado || '', creationHourmeter: normalizeNumber(row.Horometro_Creacion),
    triggerMethod: row.Metodo_Disparo || '', closedAtOriginal: normalizeDate(row.Fecha_Cierre), closingHourmeter: normalizeNumber(row.Horometro_Cierre), source: 'excel_import',
  };
}

export function mapHistory(row) {
  return {
    id: String(row.ID_Historial || '').trim(), workOrderId: String(row.ID_OT || '').trim(), closedAt: normalizeDate(row.Fecha_Cierre), closingHourmeter: normalizeNumber(row.Horometro_Cierre),
    place: row.Lugar || '', maintenancePerformedBy: row['Mantención efectuada por'] || '', testsPerformedBy: row['Pruebas Efectuadas por'] || '', condition: row['Condición'] || '',
    maintenanceType: row['Mantención Por'] || '', observations: row.Observaciones || '', sparePartsUsed: row['Repuestos usados'] || '', photos: row.Fotos || '', source: 'excel_import',
  };
}

export function validateWorkbookSheets(sheetRows) {
  const errors = [];
  REQUIRED_SHEETS.forEach(sheet => {
    if (!sheetRows[sheet]) errors.push(`Falta hoja ${sheet}.`);
    const first = sheetRows[sheet]?.[0] || {};
    (REQUIRED_COLUMNS[sheet] || []).forEach(column => { if (!(column in first)) errors.push(`Falta columna ${column} en hoja ${sheet}.`); });
  });
  return errors;
}
