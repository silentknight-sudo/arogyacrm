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
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter, UserCheck, Loader2, Download, Sparkles, Trash2, Calendar as CalendarIcon, X } from 'lucide-react';
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
} from '@/select';
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

  const isAdminOrTL = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead' || currentUser?.id === '3oC7dLZCUsRpwNEPWlokfSGTmnx1' || currentUser?.email === 'pundhir@arogyabio.com';
  
  const displayFilters = currentUser?.role === 'sales_executive' 
    ? (['all', 'new'] as FilterType[])
    : ALL_FILTERS;

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    if (!currentUser.role) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    
    // Leadership accounts see all leads, specialists see only assigned leads.
    let q = (currentUser.role === 'admin' || currentUser.role === 'sales_team_lead' || currentUser.id === '3oC7dLZCUsRpwNEPWlokfSGTmnx1' || currentUser.email === 'pundhir@arogyabio.com')
      ? query(leadsRef, orderBy('createdAt', 'desc')) 
      : query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id), orderBy('createdAt', 'desc'));

    if (activeFilter === 'fresh_uploads') {
      q = query(q, where('status', '==', 'new'), where('reassigned', '==', false));
    } else if (activeFilter !== 'all') {
      const filterValues: string[] = [activeFilter as string];
      if (activeFilter === 'intrested') filterValues.push('pending', 'interested');
      if (activeFilter === 'CNP') filterValues.push('busy');
      if (activeFilter === 'not intrested') filterValues.push('cancelled', 'canceled', 'not interested');
      
      q = query(q, where('status', 'in', filterValues));
    }
    
    return q;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, activeFilter]);

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

    let startIndex = 0;
    let endIndex = 0;

    if (selectCount.includes('-')) {
      const parts = selectCount.split('-').map(p => parseInt(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
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

  const handleSelfAssign = () => {
    if (!currentUser || !currentTeamspace?.id || selectedLeads.length === 0) return;
    
    startReclaim(async () => {
      const result = await selfAssignLeads({
        leadIds: selectedLeads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Strategic Reclaim Success',
          description: `${selectedLeads.length} prospects have been successfully reclaimed to your personal desk.`,
        });
        setSelectedLeads([]);
      } else {
        toast({ variant: 'destructive', title: 'Reclaim Failed', description: result.error });
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
        toast({
          title: 'Purge Successful',
          description: `Successfully removed ${selectedLeads.length} assets from the database.`,
        });
        setSelectedLeads([]);
        setIsDeleteOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Purge Failed', description: result.error });
      }
    });
  };

  const handleExport = () => {
    const dataToExport = selectedLeads.length > 0 ? selectedLeads : leads || [];
    if (dataToExport.length === 0) {
      toast({ variant: 'destructive', title: 'Export Failed', description: 'No prospects found to export.' });
      return;
    }

    const headers = ['Full Name', 'Email', 'Phone', 'Status', 'Source', 'Created Date'];
    
    const rows = dataToExport.map(lead => {
      const escape = (val: any) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      return [
        escape(lead.fullName),
        escape(lead.email),
        escape(lead.phone),
        escape(lead.status),
        escape(lead.source),
        escape(lead.createdAt)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `arogya_prospects_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Export Successful', description: `${dataToExport.length} prospects prepared.` });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-16 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-primary mb-1">
                    <Target className="h-5 w-5 fill-primary" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Pipeline Terminal</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-[#0f172a]">Prospect Engine</h1>
                <p className="text-2xl text-muted-foreground font-semibold">Strategic asset management.</p>
            </div>
             <div className="flex items-center gap-4">
              {isAdminOrTL && (
                <>
                  <Button variant="outline" onClick={handleExport} className="rounded-2xl border-primary/20 hover:bg-primary/5 px-8 py-7 font-black tracking-tight text-base shadow-sm">
                    <Download className="mr-3 h-5 w-5" />
                    Export CSV
                  </Button>
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

        <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-white border border-primary/5 shadow-2xl">
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
                                {f === 'fresh_uploads' ? (
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Fresh Prospects
                                  </div>
                                ) : f}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="h-10 w-px bg-primary/10 mx-2 hidden lg:block" />

                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[260px] justify-start text-left font-bold rounded-xl h-11 border-none bg-muted/30 hover:bg-muted/50",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest">Temporal Filter</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                      <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
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
                            placeholder="e.g. 1-10" 
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.target.value)}
                            className="w-24 h-10 rounded-xl bg-background border-none shadow-inner text-center font-bold"
                        />
                        <Button variant="secondary" size="sm" onClick={handleSelectNLeads} className="rounded-xl font-bold px-4 h-10">Select</Button>
                        {selectedLeads.length > 0 && (
                            <div className="flex gap-2 ml-2">
                                <Button className="rounded-xl herbal-gradient shadow-lg px-6 font-bold h-10" onClick={() => setBulkAssignOpen(true)}>Delegate {selectedLeads.length}</Button>
                                <Button variant="outline" className="rounded-xl border-primary/20 bg-background hover:bg-primary/5 px-4 font-bold h-10 text-primary flex items-center gap-2" onClick={handleSelfAssign} disabled={isReclaiming}>
                                    {isReclaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                    Reclaim
                                </Button>
                                <Button variant="destructive" className="rounded-xl shadow-lg px-4 font-bold h-10 flex items-center gap-2" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4" />
                                    Purge
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
            <AlertDialogContent className="rounded-[2.5rem] bg-[#0f172a] text-white border-none shadow-2xl p-10">
                <AlertDialogHeader className="mb-6">
                    <AlertDialogTitle className="text-3xl font-black text-[#ef4444]">Strategic Purge</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60 text-lg font-medium">
                        You are about to permanently decommission <span className="text-white font-bold">{selectedLeads.length}</span> prospects. This operation cannot be reversed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-4">
                    <AlertDialogCancel className="h-14 px-8 rounded-xl border-white/10 bg-white/5 text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLeads} className="h-14 px-10 rounded-xl bg-[#ef4444] text-white hover:bg-[#dc2626] font-black shadow-xl" disabled={isDeleting}>
                        Confirm Purge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}