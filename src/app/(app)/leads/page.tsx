'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function LeadsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(() => 
    currentTeamspace 
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
      : null
  , [firestore, currentTeamspace]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">
                    Manage your prospective customers and track their journey.
                </p>
            </div>
             <CreateLeadDialog>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Lead
                </Button>
            </CreateLeadDialog>
        </div>
        
        {isLoading && (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={leads || []} />}
    </div>
  );
}
