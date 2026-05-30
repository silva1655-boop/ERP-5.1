import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { companyDoc, generateFolio } from './firestoreService';
import { logCreate, logUpdate } from './auditService';

export const maxPriorityFromFindings = findings => {
  if (findings.some(item => item.priority === 'alta')) return 'alta';
  if (findings.some(item => item.priority === 'media')) return 'media';
  return findings.length ? 'baja' : 'baja';
};

export async function createRequestFromChecklist(companyId, checklist, user) {
  const ref = doc(db, 'companies', companyId, 'requests', `req-${checklist.id}`);
  const priority = maxPriorityFromFindings(checklist.findings || []);
  const folio = await generateFolio(companyId, 'SOL');
  const payload = {
    folio,
    title: `Hallazgos checklist ${checklist.equipmentCode || checklist.equipmentName || ''}`.trim(),
    description: `Solicitud generada automáticamente desde checklist ${checklist.folio}.`,
    status: 'pendiente_operaciones',
    priority,
    source: 'checklist',
    sourceChecklistId: checklist.id,
    sourceChecklistFolio: checklist.folio,
    equipmentId: checklist.equipmentId,
    equipmentCode: checklist.equipmentCode,
    equipmentName: checklist.equipmentName,
    hourmeter: checklist.hourmeter,
    findings: checklist.findings || [],
    evidenceUrls: checklist.evidenceUrls || [],
    requestedBy: checklist.operatorName || user?.name || user?.email || 'Operador',
    requestedById: checklist.operatorId || user?.uid || '',
    terminal: checklist.terminal || user?.terminal || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'requests', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

export async function sendRequestToMaintenance(companyId, request, user, reviewComment = '') {
  const workOrderRef = doc(db, 'companies', companyId, 'workOrders', `ot-${request.id}`);
  const folio = await generateFolio(companyId, 'OT');
  const workOrder = {
    folio,
    type: 'correctiva',
    status: 'pendiente',
    priority: request.priority || 'media',
    equipmentId: request.equipmentId,
    equipmentCode: request.equipmentCode,
    equipmentName: request.equipmentName,
    title: `OT por ${request.folio || 'solicitud'} · ${request.equipmentCode || ''}`,
    description: request.description || 'Orden generada desde solicitud operacional.',
    findings: request.findings || [],
    evidenceUrls: request.evidenceUrls || [],
    sourceRequestId: request.id,
    sourceRequestFolio: request.folio,
    requestedBy: request.requestedBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(workOrderRef, workOrder, { merge: true });
  await updateDoc(companyDoc(companyId, 'requests', request.id), {
    status: 'enviada_mantenimiento',
    reviewComment,
    reviewedBy: user?.uid || null,
    reviewedByName: user?.name || user?.email || 'Usuario',
    workOrderId: workOrderRef.id,
    workOrderFolio: folio,
    updatedAt: serverTimestamp(),
  });
  await logCreate(companyId, 'workOrders', workOrderRef.id, workOrder, user);
  await logUpdate(companyId, 'requests', request.id, request, { status: 'enviada_mantenimiento', workOrderId: workOrderRef.id, workOrderFolio: folio }, user);
  return { id: workOrderRef.id, ...workOrder };
}

export async function reviewRequest(companyId, request, status, user, reviewComment = '') {
  const payload = {
    status,
    reviewComment,
    reviewedBy: user?.uid || null,
    reviewedByName: user?.name || user?.email || 'Usuario',
    updatedAt: serverTimestamp(),
  };
  await updateDoc(companyDoc(companyId, 'requests', request.id), payload);
  await logUpdate(companyId, 'requests', request.id, request, payload, user);
}

const displayName = user => user?.name || user?.email || 'Usuario';
const roleOf = user => user?.role || 'sin_rol';

export async function approveMaintenanceRequest(companyId, request, user, reviewComment = '') {
  const payload = {
    status: 'aprobada',
    maintenanceReviewComment: reviewComment,
    maintenanceReviewedBy: user?.uid || null,
    maintenanceReviewedByName: displayName(user),
    maintenanceReviewedByRole: roleOf(user),
    maintenanceReviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(companyDoc(companyId, 'requests', request.id), payload);
  await logUpdate(companyId, 'requests', request.id, request, payload, user);
}

export async function rejectMaintenanceRequest(companyId, request, user, rejectionReason, reviewComment = '') {
  const payload = {
    status: 'rechazada',
    rejectionReason,
    maintenanceReviewComment: reviewComment,
    maintenanceReviewedBy: user?.uid || null,
    maintenanceReviewedByName: displayName(user),
    maintenanceReviewedByRole: roleOf(user),
    maintenanceReviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(companyDoc(companyId, 'requests', request.id), payload);
  await logUpdate(companyId, 'requests', request.id, request, payload, user);
}

export async function createWorkOrderFromMaintenanceRequest(companyId, request, user) {
  const ref = doc(db, 'companies', companyId, 'workOrders', `ot-${request.id}`);
  const folio = await generateFolio(companyId, 'OT');
  const payload = {
    folio,
    type: 'correctiva',
    status: 'pendiente_planificacion',
    priority: request.priority || 'media',
    equipmentId: request.equipmentId,
    equipmentCode: request.equipmentCode,
    equipmentName: request.equipmentName,
    title: `OT ${request.systemAffected || 'hallazgo'} · ${request.equipmentCode || ''}`.trim(),
    description: request.description || request.observations || 'OT generada desde solicitud de mantenimiento.',
    source: 'maintenance_request',
    sourceFindingId: request.sourceFindingId || '',
    sourceRequestId: request.id,
    sourceRequestFolio: request.folio,
    sourceChecklistId: request.sourceChecklistId || request.sourceInspectionId || '',
    systemAffected: request.systemAffected || '',
    findings: request.findings || [],
    evidenceUrls: request.evidenceUrls || [],
    photos: request.photos || [],
    requestedBy: request.requestedBy,
    requestedById: request.requestedById,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  await updateDoc(companyDoc(companyId, 'requests', request.id), {
    status: 'convertida_ot',
    workOrderId: ref.id,
    workOrderFolio: folio,
    convertedToWorkOrderBy: user?.uid || null,
    convertedToWorkOrderByName: displayName(user),
    convertedToWorkOrderByRole: roleOf(user),
    convertedToWorkOrderAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logCreate(companyId, 'workOrders', ref.id, payload, user);
  await logUpdate(companyId, 'requests', request.id, request, { status: 'convertida_ot', workOrderId: ref.id, workOrderFolio: folio }, user);
  return { id: ref.id, ...payload };
}
