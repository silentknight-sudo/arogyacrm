'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserDialog } from './create-user-dialog';
import { useApp } from '@/context/app-context';

export default function UserManagementPage() {
  const firestore = useFirestore();
  const { availableTeamspaces, areTeamspacesLoading, currentUser } = useApp();

  const usersQuery = useMemoFirebase(() => 
    currentUser?.role === 'admin'
      ? query(collection(firestore, 'users'))
      : null
  , [firestore, currentUser]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const displayLoadingState = isLoading || !currentUser || currentUser.role !== 'admin';

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Create and manage users and their roles.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateUserDialog 
                  teamspaces={availableTeamspaces || []}
                  isLoadingTeamspaces={areTeamspacesLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </CreateUserDialog>
            </div>
        </div>
        {displayLoadingState && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!displayLoadingState && <DataTable columns={columns} data={users || []} />}
    </div>
  );
}
