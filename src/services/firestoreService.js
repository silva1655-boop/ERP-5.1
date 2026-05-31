import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { currentYear } from '../utils/dates';
import { cleanPayload } from '../utils/formatters';
import { logCreate, logDelete, logStatusChange, logUpdate } from './auditService';

export const LEGACY_COMPANY_ID = 'mantek_v2';
const LEGACY_COLLECTION_MAP = {
  equipment: 'equipment',
  maintenancePlans: 'plans',
  workOrders: 'workOrders',
  requests: 'requests',
  checklists: 'checklists',
  users: 'users',
  findings: 'findings',
  notifications: 'notifications',
};

const isLegacyCompany = companyId => companyId === LEGACY_COMPANY_ID || companyId === 'legacy';
const legacyDocName = name => LEGACY_COLLECTION_MAP[name] || name;
const legacyRef = name => doc(db, LEGACY_COMPANY_ID, legacyDocName(name));
const rowId = row => row?.id || row?.uid || row?.code || row?.folio || crypto.randomUUID?.() || Math.random().toString(36).slice(2);

function normalizeLegacyRows(name, rows = []) {
  return rows.map(row => {
    const id = rowId(row);
    if (name === 'equipment') return { id, ...row, code: row.code || row.id || id, hourmeter: row.hourmeter ?? row.horometro ?? row.horometroActual ?? 0 };
    if (name === 'workOrders') return { id, ...row, equipmentId: row.equipmentId || row.equipId || '', equipmentCode: row.equipmentCode || row.equipCode || '' };
    if (name === 'maintenancePlans') return { id, ...row, equipmentId: row.equipmentId || row.equipId || '' };
    return { id, ...row };
  });
}

function applyClientOptions(rows, options = {}) {
  let result = [...rows];
  if (options.where) {
    for (const [field, operator, value] of options.where) {
      result = result.filter(row => {
        if (operator === '==') return row[field] === value;
        if (operator === '!=') return row[field] !== value;
        if (operator === 'in') return Array.isArray(value) && value.includes(row[field]);
        return true;
      });
    }
  }
  if (options.orderBy) {
    const { field, direction = 'asc' } = options.orderBy;
    result.sort((a, b) => {
      const av = a[field]?.seconds ? a[field].seconds : a[field] || '';
      const bv = b[field]?.seconds ? b[field].seconds : b[field] || '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
    });
  }
  if (options.limit) result = result.slice(0, options.limit);
  return result;
}

async function readLegacyRows(name) {
  const snap = await getDoc(legacyRef(name));
  return normalizeLegacyRows(name, snap.exists() ? snap.data()?.data || [] : []);
}

async function writeLegacyRows(name, rows) {
  await setDoc(legacyRef(name), { data: rows, updatedAt: serverTimestamp() }, { merge: true });
}

export const companyCollection = (companyId, name) => collection(db, 'companies', companyId, name);
export const companyDoc = (companyId, name, id) => doc(db, 'companies', companyId, name, id);

export function subscribeCollection(companyId, name, callback, options = {}) {
  if (!companyId) return () => {};
  if (isLegacyCompany(companyId)) {
    return onSnapshot(legacyRef(name), snapshot => {
      const rows = normalizeLegacyRows(name, snapshot.exists() ? snapshot.data()?.data || [] : []);
      callback(applyClientOptions(rows, options));
    }, error => {
      if (import.meta.env.DEV) console.warn(`No se pudo suscribir legacy ${name}`, error);
      callback([]);
    });
  }
  const clauses = [];
  if (options.where) options.where.forEach(([field, operator, value]) => clauses.push(where(field, operator, value)));
  if (options.orderBy) clauses.push(orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
  if (options.limit) clauses.push(limit(options.limit));
  return onSnapshot(query(companyCollection(companyId, name), ...clauses), snapshot => {
    callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  });
}

export async function listDocuments(companyId, name) {
  if (isLegacyCompany(companyId)) return readLegacyRows(name);
  const snapshot = await getDocs(companyCollection(companyId, name));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export async function createDocument(companyId, name, payload, user, id) {
  const body = cleanPayload({ ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  if (isLegacyCompany(companyId)) {
    const rows = await readLegacyRows(name);
    const nextId = id || payload.id || payload.uid || payload.code || payload.folio || Math.random().toString(36).slice(2, 10);
    await writeLegacyRows(name, [...rows, { ...payload, id: nextId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    return nextId;
  }
  const ref = id ? companyDoc(companyId, name, id) : doc(companyCollection(companyId, name));
  await setDoc(ref, body, { merge: true });
  await logCreate(companyId, name, ref.id, body, user);
  return ref.id;
}

export async function updateDocument(companyId, name, id, payload, user) {
  if (isLegacyCompany(companyId)) {
    const rows = await readLegacyRows(name);
    const before = rows.find(row => row.id === id) || null;
    const nextRows = rows.map(row => row.id === id ? { ...row, ...payload, id, updatedAt: new Date().toISOString() } : row);
    await writeLegacyRows(name, nextRows);
    return before;
  }
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
  if (isLegacyCompany(companyId)) {
    const rows = await readLegacyRows(name);
    await writeLegacyRows(name, rows.filter(row => row.id !== id));
    return;
  }
  const ref = companyDoc(companyId, name, id);
  const beforeSnap = await getDoc(ref);
  await deleteDoc(ref);
  await logDelete(companyId, name, id, beforeSnap.exists() ? beforeSnap.data() : null, user);
}

export async function getCompanySettings(companyId) {
  if (isLegacyCompany(companyId)) return null;
  const snap = await getDoc(doc(db, 'companies', companyId, 'settings', 'general'));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveCompanySettings(companyId, payload, user) {
  return createDocument(companyId, 'settings', payload, user, 'general');
}

export async function generateFolio(companyId, prefix) {
  const year = currentYear();
  if (isLegacyCompany(companyId)) return `${prefix}-${year}-${String(Date.now()).slice(-6)}`;
  const counterName = `${prefix}-${year}`;
  const ref = doc(db, 'companies', companyId, 'counters', counterName);
  return runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    const next = (snap.exists() ? snap.data().value : 0) + 1;
    transaction.set(ref, { value: next, year, prefix, updatedAt: serverTimestamp() }, { merge: true });
    return `${prefix}-${year}-${String(next).padStart(6, '0')}`;
  });
}
