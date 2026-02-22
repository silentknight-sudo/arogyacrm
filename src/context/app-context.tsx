'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, Teamspace } from '@/types';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';

export type Theme = 'light' | 'dark' | 'system';

interface AppContextType {
  currentUser: UserProfile | null;
  isUserLoading: boolean;
  currentTeamspace: Teamspace | null;
  setCurrentTeamspace: (teamspace: Teamspace) => void;
  availableTeamspaces: Teamspace[];
  areTeamspacesLoading: boolean;
  logout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    authUser ? doc(firestore, 'users', authUser.uid) : null
  , [firestore, authUser]);
  const { data: currentUser, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const teamspacesQuery = useMemoFirebase(() =>
      currentUser && currentUser.teamspaceIds && currentUser.teamspaceIds.length > 0
      ? query(collection(firestore, 'teamspaces'), where(documentId(), 'in', currentUser.teamspaceIds))
      : null
  , [firestore, currentUser]);

  const { data: availableTeamspaces, isLoading: areTeamspacesLoading } = useCollection<Teamspace>(teamspacesQuery);


  const [currentTeamspace, setCurrentTeamspaceState] = useState<Teamspace | null>(null);
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    if (availableTeamspaces && availableTeamspaces.length > 0) {
      if (!currentTeamspace || !availableTeamspaces.some(ts => ts.id === currentTeamspace.id)) {
        setCurrentTeamspaceState(availableTeamspaces[0]);
      }
    } else {
        setCurrentTeamspaceState(null);
    }
  }, [availableTeamspaces, currentTeamspace]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('arogya-crm-theme') as Theme | null;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
    } else {
        root.classList.add(theme);
    }
  }, [theme]);

  const setCurrentTeamspace = (teamspace: Teamspace) => {
    setCurrentTeamspaceState(teamspace);
  };
  
  const setTheme = (theme: Theme) => {
    localStorage.setItem('arogya-crm-theme', theme);
    setThemeState(theme);
  };

  const logout = () => {
    auth?.signOut();
  };

  const value = {
    currentUser: currentUser ?? null,
    isUserLoading: isAuthLoading || isProfileLoading,
    currentTeamspace,
    setCurrentTeamspace,
    availableTeamspaces: availableTeamspaces || [],
    areTeamspacesLoading,
    logout,
    theme,
    setTheme
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
