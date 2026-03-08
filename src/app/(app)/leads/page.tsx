'use client';

import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Sparkles } from 'lucide-react';
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

  // Scalable user discovery: Fetch all users who belong to this teamspace
  const usersQuery = useMemoFirebase(() => {
    return (!isUserLoading && currentUser && currentTeamspace?.id)
        ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) 
        : null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers;

  return (
    <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tight text-primary">Prospect Pipeline</h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {currentUser?.role === 'sales_executive' ? 'Your focus area for today.' : 'Overview of all active opportunities.'}
                </p>
            </div>
             <div className="flex items-center gap-3">
              {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead') && (
                <UploadLeadsDialog users={users || []} isLoading={loading}>
                  <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 px-6 py-6 font-bold">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/20 px-8 py-6 text-base font-bold gold-glow">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Lead
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {loading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-3xl" />
                <Skeleton className="h-[500px] w-full rounded-3xl" />
            </div>
        ) : (
            <div className="premium-card p-2 bg-card/50 backdrop-blur-sm overflow-hidden">
              <DataTable columns={columns} data={leads || []} users={users || []} />
            </div>
        )}
    </div>
  );
}