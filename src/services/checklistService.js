import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { generateFolio } from './firestoreService';
import { uploadEvidence } from './storageService';
import { logCreate } from './auditService';
import { updateEquipmentAfterChecklist, recalculateMaintenancePlansForEquipment } from './equipmentService';
import { maxPriorityFromFindings } from './requestService';
import { createChecklistFindingNotification } from './notificationService';
import { createFindingsFromChecklist } from './findingService';

const displayName = user => user?.name || user?.email || 'Usuario';

export function buildChecklistFindings(template, answers) {
  return template.items
    .map(item => ({ item, answer: answers[item.id] || {} }))
    .filter(({ answer }) => ['conditional', 'bad'].includes(answer.status))
    .map(({ item, answer }) => ({
      itemId: item.id,
      section: item.section,
      name: item.name,
      status: answer.status,
      priority: answer.priority || (answer.status === 'bad' ? 'alta' : 'media'),
      observation: answer.observation || '',
      photoUrl: answer.photoMeta?.url || '',
      evidence: answer.photoMeta || null,
      recommendation: answer.recommendation || (answer.status === 'bad' ? 'Detener y derivar a mantenimiento.' : 'Programar revisión.'),
      maintenanceRequired: answer.status === 'bad' || answer.priority === 'alta',
    }));
}

export function getEquipmentStatusAfterChecklist(findings) {
  if (!findings.length) return 'operativo';
  if (findings.some(item => item.priority === 'alta')) return 'fuera_servicio';
  return 'observado';
}

export async function savePreoperationalChecklist({ companyId, template, form, answers, equipment, user }) {
  const ref = doc(collection(db, 'companies', companyId, 'checklists'));
  const folio = await generateFolio(companyId, 'CHK');

  const uploadedAnswers = { ...answers };
  const evidenceUrls = [];
  for (const item of template.items) {
    const answer = uploadedAnswers[item.id] || {};
    if (answer.photoFile) {
      const meta = await uploadEvidence(answer.photoFile, companyId, 'checklists', ref.id);
      const withItem = { ...meta, relatedItemId: item.id };
      evidenceUrls.push(withItem);
      uploadedAnswers[item.id] = { ...answer, photoMeta: withItem, photoFile: undefined };
    }
  }

  const findings = buildChecklistFindings(template, uploadedAnswers);
  const maxPriority = maxPriorityFromFindings(findings);
  const hasBadFinding = findings.some(item => item.status === 'bad');
  const nextEquipmentStatus = getEquipmentStatusAfterChecklist(findings);
  const payload = {
    folio,
    checklistType: template.id,
    checklistTypeLabel: template.label,
    equipmentId: equipment.id,
    equipmentCode: equipment.code || equipment.id,
    equipmentName: equipment.name || equipment.type || equipment.id,
    equipmentType: equipment.type || equipment.equipmentType || '',
    operatorId: user?.uid || '',
    operatorName: displayName(user),
    terminal: form.terminal || user?.terminal || equipment.terminal || '',
    fuelLevel: form.fuelLevel || '',
    hourmeter: Number(form.hourmeter),
    shift: form.shift || '',
    vesselOrTask: form.vesselOrTask || '',
    status: findings.length ? 'pendiente_revision' : 'completado',
    result: hasBadFinding ? 'critica' : findings.length ? 'con_hallazgos' : 'sin_hallazgos',
    hasFindings: findings.length > 0,
    hasDeviation: findings.length > 0,
    isCritical: hasBadFinding,
    requiresImmediateReview: hasBadFinding,
    maxPriority: findings.length ? maxPriority : 'baja',
    equipmentStatusAfterChecklist: nextEquipmentStatus,
    answers: uploadedAnswers,
    findingCount: findings.length,
    evidenceUrls,
    observations: form.observations || '',
    source: 'preoperacional',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || '',
    createdByName: displayName(user),
  };

  await setDoc(ref, payload, { merge: true });
  await updateEquipmentAfterChecklist(companyId, equipment.id, { hourmeter: Number(form.hourmeter), status: nextEquipmentStatus, checklistId: ref.id }, user);
  await recalculateMaintenancePlansForEquipment(companyId, equipment.id, Number(form.hourmeter));
  await logCreate(companyId, 'checklists', ref.id, payload, user);

  let createdFindings = [];
  let notification = null;
  if (findings.length) {
    const checklistForFindings = { id: ref.id, ...payload, findings };
    createdFindings = await createFindingsFromChecklist(companyId, checklistForFindings, user);
    notification = await createChecklistFindingNotification(companyId, checklistForFindings, user);
  }
  return { checklist: { id: ref.id, ...payload }, findings: createdFindings, notification };
}
