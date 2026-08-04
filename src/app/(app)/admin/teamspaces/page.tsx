'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Teamspace } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/app-context';

export default function TeamspaceManagementPage() {
  const firestore = useFirestore();
  const { currentUser } = useApp();

  const teamspacesQuery = useMemoFirebase(() => 
    currentUser?.role === 'admin'
      ? query(collection(firestore, 'teamspaces'))
      : null
  , [firestore, currentUser]);

  const { data: teamspaces, isLoading } = useCollection<Teamspace>(teamspacesQuery);

  const displayLoadingState = isLoading || !currentUser || currentUser.role !== 'admin';

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Teamspace Management</h1>
                <p className="text-muted-foreground">
                    Single workspace mode is active. All teams now operate inside the shared SLT workspace.
                </p>
            </div>
        </div>
        {displayLoadingState && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!displayLoadingState && <DataTable columns={columns} data={teamspaces || []} />}
    </div>
  );
}
