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
