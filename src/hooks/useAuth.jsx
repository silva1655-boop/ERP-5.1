import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
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
        const loadedProfile = await resolveUserProfile(user.uid);
        if (!loadedProfile?.active) {
          await authLogout();
          throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
        }
        setProfile(loadedProfile);
        const settings = await getCompanySettings(loadedProfile.companyId);
        setCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, ...(settings || {}) });
      } catch (err) {
        setError(handleError(err));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
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
