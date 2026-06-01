import { getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { companyCollection, companyDoc } from './firestoreService';
import { logStatusChange, logUpdate } from './auditService';

export async function updateEquipmentAfterChecklist(companyId, equipmentId, { hourmeter, status, checklistId, checklistFolio }, user) {
  if (!equipmentId) return;
  const ref = companyDoc(companyId, 'equipment', equipmentId);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const previousHourmeter = Number(before?.hourmeter ?? before?.horometroActual ?? 0);
  const nextHourmeter = Number(hourmeter || 0);
  const payload = {
    hourmeter: nextHourmeter,
    horometroActual: nextHourmeter,
    lastHourmeterUpdateAt: serverTimestamp(),
    lastHourmeterSource: 'checklist',
    lastChecklistId: checklistId,
    lastChecklistFolio: checklistFolio || '',
    lastChecklistAt: serverTimestamp(),
    lastInspectionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (status) payload.status = status;
  await updateDoc(ref, payload);
  await logUpdate(companyId, 'equipment', equipmentId, before, {
    ...payload,
    hourmeterChange: { before: previousHourmeter, after: nextHourmeter, checklistId, checklistFolio: checklistFolio || '' },
  }, user);
  if (status && before?.status !== status) {
    await logStatusChange(companyId, 'equipment', equipmentId, { status: before?.status }, { status, source: 'checklist', checklistId }, user);
  }
}

export async function updateEquipmentOperationalStatus(companyId, equipmentId, { status, source, workOrderId }, user) {
  if (!equipmentId || !status) return;
  const ref = companyDoc(companyId, 'equipment', equipmentId);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const payload = {
    status,
    lastStatusUpdateAt: serverTimestamp(),
    lastStatusSource: source || 'work_order',
    lastWorkOrderId: workOrderId || '',
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  await logStatusChange(companyId, 'equipment', equipmentId, { status: before?.status, workOrderId }, payload, user);
}

export async function recalculateMaintenancePlansForEquipment(companyId, equipmentId, hourmeter) {
  const plansQuery = query(companyCollection(companyId, 'maintenancePlans'), where('equipmentId', '==', equipmentId));
  const snapshot = await getDocs(plansQuery);
  const updates = [];
  snapshot.forEach(planSnap => {
    const plan = planSnap.data();
    const planType = String(plan.planType || plan.frequencyType || '').toLowerCase();
    const frequency = Number(plan.frequencyValue || plan.frequency || 0);
    const lastHm = Number(plan.lastWorkOrderHourmeter || plan.lastExecutionHourmeter || 0);
    const nextHourmeter = Number(plan.nextHourmeter || (lastHm && frequency ? lastHm + frequency : 0));
    const remainingHours = nextHourmeter ? nextHourmeter - Number(hourmeter || 0) : null;
    let dueStatus = plan.dueStatus || 'ok';
    if (planType.includes('horo') || planType.includes('hora') || plan.frequencyUnit === 'Horas') {
      if (remainingHours <= 0) dueStatus = 'vencido';
      else if (remainingHours <= Math.max(10, frequency * 0.1)) dueStatus = 'proximo';
      else dueStatus = 'ok';
    }
    updates.push(updateDoc(companyDoc(companyId, 'maintenancePlans', planSnap.id), {
      nextHourmeter: nextHourmeter || plan.nextHourmeter || null,
      remainingHours,
      dueStatus,
      updatedAt: serverTimestamp(),
    }));
  });
  await Promise.all(updates);
}
