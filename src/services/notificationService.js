import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logCreate } from './auditService';

const displayName = user => user?.name || user?.email || 'Usuario';
const statusLabels = { conditional: 'Condicional', bad: 'Malo' };

export function buildChecklistNotificationPayload(checklist, user) {
  const failedItems = (checklist.findings || []).map(item => ({
    itemId: item.itemId,
    section: item.section,
    name: item.name,
    status: item.status,
    statusLabel: statusLabels[item.status] || item.status,
    priority: item.priority,
    observation: item.observation || '',
    photoUrl: item.photoUrl || item.evidence?.url || '',
    evidence: item.evidence || null,
  }));

  return {
    type: 'checklist_finding',
    title: `Hallazgos en inspección ${checklist.checklistTypeLabel || checklist.checklistType || ''}`.trim(),
    message: `Checklist ${checklist.folio} con ${failedItems.length} hallazgo(s) para revisión de supervisor de operaciones.`,
    audience: 'supervisor_operaciones',
    targetRoles: ['supervisor', 'operaciones', 'admin_empresa', 'superadmin'],
    status: 'unread',
    priority: checklist.maxPriority || 'media',
    companyId: checklist.companyId || '',
    checklistId: checklist.id,
    checklistFolio: checklist.folio,
    checklistResult: checklist.result,
    isCritical: checklist.isCritical || failedItems.some(item => item.status === 'bad'),
    equipmentType: checklist.checklistTypeLabel || checklist.checklistType || '',
    equipmentId: checklist.equipmentId || '',
    equipmentCode: checklist.equipmentCode || '',
    equipmentName: checklist.equipmentName || '',
    operatorId: checklist.operatorId || user?.uid || '',
    operatorName: checklist.operatorName || displayName(user),
    terminal: checklist.terminal || user?.terminal || '',
    inspectionDate: checklist.createdAt || serverTimestamp(),
    failedItems,
    photos: failedItems.map(item => item.photoUrl).filter(Boolean),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
}

export async function createChecklistFindingNotification(companyId, checklist, user) {
  if (!checklist?.findings?.length) return null;
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = buildChecklistNotificationPayload({ ...checklist, companyId }, user);
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}


export async function createWorkOrderAssignmentNotification(companyId, workOrder, user) {
  if (!workOrder?.assignedToId) return null;
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = {
    type: 'work_order_assignment',
    title: `OT asignada ${workOrder.folio || ''}`.trim(),
    message: `Se programó la OT ${workOrder.folio || workOrder.id || ''} para ${workOrder.equipmentCode || workOrder.equipmentName || 'equipo'}.`,
    audience: 'mecanico_asignado',
    targetRoles: ['mecanico'],
    targetUserId: workOrder.assignedToId,
    targetUserName: workOrder.assignedToName || '',
    targetUserEmail: workOrder.assignedToEmail || '',
    status: 'unread',
    priority: workOrder.priority || 'media',
    companyId,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    dueDate: workOrder.dueDate || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

const lifecycleMessages = {
  work_order_started: {
    title: 'OT iniciada por mecánico',
    recipientsRoles: ['supervisor', 'operaciones', 'admin_empresa'],
    audience: 'supervisor_operaciones',
  },
  work_order_paused: {
    title: 'OT pausada por mecánico',
    recipientsRoles: ['supervisor', 'admin_empresa'],
    audience: 'supervisor_mantenimiento',
  },
};

export async function createWorkOrderLifecycleNotification(companyId, workOrder, user, type) {
  const config = lifecycleMessages[type];
  if (!config) return null;
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = {
    type,
    title: config.title,
    message: `${config.title}: ${workOrder.folio || workOrder.id || ''} · ${workOrder.equipmentCode || workOrder.equipmentName || 'Equipo'}`,
    audience: config.audience,
    recipientsRoles: config.recipientsRoles,
    targetRoles: config.recipientsRoles,
    status: 'unread',
    priority: workOrder.priority || 'media',
    companyId,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    mechanicId: user?.uid || '',
    mechanicName: displayName(user),
    data: {
      status: workOrder.status,
      pauseReason: workOrder.pauseReason || '',
      pauseComment: workOrder.pauseComment || '',
      startedAt: workOrder.startedAt || null,
      pausedAt: workOrder.pausedAt || null,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

export async function createWorkOrderFinishedNotification(companyId, workOrder, user) {
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = {
    type: 'work_order_finished',
    title: 'OT finalizada por mecánico',
    message: `La OT ${workOrder.folio || workOrder.id || ''} fue finalizada por ${displayName(user)} y espera cierre técnico.`,
    companyId,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    mechanicId: user?.uid || '',
    mechanicName: displayName(user),
    status: 'unread',
    recipientsRoles: ['supervisor', 'operaciones', 'admin_empresa'],
    targetRoles: ['supervisor', 'operaciones', 'admin_empresa'],
    priority: workOrder.priority || 'media',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
    data: {
      diagnosis: workOrder.mechanicDiagnosis || '',
      workPerformed: workOrder.workPerformed || '',
      laborHours: Number(workOrder.laborHours || 0),
      finalEquipmentStatus: workOrder.finalEquipmentStatus || '',
      usedParts: workOrder.usedParts || '',
      futureRecommendation: workOrder.futureRecommendation || '',
      finishedAt: workOrder.finishedAt || null,
    },
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

export async function createWorkOrderReopenNotification(companyId, workOrder, user) {
  if (!workOrder?.assignedToId) return null;
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = {
    type: 'work_order_reopened',
    title: 'OT reabierta por supervisor',
    message: `La OT ${workOrder.folio || workOrder.id || ''} fue reabierta para completar trabajos.`,
    audience: 'mecanico_asignado',
    targetRoles: ['mecanico'],
    targetUserId: workOrder.assignedToId,
    targetUserName: workOrder.assignedToName || '',
    targetUserEmail: workOrder.assignedToEmail || '',
    status: 'unread',
    priority: workOrder.priority || 'media',
    companyId,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    data: { reopenComment: workOrder.reopenComment || '', reopenStatus: workOrder.status || 'programada' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}
