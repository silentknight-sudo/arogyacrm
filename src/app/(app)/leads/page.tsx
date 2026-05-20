'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, documentId } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile, LeadStatus, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Target, Users as UsersIcon, Filter, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BulkAssignLeadsDialog } from './bulk-assign-leads-dialog';
import { DeduplicateLeadsDialog } from './deduplicate-leads-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteLeads } from './actions';
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
  const [isDeleting, startDelete] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdminOrTL = useMemo(
    () => currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead',
    [currentUser]
  );

  const leadsQuery = useMemoFirebase(() => {
    if (!mounted || isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    const constraints: any[] = [];

    if (activeFilter === 'fresh_uploads') {
      constraints.push(where('status', '==', 'new'));
      constraints.push(where('reassigned', '==', false));
    } else if (activeFilter !== 'all') {
      constraints.push(where('status', '==', activeFilter));
    }

    if (!isAdminOrTL) {
      constraints.push(where('assignedToIds', 'array-contains', currentUser.id));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    return query(leadsRef, ...constraints);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, activeFilter, isAdminOrTL, mounted]);

  const { data: rawLeads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const filteredLeads = useMemo(() => {
    if (!rawLeads) return [];

    let leads = rawLeads;

    if (assigneeFilter !== 'all') {
      leads = leads.filter(lead => lead.assignedToIds?.includes(assigneeFilter));
    }

    if (dateRange?.from) {
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

      leads = leads.filter(lead => {
        if (!lead.createdAt) return false;
        const leadDate = lead.createdAt.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt);
        return isWithinInterval(leadDate, { start, end });
      });
    }

    return leads;
  }, [rawLeads, assigneeFilter, dateRange]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    if (currentUser.role === 'sales_executive') {
      return query(collection(firestore, 'users'), where(documentId(), '==', currentUser.id));
    }

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

  const handleDeleteLeads = () => {
    if (!currentUser || !currentTeamspace?.id || selectedLeads.length === 0) return;
    startDelete(async () => {
      const result = await deleteLeads({
        leadIds: selectedLeads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
      });
      if (result.success) {
        toast({ title: 'Strategic Purge Success', description: `Permanently removed ${selectedLeads.length} prospects.` });
        setSelectedLeads([]);
        setIsDeleteOpen(false);
      }
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-16 pt-4 animate-in fade-in duration-700">
      <div className="flex items-end justify-between flex-wrap gap-8 px-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-accent mb-1">
            <Target className="h-6 w-6 fill-accent" />
            <span className="text-xs font-black uppercase tracking-[0.4em] opacity-70">Strategic Command</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-primary">Prospect Pipeline</h1>
          <p className="text-2xl text-muted-foreground font-semibold">Managing High-Intensity Wellness Assets.</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdminOrTL && (
            <>
              <DeduplicateLeadsDialog />
              <UploadLeadsDialog users={users || []} isLoading={loading}>
                <Button variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 px-8 py-8 font-black tracking-tight text-base shadow-sm">
                  <Upload className="mr-3 h-5 w-5" />
                  Bulk Ingest
                </Button>
              </UploadLeadsDialog>
            </>
          )}
          <CreateLeadDialog products={products || []} isLoading={loading}>
            <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-12 py-8 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
              <PlusCircle className="mr-3 h-7 w-7" />
              Add Prospect
            </Button>
          </CreateLeadDialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 p-8 rounded-[3rem] bg-card border border-primary/10 shadow-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-primary/40" />
            <div className="flex flex-wrap gap-3">
              {ALL_FILTERS.map((f) => (
                <Badge
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`cursor-pointer px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border-none transition-all ${activeFilter === f ? 'bg-primary text-white shadow-lg scale-105' : 'bg-muted/80 text-muted-foreground hover:bg-muted'}`}
                >
                  {f.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'rounded-2xl border-primary/10 bg-background/70 px-4 h-10 font-bold',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                    : format(dateRange.from, 'MMM dd, yyyy')
                  : 'Date Filter'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              <div className="flex justify-end border-t p-3">
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {isAdminOrTL && (
          <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-primary/5">
            <div className="flex items-center gap-2 px-3 border-r border-primary/10 mr-2 h-10">
              <UsersIcon className="h-4 w-4 text-primary" />
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl bg-background border-none shadow-inner text-[11px] font-black uppercase tracking-tight">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all" className="text-[11px] font-black uppercase">All Specialists</SelectItem>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-[11px] font-black uppercase">{u.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pr-2">
              <Input
                type="text"
                placeholder="Qty"
                value={selectCount}
                onChange={(e) => setSelectCount(e.target.value)}
                className="w-20 h-11 rounded-xl bg-background border-none shadow-inner text-center font-black text-lg"
              />
              <Button variant="secondary" size="sm" onClick={handleSelectNLeads} className="rounded-xl font-black uppercase tracking-widest px-6 h-11">
                Grab
              </Button>
              {selectedLeads.length > 0 && (
                <div className="flex gap-2 ml-4">
                  <Button className="rounded-xl herbal-gradient shadow-lg px-8 font-black h-11 uppercase tracking-widest text-[11px]" onClick={() => setBulkAssignOpen(true)}>
                    Delegate {selectedLeads.length}
                  </Button>
                  <Button variant="destructive" className="rounded-xl shadow-lg px-5 font-black h-11" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="premium-card p-1 bg-white/40 backdrop-blur-2xl border-primary/10 overflow-hidden shadow-2xl min-h-[500px]">
        {loading ? (
          <div className="p-12 space-y-8">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
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
        <AlertDialogContent className="rounded-[2.5rem] bg-card text-card-foreground border border-border shadow-2xl p-10">
          <AlertDialogHeader className="mb-6">
            <AlertDialogTitle className="text-3xl font-black text-destructive">Strategic Purge</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-lg font-medium">
              Decommission <span className="text-foreground font-bold">{selectedLeads.length}</span> prospects permanently?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="h-14 px-8 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLeads}
              className="h-14 px-10 rounded-xl bg-[#ef4444] text-white hover:bg-[#dc2626] font-black"
              disabled={isDeleting}
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}