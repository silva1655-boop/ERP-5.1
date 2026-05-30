import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginWithEmail, logout as authLogout, resetPassword as sendReset } from '../services/authService';
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
    // Restore legacy session from localStorage first (instant, no network)
    const savedLegacy = localStorage.getItem('mantek_legacy_session');
    if (savedLegacy) {
      try {
        const legacyProfile = JSON.parse(savedLegacy);
        setProfile(legacyProfile);
        setLoading(false);
      } catch (_) {
        localStorage.removeItem('mantek_legacy_session');
      }
    }

    // Listen to Firebase Auth (for when Firebase Auth is enabled)
    const unsubscribe = onAuthStateChanged(auth, async firebaseUserState => {
      setError('');
      try {
        setFirebaseUser(firebaseUserState);
        if (!firebaseUserState) {
          // No Firebase Auth user — keep legacy profile if it exists
          if (!localStorage.getItem('mantek_legacy_session')) {
            setProfile(null);
            setCompanySettings(DEFAULT_COMPANY_SETTINGS);
          }
          setLoading(false);
          return;
        }
        // Firebase Auth user found — load their profile
        const { resolveUserProfile } = await import('../services/authService');
        const loadedProfile = await resolveUserProfile(firebaseUserState.uid);
        if (!loadedProfile?.active) {
          await authLogout();
          throw Object.assign(new Error('Usuario inactivo'), { code: 'auth/user-disabled' });
        }
        setProfile(loadedProfile);
        localStorage.removeItem('mantek_legacy_session'); // clear legacy if real auth works
        try {
          const settings = await getCompanySettings(loadedProfile.companyId);
          setCompanySettings({ ...DEFAULT_COMPANY_SETTINGS, ...(settings || {}) });
        } catch (_) { /* settings non-fatal */ }
      } catch (err) {
        setError(handleError(err));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    const { firebaseUser: fbUser, profile: prof } = await loginWithEmail(email, password);
    if (!fbUser) {
      // Legacy login — persist session and set profile directly
      localStorage.setItem('mantek_legacy_session', JSON.stringify(prof));
      setProfile(prof);
      setFirebaseUser(null);
    }
    // Firebase Auth login is handled by onAuthStateChanged above
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('mantek_legacy_session');
    setProfile(null);
    setFirebaseUser(null);
    try { await authLogout(); } catch (_) {}
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    user: profile,
    companyId: profile?.companyId || null,
    isLegacy: profile?.companyId === 'legacy',
    companySettings,
    loading,
    error,
    isAuthenticated: Boolean(profile),
    login,
    logout,
    resetPassword: sendReset,
    setCompanySettings,
  }), [firebaseUser, profile, companySettings, loading, error, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
