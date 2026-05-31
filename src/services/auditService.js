import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

async function writeAudit(companyId, payload) {
  if (!companyId) return null;
  return addDoc(collection(db, 'companies', companyId, 'auditLogs'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export const logCreate = (companyId, entityType, entityId, after, user) => writeAudit(companyId, {
  action: 'create', entityType, entityId, userId: user?.uid || user?.id || null, userName: user?.name || user?.email || 'Sistema', userRole: user?.role || 'sin_rol', before: null, after,
});
export const logUpdate = (companyId, entityType, entityId, before, after, user) => writeAudit(companyId, {
  action: 'update', entityType, entityId, userId: user?.uid || user?.id || null, userName: user?.name || user?.email || 'Sistema', userRole: user?.role || 'sin_rol', before, after,
});
export const logDelete = (companyId, entityType, entityId, before, user) => writeAudit(companyId, {
  action: 'delete', entityType, entityId, userId: user?.uid || user?.id || null, userName: user?.name || user?.email || 'Sistema', userRole: user?.role || 'sin_rol', before, after: null,
});
export const logStatusChange = (companyId, entityType, entityId, before, after, user) => writeAudit(companyId, {
  action: 'status_change', entityType, entityId, userId: user?.uid || user?.id || null, userName: user?.name || user?.email || 'Sistema', userRole: user?.role || 'sin_rol', before, after,
});
