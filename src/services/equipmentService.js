import { getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { companyCollection, companyDoc } from './firestoreService';
import { logStatusChange, logUpdate } from './auditService';

export async function updateEquipmentAfterChecklist(companyId, equipmentId, { hourmeter, status, checklistId }, user) {
  if (!equipmentId) return;
  const payload = {
    hourmeter,
    horometroActual: hourmeter,
    lastHourmeterUpdateAt: serverTimestamp(),
    lastHourmeterSource: 'checklist',
    lastChecklistId: checklistId,
    updatedAt: serverTimestamp(),
  };
  if (status) payload.status = status;
  await updateDoc(companyDoc(companyId, 'equipment', equipmentId), payload);
  if (status === 'fuera_servicio') {
    await logStatusChange(companyId, 'equipment', equipmentId, null, { status, source: 'checklist', checklistId }, user);
  } else {
    await logUpdate(companyId, 'equipment', equipmentId, null, payload, user);
  }
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
