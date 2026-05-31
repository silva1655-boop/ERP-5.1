import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { logCreate } from './auditService';
import { companyCollection, companyDoc } from './firestoreService';

const displayName = user => user?.name || user?.email || 'Usuario';
const statusLabels = { conditional: 'Condicional', bad: 'Malo' };
const roleOf = user => user?.role || 'sin_rol';

export function notificationRecipients(notification = {}) {
  return notification.recipientRoles || notification.recipientsRoles || notification.targetRoles || [];
}

export function notificationReadByIds(notification = {}) {
  return (notification.readBy || []).map(item => typeof item === 'string' ? item : item?.userId).filter(Boolean);
}

export function isNotificationUnreadForUser(notification, user) {
  if (!notification || !user || notification.status === 'read') return false;
  const uid = user.uid || user.id;
  const roles = notificationRecipients(notification);
  const userIsRecipient = roles.includes(user.role) || (notification.recipientUserIds || []).includes(uid) || notification.targetUserId === uid;
  return userIsRecipient && !notificationReadByIds(notification).includes(uid);
}

export async function createNotification(companyId, notificationPayload, user) {
  const ref = doc(collection(db, 'companies', companyId, 'notifications'));
  const payload = {
    status: 'unread',
    readBy: [],
    recipientRoles: notificationPayload.recipientRoles || notificationPayload.recipientsRoles || notificationPayload.targetRoles || [],
    recipientUserIds: notificationPayload.recipientUserIds || [],
    targetPage: notificationPayload.targetPage || 'dashboard',
    ...notificationPayload,
    companyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: notificationPayload.createdBy || user?.uid || '',
    createdByName: notificationPayload.createdByName || displayName(user),
  };
  payload.recipientsRoles = payload.recipientRoles;
  payload.targetRoles = payload.recipientRoles;
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'notifications', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

export async function getUnreadNotificationsForUser(companyId, user) {
  if (!companyId || !user) return [];
  const snapshot = await getDocs(query(companyCollection(companyId, 'notifications'), where('status', '==', 'unread')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(item => isNotificationUnreadForUser(item, user));
}

export async function getUnreadCountByTargetPage(companyId, user) {
  const unread = await getUnreadNotificationsForUser(companyId, user);
  return unread.reduce((acc, item) => {
    const pages = item.targetPages || [item.targetPage || 'dashboard'];
    pages.forEach(page => { acc[page] = (acc[page] || 0) + 1; });
    return acc;
  }, {});
}

export async function markNotificationAsRead(companyId, notificationId, user) {
  const readEntry = { userId: user?.uid || user?.id || '', userName: displayName(user), role: roleOf(user), readAt: new Date().toISOString() };
  await updateDoc(companyDoc(companyId, 'notifications', notificationId), {
    readBy: arrayUnion(readEntry),
    updatedAt: serverTimestamp(),
  });
}

export async function markNotificationsForEntityAsRead(companyId, entityType, entityId, user) {
  const snapshot = await getDocs(query(companyCollection(companyId, 'notifications'), where(`${entityType}Id`, '==', entityId)));
  await Promise.all(snapshot.docs.map(item => markNotificationAsRead(companyId, item.id, user)));
}

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
    message: `Checklist ${checklist.folio} con ${failedItems.length} hallazgo(s) para revisión de operaciones.`,
    audience: 'operaciones_supervisor',
    recipientRoles: ['operaciones', 'supervisor', 'admin_empresa', 'superadmin'],
    targetPage: 'requests',
    priority: checklist.maxPriority || 'media',
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
  };
}

export async function createChecklistFindingNotification(companyId, checklist, user) {
  if (!checklist?.findings?.length) return null;
  return createNotification(companyId, buildChecklistNotificationPayload({ ...checklist, companyId }, user), user);
}

export async function createFindingDerivedNotification(companyId, finding, request, user) {
  return createNotification(companyId, {
    type: 'finding_derived_to_maintenance',
    title: 'Hallazgo derivado a mantenimiento',
    message: `El hallazgo ${finding.itemName || finding.systemAffected || ''} del equipo ${finding.equipmentCode || ''} fue derivado a mantenimiento.`,
    recipientRoles: ['supervisor', 'admin_empresa', 'superadmin'],
    targetPage: 'requests',
    priority: request.priority || finding.priority || 'media',
    findingId: finding.id,
    requestId: request.id,
    requestFolio: request.folio || '',
    equipmentId: finding.equipmentId || '',
    equipmentCode: finding.equipmentCode || '',
    equipmentName: finding.equipmentName || '',
    data: { operationalComment: request.operationalComment || '', recommendation: request.recommendation || '' },
  }, user);
}

export async function createRequestConvertedToWorkOrderNotification(companyId, request, workOrder, user) {
  return createNotification(companyId, {
    type: 'request_converted_to_work_order',
    title: 'Solicitud convertida en OT',
    message: `La solicitud ${request.folio || request.id || ''} fue convertida en la OT ${workOrder.folio || workOrder.id || ''}.`,
    recipientRoles: ['supervisor', 'operaciones', 'admin_empresa', 'superadmin'],
    targetPage: 'workOrders',
    priority: workOrder.priority || request.priority || 'media',
    requestId: request.id,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    findingId: workOrder.sourceFindingId || request.sourceFindingId || '',
    data: { sourceRequestFolio: request.folio || '', systemAffected: request.systemAffected || '' },
  }, user);
}

export async function createWorkOrderAssignmentNotification(companyId, workOrder, user) {
  if (!workOrder?.assignedToId) return null;
  return createNotification(companyId, {
    type: 'work_order_assignment',
    title: `OT asignada ${workOrder.folio || ''}`.trim(),
    message: `Se programó la OT ${workOrder.folio || workOrder.id || ''} para ${workOrder.equipmentCode || workOrder.equipmentName || 'equipo'}.`,
    audience: 'mecanico_asignado',
    recipientRoles: ['mecanico'],
    recipientUserIds: [workOrder.assignedToId],
    targetPage: 'myWorkOrders',
    targetUserId: workOrder.assignedToId,
    targetUserName: workOrder.assignedToName || '',
    targetUserEmail: workOrder.assignedToEmail || '',
    priority: workOrder.priority || 'media',
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    dueDate: workOrder.dueDate || '',
  }, user);
}

const lifecycleMessages = {
  work_order_started: {
    title: 'OT iniciada por mecánico',
    recipientRoles: ['supervisor', 'operaciones', 'admin_empresa'],
    targetPage: 'workOrders',
    audience: 'supervisor_operaciones',
  },
  work_order_paused: {
    title: 'OT pausada por mecánico',
    recipientRoles: ['supervisor', 'admin_empresa'],
    targetPage: 'workOrders',
    audience: 'supervisor_mantenimiento',
  },
};

export async function createWorkOrderLifecycleNotification(companyId, workOrder, user, type) {
  const config = lifecycleMessages[type];
  if (!config) return null;
  return createNotification(companyId, {
    type,
    title: config.title,
    message: `${config.title}: ${workOrder.folio || workOrder.id || ''} · ${workOrder.equipmentCode || workOrder.equipmentName || 'Equipo'}`,
    audience: config.audience,
    recipientRoles: config.recipientRoles,
    targetPage: config.targetPage,
    priority: workOrder.priority || 'media',
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    mechanicId: user?.uid || '',
    mechanicName: displayName(user),
    data: {
      status: workOrder.status,
      pauseReason: workOrder.pauseReason || '',
      pauseComment: workOrder.pauseComment || '',
      startedAt: workOrder.startedAt || null,
      pausedAt: workOrder.pausedAt || null,
    },
  }, user);
}

function finishedNotificationData(workOrder) {
  return {
    diagnosis: workOrder.mechanicDiagnosis || '',
    workPerformed: workOrder.workPerformed || '',
    laborHours: Number(workOrder.laborHours || 0),
    usedParts: workOrder.usedParts || '',
    finalEquipmentStatus: workOrder.finalEquipmentStatus || '',
    mechanicFinalComments: workOrder.mechanicFinalComments || '',
    futureRecommendation: workOrder.futureRecommendation || '',
    evidenceUrls: workOrder.evidenceUrls || [],
    finishedAt: workOrder.finishedAt || null,
    requestId: workOrder.sourceRequestId || workOrder.requestId || '',
    findingId: workOrder.sourceFindingId || workOrder.findingId || '',
    sourceChecklistId: workOrder.sourceChecklistId || '',
    systemAffected: workOrder.systemAffected || '',
  };
}

export async function createWorkOrderFinishedNotification(companyId, workOrder, user) {
  const base = {
    type: 'work_order_finished',
    title: 'OT finalizada por mecánico',
    message: `El mecánico finalizó la OT ${workOrder.folio || workOrder.id || ''} del equipo ${workOrder.equipmentCode || workOrder.equipmentName || 'equipo'}.`,
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    mechanicId: user?.uid || '',
    mechanicName: displayName(user),
    mechanicEmail: user?.email || '',
    priority: workOrder.priority || 'media',
    data: finishedNotificationData(workOrder),
  };
  const operationsNotification = await createNotification(companyId, { ...base, recipientRoles: ['operaciones', 'admin_empresa'], targetPage: 'requests' }, user);
  const supervisorNotification = await createNotification(companyId, { ...base, recipientRoles: ['supervisor', 'admin_empresa'], targetPage: 'workOrders' }, user);
  return [operationsNotification, supervisorNotification];
}

export async function createWorkOrderClosedNotification(companyId, workOrder, user) {
  const base = {
    type: 'work_order_closed',
    title: 'OT cerrada técnicamente',
    message: `La OT ${workOrder.folio || workOrder.id || ''} fue cerrada técnicamente por supervisor.`,
    priority: workOrder.priority || 'media',
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    mechanicId: workOrder.assignedToId || workOrder.assignedTo || '',
    mechanicName: workOrder.assignedToName || '',
    data: { closingComment: workOrder.closingComment || '', closedAt: workOrder.closedAt || null, ...finishedNotificationData(workOrder) },
  };
  const ops = await createNotification(companyId, { ...base, recipientRoles: ['operaciones', 'admin_empresa'], targetPage: 'requests' }, user);
  const mechanic = workOrder.assignedToId ? await createNotification(companyId, { ...base, recipientRoles: ['mecanico'], recipientUserIds: [workOrder.assignedToId], targetUserId: workOrder.assignedToId, targetPage: 'workHistory' }, user) : null;
  return [ops, mechanic].filter(Boolean);
}

export async function createWorkOrderReopenNotification(companyId, workOrder, user) {
  if (!workOrder?.assignedToId) return null;
  return createNotification(companyId, {
    type: 'work_order_reopened',
    title: 'OT reabierta por supervisor',
    message: `La OT ${workOrder.folio || workOrder.id || ''} fue reabierta para completar trabajos.`,
    audience: 'mecanico_asignado',
    recipientRoles: ['mecanico'],
    recipientUserIds: [workOrder.assignedToId],
    targetPage: 'myWorkOrders',
    targetUserId: workOrder.assignedToId,
    targetUserName: workOrder.assignedToName || '',
    targetUserEmail: workOrder.assignedToEmail || '',
    priority: workOrder.priority || 'media',
    workOrderId: workOrder.id,
    workOrderFolio: workOrder.folio || '',
    equipmentId: workOrder.equipmentId || '',
    equipmentCode: workOrder.equipmentCode || '',
    equipmentName: workOrder.equipmentName || '',
    data: { reopenComment: workOrder.reopenComment || '', reopenStatus: workOrder.status || 'programada' },
  }, user);
}
