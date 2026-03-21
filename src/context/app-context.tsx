'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Teamspace, Notification } from '@/types';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, getDoc } from 'firebase/firestore';

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
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => 
    authUser ? doc(firestore, 'users', authUser.uid) : null
  , [firestore, authUser]);
  const { data: currentUser, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isUserLoading = isAuthLoading || (!!authUser && isProfileLoading);

  const [availableTeamspaces, setAvailableTeamspaces] = useState<Teamspace[]>([]);
  const [areTeamspacesLoading, setAreTeamspacesLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const adminTeamspacesQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser?.role === 'admin'
      ? query(collection(firestore, 'teamspaces'))
      : null
  , [firestore, currentUser, isUserLoading]);
  const { data: adminTeamspaces, isLoading: isAdminTeamspacesLoading } = useCollection<Teamspace>(adminTeamspacesQuery);
  
  useEffect(() => {
    if (!isUserLoading && currentUser?.role === 'admin') {
      setAvailableTeamspaces(adminTeamspaces || []);
      setAreTeamspacesLoading(isAdminTeamspacesLoading);
    }
  }, [adminTeamspaces, isAdminTeamspacesLoading, currentUser?.role, isUserLoading]);
  
  useEffect(() => {
    if (!isUserLoading && currentUser && currentUser.role !== 'admin') {
      const teamspaceIds = currentUser.teamspaceIds || [];
      if (teamspaceIds.length === 0) {
        setAvailableTeamspaces([]);
        setAreTeamspacesLoading(false);
        return;
      }

      setAreTeamspacesLoading(true);
      const fetchTeamspaces = async () => {
        try {
          const promises = teamspaceIds.map(id => getDoc(doc(firestore, 'teamspaces', id)));
          const docSnapshots = await Promise.all(promises);
          const teams = docSnapshots
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as Teamspace));
          setAvailableTeamspaces(teams);
        } catch (error) {
          console.error("Error fetching user's teamspaces:", error);
          setAvailableTeamspaces([]);
        } finally {
          setAreTeamspacesLoading(false);
        }
      };

      fetchTeamspaces();
    } else if (!isUserLoading && !currentUser) {
      setAvailableTeamspaces([]);
      setAreTeamspacesLoading(false);
    }
  }, [currentUser, isUserLoading, firestore]);


  const [currentTeamspace, setCurrentTeamspaceState] = useState<Teamspace | null>(null);
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    if (!isUserLoading && availableTeamspaces && availableTeamspaces.length > 0) {
      if (!currentTeamspace || !availableTeamspaces.some(ts => ts.id === currentTeamspace.id)) {
        setCurrentTeamspaceState(availableTeamspaces[0]);
      }
    } else if (!isUserLoading && !areTeamspacesLoading) {
        setCurrentTeamspaceState(null);
    }
  }, [availableTeamspaces, currentTeamspace, areTeamspacesLoading, isUserLoading]);

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

  const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const logout = async () => {
    setCurrentTeamspaceState(null);
    setAvailableTeamspaces([]);
    setNotifications([]);
    await auth.signOut();
    router.push('/login');
  };

  const value = {
    currentUser: currentUser ?? null,
    isUserLoading,
    currentTeamspace,
    setCurrentTeamspace,
    availableTeamspaces: availableTeamspaces || [],
    areTeamspacesLoading,
    logout,
    theme,
    setTheme,
    notifications,
    addNotification,
    clearNotifications,
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
