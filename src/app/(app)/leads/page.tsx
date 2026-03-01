'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();

  // Strict guard: only fire query when user and teamspace are fully ready
  const leadsQuery = useMemoFirebase(() => 
    !isUserLoading && currentUser && currentTeamspace 
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const usersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace && currentTeamspace.memberIds?.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null,
    [firestore, currentTeamspace, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingLeads || isLoadingUsers;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">
                    Manage your prospective customers and track their journey.
                </p>
            </div>
             <div className="flex items-center space-x-2">
              {currentUser?.role === 'admin' && (
                <UploadLeadsDialog users={users || []} isLoading={isLoading}>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Lead
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {isLoading && (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={leads || []} users={users || []} />}
    </div>
  );
}