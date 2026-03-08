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

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    if (currentUser.role === 'sales_executive') {
      return query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));
    }
    
    return query(leadsRef);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const usersQuery = useMemoFirebase(() => {
    const memberIds = currentTeamspace?.memberIds;
    // Robust check for memberIds existence and length to prevent TypeScript build errors
    const hasMembers = Array.isArray(memberIds) && memberIds.length > 0;
    
    return (!isUserLoading && currentUser && hasMembers)
        ? query(collection(firestore, 'users'), where(documentId(), 'in', memberIds)) 
        : null;
  }, [firestore, currentTeamspace?.memberIds, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isActuallyLoading = isUserLoading || isLoadingLeads || isLoadingUsers;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-primary">Leads</h1>
                <p className="text-muted-foreground">
                    {currentUser?.role === 'sales_executive' 
                      ? 'Your assigned prospective customers.' 
                      : 'Manage and track prospective customers.'}
                </p>
            </div>
             <div className="flex items-center gap-3">
              {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead') && (
                <UploadLeadsDialog users={users || []} isLoading={isActuallyLoading}>
                  <Button variant="outline" className="shadow-sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button className="shadow-lg shadow-primary/20">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Lead
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {isActuallyLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        ) : (
            <div className="premium-card rounded-2xl p-1 bg-card/50 backdrop-blur-sm">
              <DataTable columns={columns} data={leads || []} users={users || []} />
            </div>
        )}
    </div>
  );
}