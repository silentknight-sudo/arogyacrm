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
import { PlusCircle, Upload, Sparkles, Target } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();

  // 1. Prospect Query with Robust Guard
  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    if (currentUser.role === 'sales_executive') {
      return query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));
    }
    return query(leadsRef);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  // 2. Scalable User Discovery Query (Bypasses 30-ID limit)
  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(
      collection(firestore, 'users'), 
      where('teamspaceIds', 'array-contains', currentTeamspace.id)
    );
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers;

  return (
    <div className="space-y-12 pb-16 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Target className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Growth Engine</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                    {currentUser?.role === 'sales_executive' ? 'High-intent individuals assigned to you.' : 'Team-wide opportunity visualization.'}
                </p>
            </div>
             <div className="flex items-center gap-4">
              {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead') && (
                <UploadLeadsDialog users={users || []} isLoading={loading}>
                  <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 px-8 py-7 font-black tracking-tight text-base shadow-sm">
                    <Upload className="mr-3 h-5 w-5" />
                    Bulk Import
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                      <PlusCircle className="mr-3 h-6 w-6" />
                      Add Prospect
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {loading ? (
            <div className="space-y-8">
                <Skeleton className="h-24 w-full rounded-[2.5rem]" />
                <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
            </div>
        ) : (
            <div className="premium-card p-6 bg-card/40 backdrop-blur-2xl border-primary/5 overflow-hidden shadow-2xl">
              <DataTable columns={columns} data={leads || []} users={users || []} />
            </div>
        )}
    </div>
  );
}
