'use client';

import { useState, useMemo } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Deal, UserProfile, DealStage, Contact, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateDealDialog } from './create-deal-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Handshake, Users as UsersIcon, Wallet, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BulkAssignDealsDialog } from './bulk-assign-deals-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const stages: DealStage[] = ['new', 'pending', 'not connect', 'busy', 'done', 'cancel'];

export default function SalesPipelinePage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectCount, setSelectCount] = useState<string>('');
  const [isBulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);

  const dealsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: rawDeals, isLoading: isLoadingDeals } = useCollection<Deal>(dealsQuery);

  const filteredDeals = useMemo(() => {
    if (!rawDeals) return [];
    if (assigneeFilter === 'all') return rawDeals;
    return rawDeals.filter(d => d.ownerId === assigneeFilter);
  }, [rawDeals, assigneeFilter]);

  // STRATEGIC MEMOIZATION: Separate data sets for each stage table to prevent infinite loops
  const stagedData = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      new: [],
      pending: [],
      'not connect': [],
      busy: [],
      done: [],
      cancel: []
    };
    filteredDeals.forEach(deal => {
      if (map[deal.stage]) map[deal.stage].push(deal);
    });
    return map;
  }, [filteredDeals]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentTeamspace ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts')) : null
  , [firestore, currentTeamspace, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const loading = isUserLoading || isLoadingDeals || isLoadingUsers || isLoadingContacts || isLoadingProducts;

  const handleSelectN = (stage: DealStage) => {
    const count = parseInt(selectCount);
    if (isNaN(count) || count <= 0) return;
    
    const stageDeals = stagedData[stage].slice(0, count);
    setSelectedDeals(prev => {
        const otherStages = prev.filter(d => d.stage !== stage);
        return [...otherStages, ...stageDeals];
    });
  };

  const canManageBulk = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

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
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Quantity:</span>
                        <Input 
                            type="number" 
                            placeholder="Qty" 
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            className="w-20 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
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
                                    externalSelection={selectedDeals}
                                    onSelectionChange={setSelectedDeals}
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
