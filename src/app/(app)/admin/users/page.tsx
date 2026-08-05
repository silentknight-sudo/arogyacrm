'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserDialog } from './create-user-dialog';
import { useApp } from '@/context/app-context';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';
import { useTeamRoster } from '@/hooks/use-team-roster';

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { availableTeamspaces, areTeamspacesLoading, currentUser, currentTeamspace } = useApp();
  const searchParams = useSearchParams();
  const adminView = searchParams.get('view') === 'telecallers' ? 'telecallers' : 'team-leads';

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    
    if (currentUser.role === 'admin') {
        return query(
          collection(firestore, 'users'),
          where('role', '==', adminView === 'telecallers' ? 'sales_executive' : 'sales_team_lead')
        );
    }
    
    return null;
  }, [adminView, currentTeamspace?.id, currentUser, firestore]);

  const { data: firestoreUsers, isLoading: isFirestoreLoading } = useCollection<UserProfile>(usersQuery);
  const { users: rosterUsers, isLoading: isRosterLoading } = useTeamRoster();
  const users = currentUser?.role === 'sales_team_lead' ? rosterUsers : firestoreUsers;
  const isLoading = currentUser?.role === 'sales_team_lead' ? isRosterLoading : isFirestoreLoading;

  const visibleUsers = currentUser?.role === 'sales_team_lead'
    ? (users || []).filter((user) => belongsToTeamLeadTeam(user, currentUser, currentTeamspace))
    : users || [];

  const canCreateUser = currentUser?.role === 'admin';
  const canViewUsers = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';
  const displayLoadingState = isLoading || !currentUser || !canViewUsers;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
                <p className="text-muted-foreground">
                    {currentUser?.role === 'admin'
                      ? adminView === 'telecallers'
                        ? 'Viewing all telecaller profiles only.'
                        : 'Viewing Team Lead profiles only.'
                      : `Viewing your telecallers${currentTeamspace?.name ? ` for ${currentTeamspace.name}` : ''}.`}
                </p>
            </div>
            {canCreateUser && <div className="flex items-center space-x-2">
                <CreateUserDialog 
                  teamspaces={availableTeamspaces || []}
                  isLoadingTeamspaces={areTeamspacesLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Team Member
                    </Button>
                </CreateUserDialog>
            </div>}
        </div>
        {displayLoadingState && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!displayLoadingState && <DataTable columns={columns} data={visibleUsers} />}
    </div>
  );
}
