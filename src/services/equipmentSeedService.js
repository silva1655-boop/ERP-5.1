import { createDocument, listDocuments } from './firestoreService';

const baseEquipment = [
  ['T648', 'Tracto T648', 'tracto', 1999, 'XLWR80030X1561544', 'operativo'],
  ['T659', 'Tracto T659', 'tracto', 2000, 'XLWR8013XY1712408', 'operativo'],
  ['T779', 'Tracto T779', 'tracto', 1997, 'XLWR80037V1040916', 'operativo'],
  ['T789', 'Tracto T789', 'tracto', 1999, 'XLWR80038X1481506', 'operativo'],
  ['T73', 'Tracto T73', 'tracto', 2013, 'XLWRT223XD5023414', 'operativo'],
  ['T74', 'Tracto T74', 'tracto', 2013, 'XLWRT2230D4993410', 'operativo'],
  ['K69', 'Tracto K69', 'tracto', 2015, '49928', 'fuera_servicio'],
  ['K71', 'Tracto K71', 'tracto', 2015, '49930', 'operativo'],
  ['K72', 'Tracto K72', 'tracto', 2015, '49931', 'operativo'],
  ['K73', 'Tracto K73', 'tracto', 2011, '49453', 'operativo'],
  ['K75', 'Tracto K75', 'tracto', 2011, '49452', 'operativo'],
  ['K76', 'Tracto K76', 'tracto', 2011, '49454', 'operativo'],
  ['M01', 'Tracto M01', 'tracto', 2018, 'YA1R48B1137305635', 'fuera_servicio'],
  ['M02', 'Tracto M02', 'tracto', 2018, 'YA1R48B1137305636', 'operativo'],
  ['M03', 'Tracto M03', 'tracto', 2018, 'YA1R48B1137305637', 'operativo'],
  ['M04', 'Tracto M04', 'tracto', 2018, 'YA1R48B1137305638', 'operativo'],
  ['GH39', 'Grúa Horquilla GH39', 'grua_horquilla', 2015, '', 'operativo'],
  ['GH40', 'Grúa Horquilla GH40', 'grua_horquilla', 2015, '', 'fuera_servicio'],
  ['GH41', 'Grúa Horquilla GH41', 'grua_horquilla', 2015, '', 'operativo'],
  ['LF01', 'Lifttec LF01', 'lifttec', '', '', 'fuera_servicio'],
  ['LF02', 'Lifttec LF02', 'lifttec', '', '', 'operativo'],
  ['LF03', 'Lifttec LF03', 'lifttec', '', '', 'operativo'],
];

const categoryByType = {
  tracto: 'Tractos compañía',
  grua_horquilla: 'Grúas horquilla',
  lifttec: 'Lifttec',
};

export const NAVIMAG_EQUIPMENT_SEED = baseEquipment.map(([code, name, type, year, chassis, status]) => ({
  code,
  name,
  type,
  category: categoryByType[type] || 'Equipo operacional',
  status,
  year,
  chassis,
  terminal: 'Terminal 1',
  active: status !== 'fuera_servicio',
  criticality: 'B',
  hourmeter: 0,
  odometer: 0,
  source: 'seed_navimag',
}));

export async function seedNavimagEquipment(companyId, user) {
  const existing = await listDocuments(companyId, 'equipment');
  const existingCodes = new Set(existing.map(item => String(item.code || item.id || '').trim().toLowerCase()).filter(Boolean));
  const created = [];
  const skipped = [];

  for (const equipment of NAVIMAG_EQUIPMENT_SEED) {
    const codeKey = equipment.code.toLowerCase();
    if (existingCodes.has(codeKey)) {
      skipped.push(equipment.code);
      continue;
    }
    await createDocument(companyId, 'equipment', equipment, user, equipment.code);
    existingCodes.add(codeKey);
    created.push(equipment.code);
  }

  return { created, skipped, total: NAVIMAG_EQUIPMENT_SEED.length };
}
