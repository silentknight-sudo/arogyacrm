'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Teamspace } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTeamspaceDialog } from './create-teamspace-dialog';

export default function TeamspaceManagementPage() {
  const firestore = useFirestore();

  const teamspacesQuery = useMemoFirebase(() => 
    query(collection(firestore, 'teamspaces'))
  , [firestore]);

  const { data: teamspaces, isLoading } = useCollection<Teamspace>(teamspacesQuery);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Teamspace Management</h1>
                <p className="text-muted-foreground">
                    Create and manage workspaces for your teams.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateTeamspaceDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Teamspace
                    </Button>
                </CreateTeamspaceDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={teamspaces || []} />}
    </div>
  );
}
