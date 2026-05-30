import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// ─── Legacy Firestore login (fallback when Firebase Auth is not yet enabled) ─
async function loginLegacy(email, password) {
  const snap = await getDoc(doc(db, 'mantek_v2', 'users'));
  const users = snap.exists() ? (snap.data().data || []) : [];
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(
    u => u.email?.toLowerCase() === normalizedEmail && u.password === password
  );
  if (!found) throw new Error('Credenciales incorrectas');
  const { password: _pw, ...profile } = found;
  return {
    firebaseUser: null,
    profile: { ...profile, companyId: 'legacy', active: true, uid: profile.id },
  };
}

// ─── Main login: tries Firebase Auth first, falls back to Firestore lookup ──
export async function loginWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const profile = await resolveUserProfile(credential.user.uid);
    if (!profile?.active) {
      await signOut(auth);
      throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
    }
    try {
      await updateDoc(
        doc(db, 'companies', profile.companyId, 'users', credential.user.uid),
        { lastLoginAt: serverTimestamp() }
      );
    } catch (_) { /* non-fatal */ }
    return { firebaseUser: credential.user, profile };
  } catch (err) {
    // Only fall back if the error is NOT a definitive wrong-credentials error
    const isWrongCreds =
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-email';

    if (!isWrongCreds) {
      // Firebase Auth not enabled yet or other config issue — use legacy lookup
      return loginLegacy(email, password);
    }
    throw err;
  }
}

export const logout = async () => {
  localStorage.removeItem('mantek_legacy_session');
  try { await signOut(auth); } catch (_) {}
};

export const resetPassword = email => sendPasswordResetEmail(auth, email);

export async function resolveUserProfile(uid) {
  try {
    const token = await auth.currentUser?.getIdTokenResult().catch(() => null);
    const companyIdFromClaims = token?.claims?.companyId;
    if (companyIdFromClaims) {
      const scopedSnap = await getDoc(doc(db, 'companies', companyIdFromClaims, 'users', uid));
      if (scopedSnap.exists()) return { id: scopedSnap.id, ...scopedSnap.data() };
    }
  } catch (_) {}
  throw Object.assign(new Error('Perfil de usuario no encontrado'), { code: 'permission-denied' });
}
