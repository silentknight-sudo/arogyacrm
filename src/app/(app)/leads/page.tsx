'use client';

import { useState, useMemo, Suspense, useTransition, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile, LeadStatus, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter, UserCheck, Loader2, Download, Sparkles, Trash2, Calendar as CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type FilterType = LeadStatus | 'all' | 'fresh_uploads';

const ALL_FILTERS: FilterType[] = ['all', 'fresh_uploads', 'new', 'intrested', 'CNP', 'done', 'not intrested'];

export default function LeadsPage() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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

  const isAdminOrTL = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead' || currentUser?.id === '3oC7dLZCUsRpwNEPWlokfSGTmnx1';
  
  const displayFilters = currentUser?.role === 'sales_executive' 
    ? (['all', 'new'] as FilterType[])
    : ALL_FILTERS;

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // Leadership accounts see everything, Specialists see assigned leads
    let q = isAdminOrTL
      ? query(leadsRef, orderBy('createdAt', 'desc')) 
      : query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id), orderBy('createdAt', 'desc'));

    if (activeFilter === 'fresh_uploads') {
      q = query(q, where('status', '==', 'new'), where('reassigned', '==', false));
    } else if (activeFilter !== 'all') {
      q = query(q, where('status', '==', activeFilter));
    }
    
    return q;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, activeFilter, isAdminOrTL]);

  const { data: rawLeads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const leads = useMemo(() => {
    if (!rawLeads) return null;
    let filtered = rawLeads;

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(lead => lead.assignedToIds?.includes(assigneeFilter));
    }

    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      
      filtered = filtered.filter(lead => {
        if (!lead.createdAt) return false;
        const leadDate = lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt);
        return isWithinInterval(leadDate, { start, end });
      });
    }

    return filtered;
  }, [rawLeads, assigneeFilter, dateRange]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const loading = isUserLoading || isLoadingLeads || isLoadingUsers || isLoadingProducts || !mounted;

  const handleSelectNLeads = () => {
    if (!leads || !selectCount) return;
    const count = parseInt(selectCount);
    if (!isNaN(count) && count > 0) {
      const leadsToSelect = leads.slice(0, Math.min(leads.length, count));
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
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
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
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-16 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Target className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Pipeline Velocity</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold">Strategic asset management.</p>
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
                        {displayFilters.map((f) => (
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
                        <Button variant="secondary" size="sm" onClick={handleSelectNLeads} className="rounded-xl font-bold px-4 h-10">Select</Button>
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
        
        <div className="premium-card p-6 bg-white/40 backdrop-blur-2xl border-primary/5 overflow-hidden shadow-2xl">
          <DataTable 
            columns={columns} 
            data={leads || []} 
            users={users || []} 
            products={products || []}
            externalSelection={selectedLeads}
            onSelectionChange={setSelectedLeads}
          />
        </div>

        <BulkAssignLeadsDialog open={isBulkAssignOpen} onOpenChange={setBulkAssignOpen} leads={selectedLeads} users={users || []} />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent className="rounded-[2.5rem] bg-[#0D1F0B] text-white border-none shadow-2xl p-10">
                <AlertDialogHeader className="mb-6">
                    <AlertDialogTitle className="text-3xl font-black text-[#ef4444]">Strategic Purge</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60 text-lg font-medium">
                        Decommission <span className="text-white font-bold">{selectedLeads.length}</span> prospects permanently?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-4">
                    <AlertDialogCancel className="h-14 px-8 rounded-xl border-white/10 bg-white/5 text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLeads} className="h-14 px-10 rounded-xl bg-[#ef4444] text-white hover:bg-[#dc2626] font-black" disabled={isDeleting}>
                        Confirm Purge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}