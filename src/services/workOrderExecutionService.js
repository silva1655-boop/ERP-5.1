import { serverTimestamp } from 'firebase/firestore';
import { updateDocument } from './firestoreService';
import { updateEquipmentOperationalStatus } from './equipmentService';
import { uploadEvidence } from './storageService';
import {
  createWorkOrderFinishedNotification,
  createWorkOrderLifecycleNotification,
  createWorkOrderReopenNotification,
} from './notificationService';

const displayName = user => user?.name || user?.email || 'Usuario';

export function isWorkOrderAssignedToUser(workOrder, user) {
  if (!workOrder || !user) return false;
  const uid = user.uid || user.id;
  const email = user.email || '';
  if (workOrder.assignedToId) return workOrder.assignedToId === uid;
  return workOrder.assignedTo === uid || (!!email && workOrder.assignedToEmail === email);
}

export async function startWorkOrder(companyId, workOrder, user) {
  const payload = {
    status: 'en_curso',
    startedAt: serverTimestamp(),
    startedBy: user?.uid || '',
    startedByName: displayName(user),
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  await createWorkOrderLifecycleNotification(companyId, { ...workOrder, ...payload }, user, 'work_order_started');
  return payload;
}

export async function pauseWorkOrder(companyId, workOrder, form, user) {
  const payload = {
    status: 'pausada',
    pauseReason: form.reason,
    pauseComment: form.comment,
    pausedAt: serverTimestamp(),
    pausedBy: user?.uid || '',
    pausedByName: displayName(user),
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  await createWorkOrderLifecycleNotification(companyId, { ...workOrder, ...payload }, user, 'work_order_paused');
  return payload;
}

export async function resumeWorkOrder(companyId, workOrder, user) {
  const payload = {
    status: 'en_curso',
    resumedAt: serverTimestamp(),
    resumedBy: user?.uid || '',
    resumedByName: displayName(user),
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  return payload;
}

export async function finishWorkOrder(companyId, workOrder, form, user) {
  let evidence = null;
  if (form.evidenceFile) evidence = await uploadEvidence(form.evidenceFile, companyId, 'workOrders', workOrder.id);
  const evidenceUrls = evidence ? [...(workOrder.evidenceUrls || []), evidence] : (workOrder.evidenceUrls || []);
  const payload = {
    status: 'finalizada_mecanico',
    mechanicDiagnosis: form.mechanicDiagnosis,
    workPerformed: form.workPerformed,
    laborHours: Number(form.laborHours || 0),
    usedParts: form.usedParts || '',
    partsUsed: form.usedParts || workOrder.partsUsed || [],
    finalEquipmentStatus: form.finalEquipmentStatus,
    mechanicFinalComments: form.mechanicFinalComments,
    futureRecommendation: form.futureRecommendation || '',
    evidenceUrls,
    finishedAt: serverTimestamp(),
    finishedBy: user?.uid || '',
    finishedByName: displayName(user),
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  if (workOrder.equipmentId && form.finalEquipmentStatus) {
    await updateEquipmentOperationalStatus(companyId, workOrder.equipmentId, {
      status: form.finalEquipmentStatus,
      source: 'work_order_finished',
      workOrderId: workOrder.id,
    }, user);
  }
  await createWorkOrderFinishedNotification(companyId, { ...workOrder, ...payload }, user);
  return payload;
}

export async function closeWorkOrderTechnically(companyId, workOrder, comment, user) {
  const payload = {
    status: 'cerrada_supervisor',
    closedAt: serverTimestamp(),
    closedBy: user?.uid || '',
    closedByName: displayName(user),
    closingComment: comment,
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  return payload;
}

export async function reopenWorkOrder(companyId, workOrder, form, user) {
  const payload = {
    status: form.status || 'programada',
    reopenComment: form.comment,
    reopenedAt: serverTimestamp(),
    reopenedBy: user?.uid || '',
    reopenedByName: displayName(user),
  };
  await updateDocument(companyId, 'workOrders', workOrder.id, payload, user);
  await createWorkOrderReopenNotification(companyId, { ...workOrder, ...payload }, user);
  return payload;
}
