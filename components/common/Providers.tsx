'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut as nextAuthSignOut } from 'next-auth/react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export interface AppAuthContextType {
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data?: any) => Promise<any>;
}

const AppAuthContext = createContext<AppAuthContextType>({
  session: null,
  status: 'unauthenticated',
  update: async () => null,
});

export const useAppSession = () => useContext(AppAuthContext);
export const useAuth = () => {
  const { session, status, update } = useContext(AppAuthContext);
  return {
    user: session?.user,
    session,
    status,
    refreshSession: update,
    update,
  };
};
export const safeSignOut = () => {
  if (typeof window !== 'undefined') {
    nextAuthSignOut({ callbackUrl: '/login' });
  }
};

function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setSession(data);
          setStatus('authenticated');
          return data;
        }
      }
      setSession(null);
      setStatus('unauthenticated');
    } catch {
      setSession(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const update = async () => {
    return await fetchSession();
  };

  return (
    <AppAuthContext.Provider value={{ session, status, update }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('smartbbs-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('smartbbs-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  return (
    <AppAuthProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </AppAuthProvider>
  );
}
