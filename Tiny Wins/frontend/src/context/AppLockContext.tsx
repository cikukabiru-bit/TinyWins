import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface AppLockContextProps {
  isLocked: boolean;
  pinEnabled: boolean;
  lockTimeout: number; // in minutes
  failedAttempts: number;
  lockedUntil: string | null;
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string; requireReauth?: boolean }>;
  lockApp: () => void;
  refreshSettings: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextProps | undefined>(undefined);

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, fetchWithAuth, logout } = useAuth();
  
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // If refreshed, and PIN was enabled, lock app immediately!
    const sessionLocked = sessionStorage.getItem('tinywins_session_locked');
    return sessionLocked !== 'false';
  });

  const [pinEnabled, setPinEnabled] = useState<boolean>(false);
  const [lockTimeout, setLockTimeout] = useState<number>(5); // Default 5 mins
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  const lastActiveRef = useRef<number>(Date.now());

  const refreshSettings = async () => {
    if (!token || !user) return;
    try {
      const res = await fetchWithAuth('/api/security/settings');
      if (res.ok) {
        const data = await res.json();
        setPinEnabled(data.pin_enabled);
        setLockTimeout(data.lock_timeout_minutes);
        setFailedAttempts(data.failed_pin_attempts);
        setLockedUntil(data.locked_until);
        
        // If pin is enabled and we haven't set session state, lock it
        if (data.pin_enabled && sessionStorage.getItem('tinywins_session_locked') === null) {
          setIsLocked(true);
          sessionStorage.setItem('tinywins_session_locked', 'true');
        }
      }
    } catch (err) {
      console.error("Failed to sync security settings.", err);
    }
  };

  useEffect(() => {
    if (token && user) {
      refreshSettings();
    } else {
      // Clean locks on logout
      setIsLocked(false);
      setPinEnabled(false);
      sessionStorage.removeItem('tinywins_session_locked');
    }
  }, [token, user]);

  const lockApp = () => {
    if (pinEnabled) {
      setIsLocked(true);
      sessionStorage.setItem('tinywins_session_locked', 'true');
    }
  };

  // Verify PIN via backend API
  const verifyPin = async (pin: string) => {
    try {
      const res = await fetchWithAuth('/api/security/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });

      const data = await res.json();

      if (res.ok) {
        setIsLocked(false);
        setFailedAttempts(0);
        setLockedUntil(null);
        sessionStorage.setItem('tinywins_session_locked', 'false');
        return { success: true };
      } else {
        setFailedAttempts(data.attempts || failedAttempts + 1);
        setLockedUntil(data.locked_until || null);

        if (data.require_reauth) {
          // If attempts reach 10, force full logout
          await logout();
          return { success: false, error: "Too many failed attempts. Full account logout required.", requireReauth: true };
        }

        return { success: false, error: data.error || "Incorrect PIN" };
      }
    } catch (err: any) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Inactivity timeout handler
  useEffect(() => {
    if (!token || !pinEnabled || isLocked) return;

    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // Attach activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Check inactivity interval
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActiveRef.current) / 1000 / 60; // in minutes
      if (elapsed >= lockTimeout) {
        console.log(`Inactivity lock triggered after ${lockTimeout} minutes.`);
        setIsLocked(true);
        sessionStorage.setItem('tinywins_session_locked', 'true');
      }
    }, 15000); // Check every 15 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [token, pinEnabled, isLocked, lockTimeout]);

  // Lock when browser tab loses focus / closes / reloads
  useEffect(() => {
    if (!pinEnabled) return;

    const handleBeforeUnload = () => {
      // Next load must be locked
      sessionStorage.setItem('tinywins_session_locked', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pinEnabled]);

  return (
    <AppLockContext.Provider value={{
      isLocked,
      pinEnabled,
      lockTimeout,
      failedAttempts,
      lockedUntil,
      verifyPin,
      lockApp,
      refreshSettings
    }}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) throw new Error("useAppLock must be used within AppLockProvider");
  return context;
};
