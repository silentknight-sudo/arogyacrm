'use client';

import { useState, useMemo, Suspense } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile, LeadStatus, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BulkAssignLeadsDialog } from './bulk-assign-leads-dialog';
import { DeduplicateLeadsDialog } from './deduplicate-leads-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusFilters: (LeadStatus | 'all')[] = ['all', 'new', 'pending', 'busy', 'done', 'canceled'];

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
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
      q = query(q, where('status', '==', statusFilter));
    }
    
    return q;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, statusFilter]);

  const { data: rawLeads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const leads = useMemo(() => {
    if (!rawLeads) return null;
    if (assigneeFilter === 'all') return rawLeads;
    return rawLeads.filter(lead => lead.assignedToIds?.includes(assigneeFilter));
  }, [rawLeads, assigneeFilter]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    if (currentUser.role === 'admin') {
        return query(
          collection(firestore, 'users'), 
          where('teamspaceIds', 'array-contains', currentTeamspace.id)
        );
    }
    
    if (currentUser.role === 'sales_team_lead') {
        return query(
          collection(firestore, 'users'), 
          where('createdBy', '==', currentUser.id)
        );
    }
    
    return null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers || isLoadingProducts;

  const handleSelectNLeads = () => {
    if (!leads || !selectCount) return;

    let startIndex = 0;
    let endIndex = 0;

    if (selectCount.includes('-')) {
      const parts = selectCount.split('-').map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        // User enters "2-5", meaning 2nd lead to 5th lead inclusive (Indices 1 to 5)
        const start = Math.min(parts[0], parts[1]);
        const end = Math.max(parts[0], parts[1]);
        startIndex = Math.max(1, start) - 1;
        endIndex = Math.min(leads.length, end);
      }
    } else {
      const count = parseInt(selectCount);
      if (!isNaN(count) && count > 0) {
        startIndex = 0;
        endIndex = Math.min(leads.length, count);
      }
    }

    if (endIndex > startIndex) {
      const leadsToSelect = leads.slice(startIndex, endIndex);
      setSelectedLeads(leadsToSelect);
    }
  };

  const isAdminOrTL = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

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
              {isAdminOrTL && (
                <>
                  <DeduplicateLeadsDialog />
                  <UploadLeadsDialog users={users || []} isLoading={loading}>
                    <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 px-8 py-7 font-black tracking-tight text-base shadow-sm">
                      <Upload className="mr-3 h-5 w-5" />
                      Bulk Import
                    </Button>
                  </UploadLeadsDialog>
                </>
              )}
              <Suspense fallback={<Button className="rounded-2xl herbal-gradient px-10 py-7 text-lg font-black opacity-50" disabled>Loading...</Button>}>
                <CreateLeadDialog products={products || []} isLoading={loading}>
                    <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                        <PlusCircle className="mr-3 h-6 w-6" />
                        Add Prospect
                    </Button>
                </CreateLeadDialog>
              </Suspense>
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

            {isAdminOrTL && (
                <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                    <div className="flex items-center gap-2 px-3 border-r border-primary/10 mr-2 h-10">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter Specialist:</span>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[160px] h-9 rounded-xl bg-background border-none shadow-inner text-[10px] font-black uppercase tracking-tighter">
                                <SelectValue placeholder="All Members" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Specialists</SelectItem>
                                {users?.map((u) => (
                                    <SelectItem key={u.id} value={u.id} className="text-[10px] font-black uppercase tracking-widest">{u.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Range / Qty:</span>
                        <Input 
                            type="text" 
                            placeholder="e.g. 1-10 or 5" 
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            className="w-32 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
                        />
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleSelectNLeads}
                            className="rounded-xl font-bold px-6 h-10"
                        >
                            Select
                        </Button>
                        {selectedLeads.length > 0 && (
                            <Button 
                                className="rounded-xl herbal-gradient shadow-lg px-6 font-bold h-10 ml-4"
                                onClick={() => setBulkAssignOpen(true)}
                            >
                                Assign {selectedLeads.length} Selected
                            </Button>
                        )}
                    </div>
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
                products={products || []}
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
