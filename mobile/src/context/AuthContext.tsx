import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, UserRole } from '../types/portal';
import { FIELD_SYNC_AUTH_KEY as AUTH_KEY } from '../utils/appLocalStorage';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: { role: UserRole; email: string; displayName: string; password?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeUserId(role: UserRole, email: string): string {
  return `${role}-${email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw) as AuthUser);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(
    async ({ role, email, displayName }: { role: UserRole; email: string; displayName: string; password?: string }) => {
      const trimmed = email.trim();
      const name = displayName.trim() || (role === 'admin' ? 'Admin' : role === 'technician' ? 'Technician' : 'Customer');
      const u: AuthUser = {
        id: makeUserId(role, trimmed || role),
        email: trimmed || `${role}@demo.fieldsync.local`,
        displayName: name,
        role,
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
      setUser(u);
    },
    []
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
