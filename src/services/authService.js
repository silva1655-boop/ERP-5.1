import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collectionGroup, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await resolveUserProfile(credential.user.uid);
  if (!profile?.active) {
    await signOut(auth);
    throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
  }
  await updateDoc(doc(db, 'companies', profile.companyId, 'users', credential.user.uid), { lastLoginAt: serverTimestamp() });
  return { firebaseUser: credential.user, profile };
}

export const logout = () => signOut(auth);
export const resetPassword = email => sendPasswordResetEmail(auth, email);

export async function resolveUserProfile(uid) {
  const token = await auth.currentUser?.getIdTokenResult().catch(() => null);
  const companyIdFromClaims = token?.claims?.companyId;
  if (companyIdFromClaims) {
    const scopedSnap = await getDoc(doc(db, 'companies', companyIdFromClaims, 'users', uid));
    if (scopedSnap.exists()) return { id: scopedSnap.id, ...scopedSnap.data() };
  }
  const companies = token?.claims?.companies || [];
  for (const companyId of companies) {
    const snap = await getDoc(doc(db, 'companies', companyId, 'users', uid));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  }
  const fallback = await getDocs(query(collectionGroup(db, 'users'), where('uid', '==', uid), limit(1)));
  if (!fallback.empty) {
    const profileDoc = fallback.docs[0];
    return { id: profileDoc.id, ...profileDoc.data() };
  }
  throw Object.assign(new Error('Perfil de usuario no encontrado'), { code: 'permission-denied' });
}

