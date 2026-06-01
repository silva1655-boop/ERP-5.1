import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { uploadEvidence } from './storageService';
import { companyDoc, generateFolio } from './firestoreService';
import { logCreate, logStatusChange, logUpdate } from './auditService';
import { maxPriorityFromFindings } from './requestService';
import { createFindingDerivedNotification } from './notificationService';

const displayName = user => user?.name || user?.email || 'Usuario';
const roleOf = user => user?.role || 'sin_rol';
const statusLabels = { conditional: 'Condicional', bad: 'Malo' };

export const FINDING_STATUS = {
  pendingOperations: 'pendiente_revision_operaciones',
  rejected: 'rechazado',
  sentToMaintenance: 'derivado_mantenimiento',
  convertedToRequest: 'convertido_en_solicitud',
};

function findingPayloadFromChecklistFinding(checklist, finding, user) {
  return {
    companyId: checklist.companyId || '',
    source: 'checklist',
    sourceInspectionId: checklist.id,
    sourceChecklistId: checklist.id,
    sourceChecklistFolio: checklist.folio,
    equipmentId: checklist.equipmentId,
    equipmentCode: checklist.equipmentCode,
    equipmentName: checklist.equipmentName,
    equipmentType: checklist.equipmentType || checklist.type || '',
    operatorId: checklist.operatorId || user?.uid || '',
    operatorName: checklist.operatorName || displayName(user),
    terminal: checklist.terminal || user?.terminal || '',
    detectedAt: checklist.createdAt || serverTimestamp(),
    systemAffected: finding.section,
    itemId: finding.itemId,
    itemName: finding.name,
    detectedStatus: finding.status,
    detectedStatusLabel: statusLabels[finding.status] || finding.status,
    observation: finding.observation || '',
    photos: [finding.photoUrl || finding.evidence?.url].filter(Boolean),
    evidenceUrls: finding.evidence ? [finding.evidence] : [],
    suggestedPriority: finding.priority || 'media',
    priority: finding.priority || 'media',
    recommendation: finding.recommendation || '',
    maintenanceRequired: Boolean(finding.maintenanceRequired),
    status: FINDING_STATUS.pendingOperations,
    statusHistory: [{
      status: FINDING_STATUS.pendingOperations,
      action: 'create_from_checklist',
      userId: user?.uid || null,
      userName: displayName(user),
      userRole: roleOf(user),
      createdAt: new Date().toISOString(),
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
}

export async function createFindingsFromChecklist(companyId, checklist, user) {
  const created = [];
  for (const finding of checklist.findings || []) {
    const ref = doc(collection(db, 'companies', companyId, 'findings'));
    const payload = findingPayloadFromChecklistFinding({ ...checklist, companyId }, finding, user);
    await setDoc(ref, payload, { merge: true });
    await logCreate(companyId, 'findings', ref.id, payload, user);
    created.push({ id: ref.id, ...payload });
  }
  return created;
}


export async function createManualFindingReport(companyId, form, user) {
  const equipment = form.equipment || {};
  const ref = doc(collection(db, 'companies', companyId, 'findings'));
  let evidence = null;
  if (form.photoFile) {
    evidence = await uploadEvidence(form.photoFile, companyId, 'findings', ref.id);
  }
  const payload = {
    companyId,
    source: 'manual_operator_report',
    equipmentId: equipment.id || form.equipmentId,
    equipmentCode: equipment.code || equipment.id || form.equipmentId,
    equipmentName: equipment.name || equipment.type || equipment.code || '',
    equipmentType: equipment.type || equipment.equipmentType || '',
    operatorId: user?.uid || '',
    operatorName: displayName(user),
    terminal: user?.terminal || equipment.terminal || '',
    detectedAt: serverTimestamp(),
    systemAffected: form.systemAffected,
    itemId: 'manual-report',
    itemName: form.systemAffected,
    detectedStatus: 'manual_report',
    detectedStatusLabel: 'Reportado por operador',
    observation: form.description || '',
    photos: evidence?.url ? [evidence.url] : [],
    evidenceUrls: evidence ? [evidence] : [],
    suggestedPriority: form.priority || 'media',
    priority: form.priority || 'media',
    recommendation: '',
    maintenanceRequired: true,
    status: FINDING_STATUS.pendingOperations,
    statusHistory: [{
      status: FINDING_STATUS.pendingOperations,
      action: 'manual_operator_report',
      userId: user?.uid || null,
      userName: displayName(user),
      userRole: roleOf(user),
      createdAt: new Date().toISOString(),
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };
  await setDoc(ref, payload, { merge: true });
  await logCreate(companyId, 'findings', ref.id, payload, user);
  return { id: ref.id, ...payload };
}

export async function rejectFinding(companyId, finding, { reason, comment }, user) {
  const payload = {
    status: FINDING_STATUS.rejected,
    rejectionReason: reason,
    rejectionComment: comment,
    rejectedBy: user?.uid || null,
    rejectedByName: displayName(user),
    rejectedByRole: roleOf(user),
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await updateDoc(companyDoc(companyId, 'findings', finding.id), payload);
  await logStatusChange(companyId, 'findings', finding.id, { status: finding.status, finding }, payload, user);
}

export async function createMaintenanceRequestFromFinding(companyId, finding, { priority, operationalComment, recommendation }, user) {
  const ref = doc(db, 'companies', companyId, 'requests', `req-${finding.id}`);
  const folio = await generateFolio(companyId, 'SOL');
  const request = {
    folio,
    title: `${finding.systemAffected || 'Hallazgo'} · ${finding.equipmentCode || finding.equipmentName || ''}`.trim(),
    description: finding.observation || 'Solicitud generada desde hallazgo individual de inspección.',
    status: 'pendiente_revision_mantenimiento',
    priority: priority || finding.priority || finding.suggestedPriority || 'media',
    source: 'finding',
    findingId: finding.id,
    sourceFindingId: finding.id,
    checklistId: finding.sourceChecklistId || finding.sourceInspectionId || '',
    sourceInspectionId: finding.sourceInspectionId || finding.sourceChecklistId,
    sourceChecklistId: finding.sourceChecklistId,
    sourceChecklistFolio: finding.sourceChecklistFolio,
    equipmentId: finding.equipmentId,
    equipmentCode: finding.equipmentCode,
    equipmentName: finding.equipmentName,
    equipmentType: finding.equipmentType || '',
    system: finding.systemAffected,
    systemAffected: finding.systemAffected,
    detectedStatus: finding.detectedStatus,
    detectedStatusLabel: finding.detectedStatusLabel,
    itemLabel: finding.itemName || finding.systemAffected || '',
    operatorObservation: finding.observation || '',
    observations: finding.observation || '',
    operationalComment: operationalComment || '',
    recommendation: recommendation || finding.recommendation || '',
    findings: [{
      findingId: finding.id,
      itemId: finding.itemId,
      section: finding.systemAffected,
      name: finding.itemName,
      status: finding.detectedStatus,
      priority: priority || finding.priority || finding.suggestedPriority || 'media',
      observation: finding.observation || '',
      photoUrl: finding.photos?.[0] || '',
      recommendation: recommendation || finding.recommendation || '',
    }],
    evidenceUrls: finding.evidenceUrls || [],
    photos: finding.photos || [],
    requestedBy: finding.operatorName,
    requestedById: finding.operatorId,
    detectedAt: finding.detectedAt || null,
    createdBy: user?.uid || '',
    createdByName: displayName(user),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, request, { merge: true });
  await updateDoc(companyDoc(companyId, 'findings', finding.id), {
    status: FINDING_STATUS.sentToMaintenance,
    maintenanceRequestId: ref.id,
    maintenanceRequestFolio: folio,
    operationalComment: operationalComment || '',
    recommendation: recommendation || finding.recommendation || '',
    convertedBy: user?.uid || null,
    convertedByName: displayName(user),
    convertedByRole: roleOf(user),
    convertedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logCreate(companyId, 'requests', ref.id, request, user);
  await logStatusChange(companyId, 'findings', finding.id, { status: finding.status, finding }, { status: FINDING_STATUS.sentToMaintenance, maintenanceRequestId: ref.id, maintenanceRequestFolio: folio }, user);
  await createFindingDerivedNotification(companyId, finding, { id: ref.id, ...request }, user);
  return { id: ref.id, ...request };
}

export function priorityFromSingleFinding(finding) {
  return maxPriorityFromFindings([{ priority: finding.priority || finding.suggestedPriority || 'media' }]);
}
