'use client';

import { useState, useMemo, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Deal, UserProfile, DealStage, Contact, Product, Lead } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateDealDialog } from './create-deal-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Handshake, Users as UsersIcon, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BulkAssignDealsDialog } from './bulk-assign-deals-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const stages: DealStage[] = ['new', 'intrested', 'not connect', 'CNP', 'done', 'not intrested'];

export default function SalesPipelinePage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectCount, setSelectCount] = useState<string>('');
  const [isBulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ROLE PROTECTION: Executives are restricted from the Sales Pipeline
  useEffect(() => {
    if (mounted && !isUserLoading && currentUser?.role === 'sales_executive') {
      router.replace('/dashboard');
    }
  }, [currentUser, isUserLoading, router, mounted]);

  /**
   * HIERARCHICAL QUERY:
   * Admin: All deals in teamspace
   * Team Lead: Deals where teamLeadId == currentUser.id
   * Executive: Restricted (Handled by useEffect redirect)
   */
  const dealsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id || currentUser.role === 'sales_executive') return null;
    const dealsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'deals');
    
    if (currentUser.role === 'admin') {
      return query(dealsRef);
    }
    
    if (currentUser.role === 'sales_team_lead') {
      return query(dealsRef, where('teamLeadId', '==', currentUser.id));
    }
    
    return query(dealsRef, where('ownerId', '==', currentUser.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: rawDeals, isLoading: isLoadingDeals } = useCollection<Deal>(dealsQuery);

  const filteredDeals = useMemo(() => {
    if (!rawDeals) return [];
    if (assigneeFilter === 'all') return rawDeals;
    return rawDeals.filter(d => d.ownerId === assigneeFilter);
  }, [rawDeals, assigneeFilter]);

  const stagedData = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      new: [],
      intrested: [],
      'not connect': [],
      CNP: [],
      done: [],
      'not intrested': []
    };
    filteredDeals.forEach(deal => {
      if (map[deal.stage]) map[deal.stage].push(deal);
    });
    return map;
  }, [filteredDeals]);

  /**
   * SCOPED USER QUERY: Resolves names for assigned specialists
   */
  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    if (currentUser.role === 'admin') {
        const memberIds = currentTeamspace.memberIds || [];
        return memberIds.length > 0 ? query(collection(firestore, 'users'), where(documentId(), 'in', memberIds)) : null;
    }
    
    if (currentUser.role === 'sales_team_lead') {
        return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
    }
    
    return query(collection(firestore, 'users'), where(documentId(), '==', currentUser.id));
  }, [firestore, currentTeamspace?.id, currentTeamspace?.memberIds, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  /**
   * SCOPED METADATA: Required for Lead/Contact name resolution in table
   */
  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentTeamspace ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts')) : null
  , [firestore, currentTeamspace, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentTeamspace || !currentUser) return null;
    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    if (currentUser.role === 'admin' || currentUser.role === 'sales_team_lead') {
        return query(leadsRef);
    }
    
    return query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));
  }, [firestore, currentTeamspace, currentUser, isUserLoading]);
  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const loading = isUserLoading || isLoadingDeals || isLoadingUsers || isLoadingContacts || isLoadingProducts || isLoadingLeads || !mounted;

  const handleSelectionChange = (stage: DealStage, stageDeals: Deal[]) => {
    setSelectedDeals(prev => {
        const otherStages = prev.filter(d => d.stage !== stage);
        return [...otherStages, ...stageDeals];
    });
  };

  const handleSelectN = (stage: DealStage) => {
    const stageDeals = stagedData[stage];
    if (!stageDeals || !selectCount) return;

    let startIndex = 0;
    let endIndex = 0;

    if (selectCount.includes('-')) {
      const parts = selectCount.split('-').map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const start = Math.min(parts[0], parts[1]);
        const end = Math.max(parts[0], parts[1]);
        startIndex = Math.max(1, start) - 1;
        endIndex = Math.min(stageDeals.length, end);
      }
    } else {
      const count = parseInt(selectCount);
      if (!isNaN(count) && count > 0) {
        startIndex = 0;
        endIndex = Math.min(stageDeals.length, count);
      }
    }

    if (endIndex > startIndex) {
      const selected = stageDeals.slice(startIndex, endIndex);
      handleSelectionChange(stage, selected);
    }
  };

  const canManageBulk = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

  if (!mounted || (currentUser?.role === 'sales_executive')) return null;

  return (
    <div className="space-y-8 pb-16 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Handshake className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Revenue Engine</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Sales Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold">Strategic opportunity management.</p>
            </div>
             <div className="flex items-center gap-4">
              <CreateDealDialog contacts={contacts || []} products={products || []} isLoading={loading}>
                  <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                      <PlusCircle className="mr-3 h-6 w-6" />
                      Initiate Deal
                  </Button>
              </CreateDealDialog>
            </div>
        </div>

        {canManageBulk && (
            <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-card border border-primary/5 shadow-xl">
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
                            placeholder="e.g. 1-10" 
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            className="w-24 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
                        />
                        <div className="flex gap-1">
                            {stages.map(s => (
                                <Button key={s} variant="secondary" size="sm" onClick={() => handleSelectN(s)} className="h-10 rounded-xl font-black text-[9px] uppercase tracking-tighter px-3 hover:bg-primary hover:text-white transition-all">
                                    Grab {s}
                                </Button>
                            ))}
                        </div>
                        {selectedDeals.length > 0 && (
                            <Button 
                                className="rounded-xl herbal-gradient shadow-lg px-6 font-bold h-10 ml-4"
                                onClick={() => setBulkAssignOpen(true)}
                            >
                                Delegate {selectedDeals.length} Selected
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        <div className="space-y-12">
            {stages.map(stage => {
                const stageDeals = stagedData[stage];
                const stageTotal = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
                const currentStageSelected = selectedDeals.filter(d => d.stage === stage);
                
                return (
                    <div key={stage} className="space-y-4">
                        <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className="h-3 w-3 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                                <h2 className="text-xl font-black text-primary uppercase tracking-widest">{stage}</h2>
                                <span className="bg-muted px-3 py-1 rounded-full text-[10px] font-black text-muted-foreground uppercase">{stageDeals.length} Opportunities</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                                <Wallet className="h-4 w-4 opacity-40" />
                                <span className="text-lg font-black tracking-tighter">₹{stageTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        
                        <div className="premium-card p-1 bg-card/40 backdrop-blur-2xl border-primary/5 overflow-hidden shadow-2xl">
                            {loading ? (
                                <div className="p-8 space-y-4">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ) : (
                                <DataTable 
                                    columns={columns} 
                                    data={stageDeals} 
                                    users={users || []} 
                                    contacts={contacts || []}
                                    products={products || []}
                                    leads={leads || []}
                                    externalSelection={currentStageSelected}
                                    onSelectionChange={(deals) => handleSelectionChange(stage, deals)}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <BulkAssignDealsDialog 
            open={isBulkAssignOpen}
            onOpenChange={setBulkAssignOpen}
            deals={selectedDeals}
            users={users || []}
        />
    </div>
  );
}
