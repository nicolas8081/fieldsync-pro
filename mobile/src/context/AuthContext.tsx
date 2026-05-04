import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, UserRole } from '../types/portal';
import { FIELD_SYNC_AUTH_KEY as AUTH_KEY } from '../utils/appLocalStorage';
import { fetchCustomerAccountByEmail } from '../api/portalApi';

export type SignInParams = {
  role: UserRole;
  email: string;
  displayName: string;
  password?: string;
  /** When already known from /auth/login — skips a separate account fetch. */
  customerId?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (patch: Partial<AuthUser>) => void;
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

  const updateSession = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void AsyncStorage.setItem(AUTH_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const signIn = useCallback(async ({ role, email, displayName, password, customerId: customerIdArg }: SignInParams) => {
    const trimmed = email.trim();
    const name =
      displayName.trim() ||
      (role === 'admin' ? 'Admin' : role === 'technician' ? 'Technician' : 'Customer');

    let customerId: string | undefined = customerIdArg;
    if (role === 'customer' && trimmed && !customerId) {
      try {
        const acc = await fetchCustomerAccountByEmail(trimmed);
        if (acc) customerId = acc.id;
      } catch {
        /* offline or server error */
      }
    }

    const u: AuthUser = {
      id: makeUserId(role, trimmed || role),
      email: trimmed || `${role}@demo.fieldsync.local`,
      displayName: name,
      role,
      customerId,
      accountPassword: role === 'technician' && password ? password : undefined,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
