import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collectionGroup, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

function normalizeUserProfile(profileDoc) {
  const data = profileDoc.data();
  const companyIdFromPath = profileDoc.ref.parent.parent?.id;
  const companyId = data.companyId || data.companyid || companyIdFromPath;

  return {
    id: profileDoc.id,
    ...data,
    uid: data.uid || profileDoc.id,
    companyId,
    companyid: data.companyid || companyId,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

  try {
    const profile = await resolveUserProfile(credential.user.uid);
    if (!profile?.active) {
      await signOut(auth);
      throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
    }

    updateDoc(doc(db, 'companies', profile.companyId, 'users', credential.user.uid), {
      companyId: profile.companyId,
      uid: credential.user.uid,
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
export const resetPassword = email => sendPasswordResetEmail(auth, email.trim());

export async function resolveUserProfile(uid) {
  const token = await auth.currentUser?.getIdTokenResult().catch(() => null);
  const candidates = unique([
    token?.claims?.companyId,
    token?.claims?.companyid,
    ...(token?.claims?.companies || []),
  ]);

  for (const companyId of candidates) {
    const snap = await getDoc(doc(db, 'companies', companyId, 'users', uid));
    if (snap.exists()) return normalizeUserProfile(snap);
  }

  try {
    const fallback = await getDocs(query(collectionGroup(db, 'users'), where('uid', '==', uid), limit(1)));
    if (!fallback.empty) return normalizeUserProfile(fallback.docs[0]);
  } catch (error) {
    throw Object.assign(
      new Error('No se pudo leer el perfil del usuario. Revisa Firestore Rules y que el documento users tenga uid, active y companyId.'),
      { code: error.code || 'permission-denied', cause: error },
    );
  }

  throw Object.assign(
    new Error('Perfil de usuario no encontrado. Crea companies/{companyId}/users/{uid} con uid, active, role y companyId.'),
    { code: 'profile-not-found' },
  );
}
