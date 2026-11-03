// src/context/AuthContext.jsx
// État de session côté client. Le token reste dans un cookie HttpOnly : on ne stocke ici que
// le nom et le rôle, utilisés pour l'affichage. Les droits sont toujours vérifiés par l'API.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((response) => setUser(response.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await apiLogin(credentials);
    setUser(response.data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
