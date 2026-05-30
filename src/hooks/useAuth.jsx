import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { COLL } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore localStorage session instantly (no network needed)
    const saved = localStorage.getItem('mantek_session');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch (_) { localStorage.removeItem('mantek_session'); }
    }

    // Listen to Firebase Auth (for when Auth is enabled in console)
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, COLL, 'users'));
          const users = snap.exists() ? (snap.data().data || []) : [];
          const profile = users.find(u => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
          const sessionUser = profile
            ? { ...profile }
            : { uid: fbUser.uid, email: fbUser.email, role: 'operador', name: fbUser.email, avatar: '?' };
          delete sessionUser.password;
          setUser(sessionUser);
          localStorage.setItem('mantek_session', JSON.stringify(sessionUser));
        } catch (_) {
          // Firestore unavailable — keep existing localStorage session
        }
      } else {
        // No Firebase Auth — keep localStorage session if it exists
        const saved = localStorage.getItem('mantek_session');
        if (!saved) setUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // Tries Firebase Auth first; falls back to Firestore users lookup (legacy)
  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return { success: true };
    } catch (_) {
      // Firebase Auth not enabled or user not migrated yet — legacy lookup
      try {
        const snap = await getDoc(doc(db, COLL, 'users'));
        const users = snap.exists() ? (snap.data().data || []) : [];
        const found = users.find(
          u => u.email?.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );
        if (found) {
          const sessionUser = { ...found };
          delete sessionUser.password;
          setUser(sessionUser);
          localStorage.setItem('mantek_session', JSON.stringify(sessionUser));
          return { success: true };
        }
        return { success: false, error: 'Credenciales incorrectas' };
      } catch (dbErr) {
        return { success: false, error: 'Error al conectar con la base de datos' };
      }
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('mantek_session');
    setUser(null);
    try { await signOut(auth); } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
