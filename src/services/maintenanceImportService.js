import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db } from './firebase';
import { mapEquipment, mapHistory, mapPlan, mapWorkOrder, validateWorkbookSheets } from '../utils/maintenanceExcelMapper';

const withUpdatedAt = item => ({ ...item, updatedAt: serverTimestamp() });

export async function parseMaintenanceWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetRows = {};
  workbook.SheetNames.forEach(name => { sheetRows[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' }); });
  const errors = validateWorkbookSheets(sheetRows);
  const equipment = (sheetRows.Equipos || []).map(mapEquipment).filter(item => item.id);
  const plans = (sheetRows.Planes_Mantenimiento || []).map(mapPlan).filter(item => item.id);
  const workOrders = (sheetRows.Ordenes_Trabajo || []).map(mapWorkOrder).filter(item => item.id);
  const history = (sheetRows.Historial_Mantenimiento || []).map(mapHistory).filter(item => item.id);
  const equipmentIds = new Set(equipment.map(item => item.id));
  const missingEquipment = plans.filter(plan => plan.equipmentId && !equipmentIds.has(plan.equipmentId)).map(plan => plan.equipmentId);
  return { fileName: file.name, equipment, plans, workOrders, history, errors, missingEquipment: [...new Set(missingEquipment)], counts: { equipment: equipment.length, plans: plans.length, workOrders: workOrders.length, history: history.length } };
}

async function upsert(companyId, collectionName, item) {
  await setDoc(doc(db, 'companies', companyId, collectionName, item.id), withUpdatedAt(item), { merge: true });
}

export async function importMaintenanceWorkbook(companyId, preview, user) {
  if (preview.errors?.length) throw new Error('No se puede importar con errores críticos de columnas.');
  await Promise.all([
    ...preview.equipment.map(item => upsert(companyId, 'equipment', item)),
    ...preview.plans.map(item => upsert(companyId, 'maintenancePlans', item)),
    ...preview.workOrders.map(item => upsert(companyId, 'workOrders', item)),
    ...preview.history.map(item => upsert(companyId, 'maintenanceHistory', item)),
  ]);
  const importRef = doc(db, 'companies', companyId, 'imports', `${Date.now()}-${preview.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
  const payload = { fileName: preview.fileName, importedBy: user?.uid || null, importedByName: user?.name || user?.email || 'Usuario', importedAt: serverTimestamp(), counts: preview.counts, errors: preview.errors || [], missingEquipment: preview.missingEquipment || [], status: 'completed' };
  await setDoc(importRef, payload, { merge: true });
  return { id: importRef.id, ...payload };
}
