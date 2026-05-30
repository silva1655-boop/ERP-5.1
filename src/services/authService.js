import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collectionGroup, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

export const LEGACY_COMPANY_ID = 'mantek_v2';
const AUTH_READ_TIMEOUT_MS = 12000;

function withTimeout(promise, label, ms = AUTH_READ_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(Object.assign(new Error(`${label} tardó demasiado. Revisa conexión/Firestore Rules.`), { code: 'auth/read-timeout' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isActiveProfile(profile) {
  return profile?.active !== false && profile?.active !== 'false';
}

function normalizeUserProfile(profileDoc, authUser = null) {
  const data = profileDoc.data();
  const companyIdFromPath = profileDoc.ref.parent.parent?.id;
  const companyId = data.companyId || data.companyid || companyIdFromPath;

  return {
    id: profileDoc.id,
    ...data,
    uid: data.uid || authUser?.uid || profileDoc.id,
    email: data.email || authUser?.email || '',
    companyId,
    companyid: data.companyid || companyId,
    active: data.active ?? true,
  };
}

function normalizeLegacyUserProfile(user, authUser = null) {
  const companyId = user.companyId || user.companyid || LEGACY_COMPANY_ID;
  return {
    ...user,
    id: user.id || user.uid || authUser?.uid || user.email,
    uid: user.uid || authUser?.uid || user.id || '',
    email: user.email || authUser?.email || '',
    companyId,
    companyid: companyId,
    active: user.active ?? true,
    source: 'legacy_mantek_v2',
  };
}

async function resolveLegacyUserProfile(authUser) {
  const email = normalizeEmail(authUser?.email);
  const snap = await withTimeout(getDoc(doc(db, LEGACY_COMPANY_ID, 'users')), 'Lectura legacy mantek_v2/users');
  if (!snap.exists()) return null;
  const users = snap.data()?.data || [];
  const match = users.find(user => {
    const userEmail = normalizeEmail(user.email);
    return user.uid === authUser?.uid || user.id === authUser?.uid || (email && userEmail === email);
  });
  return match ? normalizeLegacyUserProfile(match, authUser) : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);

  try {
    const profile = await resolveUserProfile(credential.user);
    if (!isActiveProfile(profile)) {
      await signOut(auth);
      throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
    }

    updateDoc(doc(db, 'companies', profile.companyId, 'users', credential.user.uid), {
      companyId: profile.companyId,
      companyid: profile.companyId,
      uid: credential.user.uid,
      email: profile.email || credential.user.email || normalizeEmail(email),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(error => {
      if (import.meta.env.DEV) console.warn('No se pudo actualizar lastLoginAt del perfil', error);
    });

    return { firebaseUser: credential.user, profile };
  } catch (error) {
    await signOut(auth).catch(() => {});
    throw error;
  }
}

export const logout = () => signOut(auth);
export const resetPassword = email => sendPasswordResetEmail(auth, normalizeEmail(email));

export async function resolveUserProfile(authUserOrUid) {
  const authUser = typeof authUserOrUid === 'string' ? { uid: authUserOrUid } : authUserOrUid;
  const uid = authUser?.uid;
  const email = normalizeEmail(authUser?.email);
  const token = await withTimeout(auth.currentUser?.getIdTokenResult().catch(() => null), 'Lectura de token Firebase Auth', 8000).catch(() => null);
  const candidates = unique([
    token?.claims?.companyId,
    token?.claims?.companyid,
    ...(token?.claims?.companies || []),
  ]);

  let lastReadError = null;
  for (const companyId of candidates) {
    try {
      const snap = await withTimeout(getDoc(doc(db, 'companies', companyId, 'users', uid)), `Lectura perfil ${companyId}`);
      if (snap.exists()) return normalizeUserProfile(snap, authUser);
    } catch (error) {
      lastReadError = error;
      if (import.meta.env.DEV) console.warn(`No se pudo leer perfil directo en ${companyId}`, error);
    }
  }

  try {
    const byUid = await withTimeout(getDocs(query(collectionGroup(db, 'users'), where('uid', '==', uid), limit(1))), 'Búsqueda de perfil por uid');
    if (!byUid.empty) return normalizeUserProfile(byUid.docs[0], authUser);
  } catch (error) {
    lastReadError = error;
    if (import.meta.env.DEV) console.warn('No se pudo buscar perfil por uid en collectionGroup', error);
  }

  if (email) {
    try {
      const byEmail = await withTimeout(getDocs(query(collectionGroup(db, 'users'), where('email', '==', email), limit(1))), 'Búsqueda de perfil por email');
      if (!byEmail.empty) return normalizeUserProfile(byEmail.docs[0], authUser);
    } catch (error) {
      lastReadError = error;
      if (import.meta.env.DEV) console.warn('No se pudo buscar perfil por email en collectionGroup', error);
    }
  }

  try {
    const legacyProfile = await resolveLegacyUserProfile(authUser);
    if (legacyProfile) return legacyProfile;
  } catch (error) {
    lastReadError = error;
    if (import.meta.env.DEV) console.warn('No se pudo resolver perfil legacy mantek_v2/users', error);
  }

  if (lastReadError?.code === 'permission-denied') {
    throw Object.assign(
      new Error('No se pudo leer el perfil del usuario. Publica las reglas actualizadas y verifica que el usuario exista bajo companies/{companyId}/users con uid/email correctos.'),
      { code: 'permission-denied', cause: lastReadError },
    );
  }

  throw Object.assign(
    new Error('Perfil de usuario no encontrado. Crea companies/{companyId}/users/{uid} con uid, email, active, role y companyId, o mantén el usuario en mantek_v2/users con el mismo email de Firebase Auth.'),
    { code: 'profile-not-found' },
  );
}
