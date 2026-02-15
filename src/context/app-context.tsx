'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, Teamspace } from '@/types';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';


interface AppContextType {
  currentUser: UserProfile | null;
  isUserLoading: boolean;
  currentTeamspace: Teamspace | null;
  setCurrentTeamspace: (teamspace: Teamspace) => void;
  availableTeamspaces: Teamspace[];
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading: isAuthLoading, auth } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    authUser ? doc(firestore, 'users', authUser.uid) : null
  , [firestore, authUser]);
  const { data: currentUser, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const teamspacesQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;

    if (currentUser.role === 'admin') {
      // Admins should see all teamspaces
      return query(collection(firestore, 'teamspaces'));
    }
    
    // Regular users see only their teamspaces
    if (currentUser.teamspaceIds?.length) {
      return query(collection(firestore, 'teamspaces'), where('id', 'in', currentUser.teamspaceIds));
    }
    
    return null;
  }, [firestore, currentUser]);

  const { data: availableTeamspaces } = useCollection<Teamspace>(teamspacesQuery);

  const [currentTeamspace, setCurrentTeamspace] = useState<Teamspace | null>(null);

  useEffect(() => {
    if (availableTeamspaces && availableTeamspaces.length > 0) {
      if (!currentTeamspace || !availableTeamspaces.some(ts => ts.id === currentTeamspace.id)) {
        setCurrentTeamspace(availableTeamspaces[0]);
      }
    } else {
        setCurrentTeamspace(null);
    }
  }, [availableTeamspaces, currentTeamspace]);

  const logout = () => {
    auth?.signOut();
  };

  const value = {
    currentUser: currentUser ?? null,
    isUserLoading: isAuthLoading || isProfileLoading,
    currentTeamspace,
    setCurrentTeamspace: (teamspace: Teamspace) => setCurrentTeamspace(teamspace),
    availableTeamspaces: availableTeamspaces || [],
    logout
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
