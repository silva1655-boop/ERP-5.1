import { createContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLL } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // Load all users from Firestore for the legacy fallback
  const loadAllUsers = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, COLL, "users"));
      if (snap.exists()) {
        const users = snap.data().data || [];
        setAllUsers(users);
        return users;
      }
      return [];
    } catch (e) {
      console.error("loadUsers:", e);
      return [];
    }
  }, []);

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Listen to Firebase Auth state (for when Auth is enabled)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase Auth is working — load user profile from Firestore
        try {
          const snap = await getDoc(doc(db, COLL, "users"));
          const users = snap.exists() ? (snap.data().data || []) : [];
          setAllUsers(users);
          const profile = users.find(u => u.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
          if (profile) {
            const sessionUser = { ...profile };
            delete sessionUser.password;
            setUser(sessionUser);
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: "operador", name: firebaseUser.email, avatar: "?" });
          }
        } catch (e) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: "operador", name: firebaseUser.email, avatar: "?" });
        }
      } else {
        // Check if there's a session in localStorage (legacy)
        const saved = localStorage.getItem("mantek_session");
        if (saved) {
          try { setUser(JSON.parse(saved)); } catch (e) { setUser(null); }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email, password) => {
    // Try Firebase Auth first
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return { success: true };
    } catch (firebaseError) {
      // Firebase Auth not enabled or user not migrated — use legacy lookup
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const snap = await getDoc(doc(db, COLL, "users"));
        const users = snap.exists() ? (snap.data().data || []) : [];
        const found = users.find(u => u.email?.toLowerCase() === normalizedEmail && u.password === password);
        if (found) {
          const sessionUser = { ...found };
          delete sessionUser.password; // never store password in session
          setUser(sessionUser);
          localStorage.setItem("mantek_session", JSON.stringify(sessionUser));
          setAllUsers(users);
          return { success: true };
        }
        return { success: false, error: "Credenciales incorrectas" };
      } catch (dbError) {
        console.error("login fallback error:", dbError);
        return { success: false, error: "Error al conectar con la base de datos" };
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch (e) {}
    localStorage.removeItem("mantek_session");
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (e) {
      return { success: false, error: "No se pudo enviar el correo de recuperación" };
    }
  }, []);

  const updateUserInSession = useCallback((updatedUser) => {
    const sessionUser = { ...updatedUser };
    delete sessionUser.password;
    setUser(sessionUser);
    localStorage.setItem("mantek_session", JSON.stringify(sessionUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword, allUsers, loadAllUsers, updateUserInSession }}>
      {children}
    </AuthContext.Provider>
  );
}
