'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Teamspace, Notification } from '@/types';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, getDoc, orderBy, limit, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { repairManagedTelecallers } from '@/app/actions/team-membership-repair';
import { getPrimaryTeamspaceId } from '@/lib/team-membership';

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

  // NOTIFICATION PERSISTENCE: Subscribe to Firestore subcollection
  const notificationsQuery = useMemoFirebase(() =>
    currentUser ? query(
      collection(firestore, 'users', currentUser.id, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(50)
    ) : null
  , [firestore, currentUser]);
  
  const { data: notificationsData } = useCollection<Notification>(notificationsQuery);
  const notifications = useMemo(() => notificationsData || [], [notificationsData]);

  const addNotification = useCallback(async (notif: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    if (!currentUser) return;
    try {
      const notifRef = collection(firestore, 'users', currentUser.id, 'notifications');
      await addDoc(notifRef, {
        ...notif,
        read: false,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("FAILED_TO_ADD_PERSISTENT_NOTIFICATION:", e);
    }
  }, [currentUser, firestore]);

  const clearNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const colRef = collection(firestore, 'users', currentUser.id, 'notifications');
      const snapshot = await getDocs(query(colRef, limit(100)));
      const batch = writeBatch(firestore);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("FAILED_TO_CLEAR_PERSISTENT_NOTIFICATIONS:", e);
    }
  }, [currentUser, firestore]);

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
    if (!isUserLoading && currentUser?.accessStatus === 'blocked') {
      logout();
    }
  }, [currentUser?.accessStatus, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && currentUser && currentUser.role !== 'admin') {
      const primaryTeamspaceId = getPrimaryTeamspaceId(currentUser);
      if (!primaryTeamspaceId) {
        setAvailableTeamspaces([]);
        setAreTeamspacesLoading(false);
        return;
      }

      setAreTeamspacesLoading(true);
      const fetchTeamspaces = async () => {
        try {
          const teamspaceSnap = await getDoc(doc(firestore, 'teamspaces', primaryTeamspaceId));
          const teams = teamspaceSnap.exists()
            ? [{ id: teamspaceSnap.id, ...teamspaceSnap.data() } as Teamspace]
            : [];
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
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    if (isUserLoading || !currentUser || currentUser.role !== 'sales_team_lead' || !currentTeamspace?.id) {
      return;
    }

    const repairKey = `telecaller-repair:${currentUser.id}:${currentTeamspace.id}`;
    if (sessionStorage.getItem(repairKey) === 'done') {
      return;
    }

    sessionStorage.setItem(repairKey, 'pending');
    repairManagedTelecallers({
      teamLeadId: currentUser.id,
      teamspaceId: currentTeamspace.id,
    })
      .then((result) => {
        sessionStorage.setItem(repairKey, result.success ? 'done' : 'failed');
      })
      .catch(() => {
        sessionStorage.setItem(repairKey, 'failed');
      });
  }, [currentTeamspace?.id, currentUser, isUserLoading]);

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
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
      return;
    }

    localStorage.setItem('arogya-crm-theme', 'light');
    setThemeState('light');
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    root.classList.add(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const setCurrentTeamspace = (teamspace: Teamspace) => {
    setCurrentTeamspaceState(teamspace);
  };
  
  const setTheme = (theme: Theme) => {
    localStorage.setItem('arogya-crm-theme', theme);
    setThemeState(theme);
  };

  const logout = async () => {
    setCurrentTeamspaceState(null);
    setAvailableTeamspaces([]);
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
