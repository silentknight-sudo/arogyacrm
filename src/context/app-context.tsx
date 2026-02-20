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

  // WORKAROUND: The teamspace creation and fetching has been unstable.
  // Using a static list of teamspaces to unblock development.
  const staticTeamspaces = useMemo(() => {
    if (!authUser?.uid) return [];
    return [
      { id: 'sales-team-1', name: 'Sales Team 1', description: 'Default teamspace for Sales Team 1.', ownerId: authUser.uid, memberIds: [authUser.uid] },
      { id: 'sales-team-2', name: 'Sales Team 2', description: 'Default teamspace for Sales Team 2.', ownerId: authUser.uid, memberIds: [authUser.uid] },
      { id: 'sales-team-3', name: 'Sales Team 3', description: 'Default teamspace for Sales Team 3.', ownerId: authUser.uid, memberIds: [authUser.uid] },
      { id: 'sales-team-4', name: 'Sales Team 4', description: 'Default teamspace for Sales Team 4.', ownerId: authUser.uid, memberIds: [authUser.uid] },
    ];
  }, [authUser?.uid]);

  const availableTeamspaces = staticTeamspaces;
  const areTeamspacesLoading = false;

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
