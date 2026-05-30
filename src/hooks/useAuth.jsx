import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { loginWithEmail, logout as authLogout, resetPassword as sendReset, resolveUserProfile } from '../services/authService';
import { getCompanySettings } from '../services/firestoreService';
import { DEFAULT_COMPANY_SETTINGS } from '../utils/constants';
import { handleError } from '../utils/errorHandler';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companySettings, setCompanySettings] = useState(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setFirebaseUser(null);
      setProfile(null);
      setCompanySettings(DEFAULT_COMPANY_SETTINGS);
      setError('Firebase no está configurado. Agrega las variables VITE_FIREBASE_* en el entorno de despliegue.');
      setLoading(false);
      return undefined;
    }

    let resolvedInitialAuth = false;
    const authTimeout = setTimeout(() => {
      if (!resolvedInitialAuth) {
        setError('Firebase Auth no respondió a tiempo. Se muestra login para reintentar la conexión.');
        setFirebaseUser(null);
        setProfile(null);
        setCompanySettings(DEFAULT_COMPANY_SETTINGS);
        setLoading(false);
      }
    }, 12000);

    const unsubscribe = onAuthStateChanged(auth, async user => {
      setLoading(true);
      setError('');
      resolvedInitialAuth = true;
      clearTimeout(authTimeout);
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setLoading(true);
      setError('');
      try {
        setFirebaseUser(user);
        if (!user) {
          setProfile(null);
          setCompanySettings(DEFAULT_COMPANY_SETTINGS);
          return;
        }
        const loadedProfile = await resolveUserProfile(user);
        if (loadedProfile?.active === false || loadedProfile?.active === 'false') {
        const loadedProfile = await resolveUserProfile(user.uid);
        if (!loadedProfile?.active) {
          await authLogout();
          throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
        }
        setProfile(loadedProfile);
        try {
          const settings = await getCompanySettings(loadedProfile.companyId);
          setCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, ...(settings || {}) });
        } catch (settingsError) {
          if (import.meta.env.DEV) console.warn('No se pudo cargar settings/general; se usarán valores por defecto.', settingsError);
          setCompanySettings(DEFAULT_COMPANY_SETTINGS);
        }
        const settings = await getCompanySettings(loadedProfile.companyId);
        setCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, ...(settings || {}) });
      } catch (err) {
        setError(handleError(err));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    user: profile,
    companyId: profile?.companyId || null,
    companySettings,
    loading,
    error,
    isAuthenticated: Boolean(firebaseUser && profile),
    login: loginWithEmail,
    logout: authLogout,
    resetPassword: sendReset,
    setCompanySettings,
  }), [firebaseUser, profile, companySettings, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
