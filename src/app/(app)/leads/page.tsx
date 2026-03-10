'use client';

import { useState, useMemo, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile, LeadStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BulkAssignLeadsDialog } from './bulk-assign-leads-dialog';

const statusFilters: (LeadStatus | 'all')[] = ['all', 'new', 'pending', 'busy', 'done', 'canceled'];

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectCount, setSelectCount] = useState<string>('');
  const [isBulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    let q = currentUser.role === 'admin' 
      ? query(leadsRef) 
      : query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));

    if (statusFilter !== 'all') {
      q = query(leadsRef, where('status', '==', statusFilter));
    }
    
    return q;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, statusFilter]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(
      collection(firestore, 'users'), 
      where('teamspaceIds', 'array-contains', currentTeamspace.id)
    );
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers;

  const handleSelectNLeads = () => {
    const count = parseInt(selectCount);
    if (isNaN(count) || count <= 0 || !leads) return;
    
    const leadsToSelect = leads.slice(0, count);
    setSelectedLeads(leadsToSelect);
  };

  const canManageBulk = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

  return (
    <div className="space-y-8 pb-16 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Target className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Growth Engine</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold">Strategic lead management.</p>
            </div>
             <div className="flex items-center gap-4">
              {canManageBulk && (
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

        <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-card border border-primary/5 shadow-xl">
            <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-2">
                    {statusFilters.map((f) => (
                        <Badge 
                            key={f} 
                            onClick={() => setStatusFilter(f)}
                            className={`cursor-pointer px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none transition-all ${statusFilter === f ? 'bg-primary text-white shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                        >
                            {f}
                        </Badge>
                    ))}
                </div>
            </div>

            {canManageBulk && (
                <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                    <div className="flex items-center gap-2 px-3">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Quantity:</span>
                    </div>
                    <Input 
                        type="number" 
                        placeholder="e.g. 5" 
                        value={selectCount}
                        onChange={(e) => setSelectCount(e.target.value)}
                        className="w-20 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
                    />
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleSelectNLeads}
                        className="rounded-xl font-bold px-6"
                    >
                        Select Top
                    </Button>
                    {selectedLeads.length > 0 && (
                        <Button 
                            className="rounded-xl herbal-gradient shadow-lg px-6 font-bold"
                            onClick={() => setBulkAssignOpen(true)}
                        >
                            Assign {selectedLeads.length} Selected
                        </Button>
                    )}
                </div>
            )}
        </div>
        
        {loading ? (
            <div className="space-y-8">
                <Skeleton className="h-24 w-full rounded-[2.5rem]" />
                <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
            </div>
        ) : (
            <div className="premium-card p-6 bg-card/40 backdrop-blur-2xl border-primary/5 overflow-hidden shadow-2xl">
              <DataTable 
                columns={columns} 
                data={leads || []} 
                users={users || []} 
                externalSelection={selectedLeads}
                onSelectionChange={setSelectedLeads}
              />
            </div>
        )}

        <BulkAssignLeadsDialog 
            open={isBulkAssignOpen}
            onOpenChange={setBulkAssignOpen}
            leads={selectedLeads}
            users={users || []}
        />
    </div>
  );
}
