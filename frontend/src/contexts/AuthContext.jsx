import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, setup, getSavedUser, saveUser, getToken, clearToken, clearDeviceId } from '../api/client';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setup.status()
        .then(data => { if (!cancelled) setSetupRequired(Boolean(data?.needs_admin_setup)); })
        .catch(() => {});
      const saved = getSavedUser();
      const token = getToken();
      if (saved && !token) setUser(null);
      else if (saved) setUser(saved);
      if (!token) {
        try {
          const data = await auth.anonymousInit();
          if (!cancelled && data?.user) {
            setUser(data.user);
            saveUser(data.user);
          }
        } catch (e) {
          console.warn('anonymous init failed:', e);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      try {
        const u = await auth.me();
        if (!cancelled) {
          setUser(u);
          saveUser(u);
        }
      } catch {
        clearToken();
        try {
          const data = await auth.anonymousInit();
          if (!cancelled) {
            setUser(data.user);
            saveUser(data.user);
          }
        } catch (e2) {
          console.warn('re-init failed:', e2);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Listen for auth events from auth-modal.js (legacy) or self
  useEffect(() => {
    const handle = async () => {
      const token = getToken();
      if (!token) { setUser(null); return; }
      try {
        const u = await auth.me();
        setUser(u);
        saveUser(u);
    } catch {
      clearToken();
      setUser(null);
    }
    };
    window.addEventListener('putiyuan:user-updated', handle);
    window.addEventListener('putiyuan:auth-expired', handle);
    return () => {
      window.removeEventListener('putiyuan:user-updated', handle);
      window.removeEventListener('putiyuan:auth-expired', handle);
    };
  }, []);

  const openLogin = useCallback(() => {
    setModalMode('login');
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const switchMode = useCallback((m) => setModalMode(m), []);
  const isAuthenticated = Boolean(user?.is_registered || user?.username || user?.email || user?.is_admin);
  const completeSetup = useCallback((u) => {
    setUser(u);
    saveUser(u);
    setSetupRequired(false);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    clearToken();
    clearDeviceId();
    try { localStorage.removeItem('putiyuan_user_v2'); } catch {
      // Best-effort local cache cleanup.
    }
    setUser(null);
    try {
      const data = await auth.anonymousInit();
      if (data?.user) {
        setUser(data.user);
        saveUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('putiyuan:user-updated'));
    }
  }, []);

  const value = { user, loading, modalOpen, modalMode, setupRequired, isAuthenticated, setModalOpen, setUser, openLogin, closeModal, switchMode, completeSetup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
