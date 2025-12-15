import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../services/api';
import { setToken as setAuthToken, initAuthToken, getToken as getStoredToken } from '../services/authToken';
import permissionService from '../services/permissionService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionKeys, setPermissionKeys] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const refreshPermissions = useCallback(async () => {
    try {
      if (!token) { setPermissionKeys([]); return; }
      const keys = await permissionService.getMyKeys();
      setPermissionKeys(Array.isArray(keys) ? keys : []);
    } catch (e) {
      setPermissionKeys([]);
    }
  }, [token]);

  const login = useCallback(async ({ numero_documento, password }) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiLogin({ numero_documento, password });
      const { token: t, user: u } = result || {};
      setToken(t);
      setAuthToken(t);
      setUser(u || null);
      try { const keys = await permissionService.getMyKeys(); setPermissionKeys(Array.isArray(keys) ? keys : []); } catch {}
      return { token: t, user: u };
    } catch (e) {
      const isAbort = String(e?.name || '').toLowerCase() === 'aborterror' || /aborted/i.test(String(e?.message || ''));
      const msg = isAbort ? 'Tiempo de espera agotado o conexión bloqueada' : (e?.message || 'Error de autenticación');
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setAuthToken('');
    setUser(null);
    setError('');
    setPermissionKeys([]);
  }, []);

  // Load token from persistent storage once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initAuthToken();
        const t = getStoredToken();
        if (mounted) {
          if (t) setToken(t);
        }
      } catch (e) {
        // ignore
      }
      finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!token) { setPermissionKeys([]); return; }
        const keys = await permissionService.getMyKeys();
        if (mounted) setPermissionKeys(Array.isArray(keys) ? keys : []);
      } catch (e) {
        if (mounted) setPermissionKeys([]);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const value = useMemo(() => ({ token, user, login, logout, loading, error, permissionKeys, refreshPermissions, hydrated }), [token, user, login, logout, loading, error, permissionKeys, refreshPermissions, hydrated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
