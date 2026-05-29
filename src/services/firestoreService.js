import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { currentYear } from '../utils/dates';
import { cleanPayload } from '../utils/formatters';
import { logCreate, logDelete, logStatusChange, logUpdate } from './auditService';

export const companyCollection = (companyId, name) => collection(db, 'companies', companyId, name);
export const companyDoc = (companyId, name, id) => doc(db, 'companies', companyId, name, id);

export function subscribeCollection(companyId, name, callback, options = {}) {
  if (!companyId) return () => {};
  const clauses = [];
  if (options.where) options.where.forEach(([field, operator, value]) => clauses.push(where(field, operator, value)));
  if (options.orderBy) clauses.push(orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
  if (options.limit) clauses.push(limit(options.limit));
  return onSnapshot(query(companyCollection(companyId, name), ...clauses), snapshot => {
    callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  });
}

export async function listDocuments(companyId, name) {
  const snapshot = await getDocs(companyCollection(companyId, name));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function createDocument(companyId, name, payload, user, id) {
  const body = cleanPayload({ ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  const ref = id ? companyDoc(companyId, name, id) : doc(companyCollection(companyId, name));
  await setDoc(ref, body, { merge: true });
  await logCreate(companyId, name, ref.id, body, user);
  return ref.id;
}

export async function updateDocument(companyId, name, id, payload, user) {
  const ref = companyDoc(companyId, name, id);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const after = cleanPayload({ ...payload, updatedAt: serverTimestamp() });
  await updateDoc(ref, after);
  if (before?.status !== undefined && payload.status && before.status !== payload.status) {
    await logStatusChange(companyId, name, id, before, after, user);
  } else {
    await logUpdate(companyId, name, id, before, after, user);
  }
}

export async function deleteDocument(companyId, name, id, user) {
  const ref = companyDoc(companyId, name, id);
  const beforeSnap = await getDoc(ref);
  await deleteDoc(ref);
  await logDelete(companyId, name, id, beforeSnap.exists() ? beforeSnap.data() : null, user);
}

export async function getCompanySettings(companyId) {
  const snap = await getDoc(doc(db, 'companies', companyId, 'settings', 'general'));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveCompanySettings(companyId, payload, user) {
  return createDocument(companyId, 'settings', payload, user, 'general');
}

export async function generateFolio(companyId, prefix) {
  const year = currentYear();
  const counterName = `${prefix}-${year}`;
  const ref = doc(db, 'companies', companyId, 'counters', counterName);
  return runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    const next = (snap.exists() ? snap.data().value : 0) + 1;
    transaction.set(ref, { value: next, year, prefix, updatedAt: serverTimestamp() }, { merge: true });
    return `${prefix}-${year}-${String(next).padStart(6, '0')}`;
  });
}
