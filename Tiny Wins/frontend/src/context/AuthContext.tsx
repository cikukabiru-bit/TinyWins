import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tinywins_token'));
  const [loading, setLoading] = useState(true);

  // Authenticated fetch wrapper for API queries
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const activeToken = token || localStorage.getItem('tinywins_token');
    const headers = new Headers(options.headers || {});
    
    if (activeToken) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }
    headers.set('Content-Type', 'application/json');

    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('tinywins_token');
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token expired or invalid
            localStorage.removeItem('tinywins_token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error("Failed to authenticate session.", err);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('tinywins_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout request failed, cleaning local state.", err);
    } finally {
      localStorage.removeItem('tinywins_token');
      // Keep theme but clean other settings
      localStorage.removeItem('tinywins_lock_status'); 
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
