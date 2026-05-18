'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile, LeadStatus, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter, Trash2, ShieldAlert } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BulkAssignLeadsDialog } from './bulk-assign-leads-dialog';
import { DeduplicateLeadsDialog } from './deduplicate-leads-dialog';
import { useToast } from '@/hooks/use-toast';
import { selfAssignLeads, deleteLeads } from './actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type FilterType = LeadStatus | 'all' | 'fresh_uploads';
const ALL_FILTERS: FilterType[] = ['all', 'fresh_uploads', 'new', 'intrested', 'CNP', 'done', 'not intrested'];

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectCount, setSelectCount] = useState<string>('');
  const [isBulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [isReclaiming, startReclaim] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdminOrTL = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // STRATEGIC REFACTOR: Equality filters MUST be defined before orderBy in Firestore.
    let constraints: any[] = [];

    // 1. Role-based scoping
    if (!isAdminOrTL) {
        constraints.push(where('assignedToIds', 'array-contains', currentUser.id));
    }

    // 2. Tab-based filtering (Equality)
    if (activeFilter === 'fresh_uploads') {
        constraints.push(where('status', '==', 'new'));
        constraints.push(where('reassigned', '==', false));
    } else if (activeFilter !== 'all') {
        constraints.push(where('status', '==', activeFilter));
    }

    // 3. Sorting (Always at the end)
    constraints.push(orderBy('createdAt', 'desc'));

    return query(leadsRef, ...constraints);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, activeFilter, isAdminOrTL]);

  const { data: rawLeads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const filteredLeads = useMemo(() => {
    if (!rawLeads) return [];
    if (assigneeFilter === 'all') return rawLeads;
    return rawLeads.filter(lead => lead.assignedToIds?.includes(assigneeFilter));
  }, [rawLeads, assigneeFilter]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers || isLoadingProducts || !mounted;

  const handleSelectNLeads = () => {
    if (!filteredLeads || !selectCount) return;
    const count = parseInt(selectCount);
    if (!isNaN(count) && count > 0) {
      const leadsToSelect = filteredLeads.slice(0, Math.min(filteredLeads.length, count));
      setSelectedLeads(leadsToSelect);
    }
  };

  const handleSelfAssign = () => {
    if (!currentUser || !currentTeamspace?.id || selectedLeads.length === 0) return;
    startReclaim(async () => {
      const result = await selfAssignLeads({
        leadIds: selectedLeads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
      });
      if (result.success) {
        toast({ title: 'Reclaim Success', description: `${selectedLeads.length} leads assigned to you.` });
        setSelectedLeads([]);
      }
    });
  };

  const handleDeleteLeads = () => {
    if (!currentUser || !currentTeamspace?.id || selectedLeads.length === 0) return;
    startDelete(async () => {
      const result = await deleteLeads({
        leadIds: selectedLeads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
      });
      if (result.success) {
        toast({ title: 'Purge Success', description: `Deleted ${selectedLeads.length} records.` });
        setSelectedLeads([]);
        setIsDeleteOpen(false);
      }
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-16 pt-4 animate-in fade-in duration-700">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Target className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Strategic Command</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold">Managing High-Intensity Wellness Assets.</p>
            </div>
             <div className="flex items-center gap-4">
              {isAdminOrTL && (
                <>
                  <DeduplicateLeadsDialog />
                  <UploadLeadsDialog users={users || []} isLoading={loading}>
                    <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 px-8 py-7 font-black tracking-tight text-base shadow-sm">
                      <Upload className="mr-3 h-5 w-5" />
                      Bulk Ingest
                    </Button>
                  </UploadLeadsDialog>
                </>
              )}
              <CreateLeadDialog products={products || []} isLoading={loading}>
                  <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                      <PlusCircle className="mr-3 h-6 w-6" />
                      Add Prospect
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-card border border-primary/5 shadow-2xl">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-2">
                        {ALL_FILTERS.map((f) => (
                            <Badge 
                                key={f} 
                                onClick={() => setActiveFilter(f)}
                                className={`cursor-pointer px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none transition-all ${activeFilter === f ? 'bg-primary text-white shadow-lg' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                            >
                                {f.replace(/_/g, ' ')}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {isAdminOrTL && (
                <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                    <div className="flex items-center gap-2 px-3 border-r border-primary/10 mr-2 h-10">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[140px] h-9 rounded-xl bg-background border-none shadow-inner text-[10px] font-black uppercase">
                                <SelectValue placeholder="All Members" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Specialists</SelectItem>
                                {users?.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <Input 
                            type="text" 
                            placeholder="Qty" 
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            className="w-16 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
                        />
                        <Button variant="secondary" size="sm" onClick={handleSelectNLeads} className="rounded-xl font-bold px-4 h-10">Grab</Button>
                        {selectedLeads.length > 0 && (
                            <div className="flex gap-2 ml-2">
                                <Button className="rounded-xl herbal-gradient shadow-lg px-6 font-bold h-10" onClick={() => setBulkAssignOpen(true)}>Delegate {selectedLeads.length}</Button>
                                <Button variant="destructive" className="rounded-xl shadow-lg px-4 font-bold h-10" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        <div className="premium-card p-6 bg-white/40 backdrop-blur-2xl border-primary/5 overflow-hidden shadow-2xl min-h-[400px]">
          {loading ? (
             <div className="space-y-6">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
             </div>
          ) : (
            <DataTable 
                columns={columns} 
                data={filteredLeads} 
                users={users || []} 
                products={products || []}
                externalSelection={selectedLeads}
                onSelectionChange={setSelectedLeads}
            />
          )}
        </div>

        <BulkAssignLeadsDialog open={isBulkAssignOpen} onOpenChange={setBulkAssignOpen} leads={selectedLeads} users={users || []} />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent className="rounded-[2.5rem] bg-card border-none shadow-2xl p-10">
                <AlertDialogHeader className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-destructive/10 rounded-2xl">
                             <ShieldAlert className="h-8 w-8 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-3xl font-black text-primary tracking-tighter">Strategic Purge</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-muted-foreground text-lg font-medium leading-relaxed">
                        Decommission <span className="text-primary font-black">{selectedLeads.length}</span> wellness prospects permanently? This action cannot be reversed within the Arogya ecosystem.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-4">
                    <AlertDialogCancel className="h-14 px-8 rounded-xl border-primary/10 font-bold">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLeads} className="h-14 px-10 rounded-xl bg-destructive text-white hover:bg-destructive/90 font-black shadow-xl" disabled={isDeleting}>
                        {isDeleting ? 'Processing...' : 'Confirm Purge'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}