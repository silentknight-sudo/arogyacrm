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
import { PlusCircle, Upload, Sparkles, Filter } from 'lucide-react';
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

  // Advanced User Discovery: Fetching by teamspace membership
  const usersQuery = useMemoFirebase(() => {
    const hasMembers = currentTeamspace?.memberIds && currentTeamspace.memberIds.length > 0;
    return (!isUserLoading && currentUser && hasMembers)
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null;
  }, [firestore, currentTeamspace?.memberIds, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers;

  return (
    <div className="space-y-10 pb-12">
        <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-5xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
                <p className="text-xl text-muted-foreground font-semibold flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-accent" />
                    {currentUser?.role === 'sales_executive' ? 'Personalized high-intent focus area.' : 'Global overview of team opportunities.'}
                </p>
            </div>
             <div className="flex items-center gap-4">
              {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead') && (
                <UploadLeadsDialog users={users || []} isLoading={loading}>
                  <Button variant="outline" className="rounded-[1.25rem] border-primary/20 hover:bg-primary/5 px-8 py-7 font-black tracking-tight text-base shadow-sm">
                    <Upload className="mr-3 h-5 w-5" />
                    Bulk Import
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button className="rounded-[1.25rem] herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                      <PlusCircle className="mr-3 h-6 w-6" />
                      Add Lead
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {loading ? (
            <div className="space-y-6">
                <Skeleton className="h-20 w-full rounded-[2.5rem]" />
                <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
            </div>
        ) : (
            <div className="premium-card p-3 bg-card/40 backdrop-blur-2xl overflow-hidden border-primary/5">
              <DataTable columns={columns} data={leads || []} users={users || []} />
            </div>
        )}
    </div>
  );
}
