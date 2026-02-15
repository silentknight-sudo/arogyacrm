'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { User, Teamspace } from '@/types';
import { users, teamspaces } from '@/lib/data';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  currentTeamspace: Teamspace | null;
  setCurrentTeamspace: (teamspace: Teamspace) => void;
  availableTeamspaces: Teamspace[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(users[0]);
  const [currentTeamspace, setCurrentTeamspace] = useState<Teamspace | null>(teamspaces[0]);

  const availableTeamspaces = useMemo(() => {
    if (!currentUser) return [];
    return teamspaces.filter(ts => currentUser.teamspaceIds.includes(ts.id));
  }, [currentUser]);

  // Set initial teamspace when user changes
  React.useEffect(() => {
    if (currentUser) {
      const firstTeamspace = teamspaces.find(ts => currentUser.teamspaceIds.includes(ts.id));
      setCurrentTeamspace(firstTeamspace || null);
    } else {
      setCurrentTeamspace(null);
    }
  }, [currentUser]);


  const value = {
    currentUser,
    setCurrentUser,
    currentTeamspace,
    setCurrentTeamspace,
    availableTeamspaces
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
