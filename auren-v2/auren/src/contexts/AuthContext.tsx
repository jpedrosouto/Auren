import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import googleAuth from '../services/googleAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  userInfo: any;
  hasClientId: boolean;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setClientId: (id: string) => void;
  timeUntilExpiry: number;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false, isLoading: false, isReady: false,
  error: null, userInfo: null, hasClientId: false,
  login: async () => {}, logout: () => {}, clearError: () => {},
  setClientId: () => {}, timeUntilExpiry: 0,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [hasClientId, setHasClientId] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);

  useEffect(() => {
    setHasClientId(googleAuth.hasClientId());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!hasClientId) return;
    googleAuth.init().catch((e) => setError(e.message));
  }, [hasClientId]);

  // Timer para expiração do token
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setTimeUntilExpiry(googleAuth.getTimeUntilExpiry());
    }, 30000);
    setTimeUntilExpiry(googleAuth.getTimeUntilExpiry());
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const onSuccess = () => {
      setIsAuthenticated(true);
      setIsLoading(false);
      setError(null);
    };
    const onError = (e: Event) => {
      setError((e as CustomEvent).detail.error);
      setIsAuthenticated(false);
      setIsLoading(false);
    };
    const onLogout = () => {
      setIsAuthenticated(false);
      setUserInfo(null);
      setTimeUntilExpiry(0);
    };
    const onUser = (e: Event) => setUserInfo((e as CustomEvent).detail.userInfo);

    window.addEventListener('authSuccess', onSuccess);
    window.addEventListener('authError', onError);
    window.addEventListener('authLogout', onLogout);
    window.addEventListener('userInfoLoaded', onUser);
    return () => {
      window.removeEventListener('authSuccess', onSuccess);
      window.removeEventListener('authError', onError);
      window.removeEventListener('authLogout', onLogout);
      window.removeEventListener('userInfoLoaded', onUser);
    };
  }, []);

  const login = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await googleAuth.signIn();
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  const logout = () => googleAuth.signOut();
  const clearError = () => setError(null);

  const setClientId = (id: string) => {
    googleAuth.setClientId(id);
    setHasClientId(true);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, isReady, error, userInfo,
      hasClientId, login, logout, clearError, setClientId, timeUntilExpiry,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
