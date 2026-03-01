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

  // Strict authentication and ready-state guard for the leads query
  const leadsQuery = useMemoFirebase(() => 
    (!isUserLoading && currentUser && currentTeamspace?.id)
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  // Strict guard for the team member query
  const usersQuery = useMemoFirebase(() =>
    (!isUserLoading && currentUser && currentTeamspace?.memberIds?.length > 0)
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null,
    [firestore, currentTeamspace?.memberIds, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isActuallyLoading = isUserLoading || isLoadingLeads || isLoadingUsers;

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
                <UploadLeadsDialog users={users || []} isLoading={isActuallyLoading}>
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
        
        {isActuallyLoading ? (
            <div className="space-y-4 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        ) : (
            <DataTable columns={columns} data={leads || []} users={users || []} />
        )}
    </div>
  );
}