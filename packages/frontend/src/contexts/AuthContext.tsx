import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router';
import api, { tokenStorage } from '@/lib/api';
import type { AuthUser, LoginResponse } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const logoutCalled = useRef(false);

  // ── Initialisation au montage ──────────────────────────────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      const token = tokenStorage.getAccess();

      try {
        if (!token) {
          const refresh = await api.post<{ accessToken: string }>('/api/auth/refresh');
          tokenStorage.set(refresh.data.accessToken);
        }

        const me = await api.get<AuthUser>('/api/auth/me');
        setUser(me.data);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  // ── Écoute l'événement de déconnexion forcée (intercepteur axios) ──────────
  useEffect(() => {
    const handle = () => {
      if (logoutCalled.current) return;
      logoutCalled.current = true;
      setUser(null);
      navigate('/login', { replace: true });
      setTimeout(() => { logoutCalled.current = false; }, 1000);
    };
    window.addEventListener('auth:logout', handle);
    return () => window.removeEventListener('auth:logout', handle);
  }, [navigate]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
    tokenStorage.set(data.accessToken);
    setUser(data.user);
    navigate(data.user.mustChangePassword ? '/change-password' : '/dashboard', {
      replace: true,
    });
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      tokenStorage.clear();
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get<AuthUser>('/api/auth/me');
      setUser(data);
      return data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
