'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
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
import { getLeadStatusLabel } from '@/lib/status-labels';
import { matchesRoleAwareLeadStage } from '@/lib/role-lead-stage';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';
import { useTeamRoster } from '@/hooks/use-team-roster';

type RoleAwareFilter = 'fresh_uploads' | 'pending' | Exclude<LeadStatus, 'new'>;
type FilterType = RoleAwareFilter | 'default';
type VisibleFilterType = Exclude<FilterType, 'default'>;
const ALL_FILTERS: VisibleFilterType[] = ['fresh_uploads', 'pending', 'intrested', 'CNP', 'done', 'not intrested'];

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('default');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('direct');
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

  useEffect(() => {
    const requestedStatus = searchParams.get('status');
    if (!requestedStatus) return;

    if (requestedStatus === 'fresh_uploads' || requestedStatus === 'pending') {
      setActiveFilter('fresh_uploads');
      if (requestedStatus === 'pending') setActiveFilter('pending');
      return;
    }

    if (ALL_FILTERS.includes(requestedStatus as VisibleFilterType)) {
      setActiveFilter(requestedStatus as VisibleFilterType);
    }
  }, [searchParams]);

  const isAdminOrTL = useMemo(
    () => currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead',
    [currentUser]
  );

  const leadsQuery = useMemoFirebase(() => {
    if (!mounted || isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    const constraints: any[] = [];

    if (activeFilter === 'fresh_uploads' || activeFilter === 'pending') {
      constraints.push(where('status', '==', 'new'));
    } else if (activeFilter !== 'default') {
      constraints.push(where('status', '==', activeFilter));
    }

    if (currentUser.role === 'admin') {
      if (assigneeFilter !== 'direct') {
        constraints.push(where('assignedToIds', 'array-contains', assigneeFilter));
      }
    } else if (currentUser.role === 'sales_team_lead') {
      const directAssigneeId = assigneeFilter === 'direct' ? currentUser.id : assigneeFilter;
      constraints.push(where('assignedToIds', 'array-contains', directAssigneeId));
    } else {
      constraints.push(where('assignedToIds', 'array-contains', currentUser.id));
    }

    return query(leadsRef, ...constraints);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, activeFilter, assigneeFilter, mounted]);

  const { data: rawLeads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;

    if (currentUser.role === 'sales_executive') {
      return query(collection(firestore, 'users'), where(documentId(), '==', currentUser.id));
    }

    if (currentUser.role === 'sales_team_lead') return null;

    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: firestoreUsers, isLoading: isFirestoreUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { users: rosterUsers, isLoading: isRosterLoading } = useTeamRoster();
  const users = currentUser?.role === 'sales_team_lead' ? rosterUsers : firestoreUsers;
  const isLoadingUsers = currentUser?.role === 'sales_team_lead' ? isRosterLoading : isFirestoreUsersLoading;

  const stageUsers = useMemo(
    () => {
      if (!currentUser) return users || [];
      const visibleUsers = currentUser.role === 'sales_team_lead'
        ? (users || []).filter((user) => belongsToTeamLeadTeam(user, currentUser, currentTeamspace))
        : (users || []).filter((user) => user.id !== currentUser.id);

      return [currentUser, ...visibleUsers];
    },
    [currentTeamspace, currentUser, users]
  );

  const filteredLeads = useMemo(() => {
    if (!rawLeads) return [];

    let leads = rawLeads;

    if (currentUser?.role === 'admin' && assigneeFilter === 'direct') {
      leads = leads.filter(lead => !lead.assignedToIds || lead.assignedToIds.length === 0 || lead.assignedToIds.includes(currentUser.id));
    }

    if (activeFilter === 'fresh_uploads' || activeFilter === 'pending') {
      leads = leads.filter((lead) => matchesRoleAwareLeadStage(lead, activeFilter, currentUser, stageUsers, currentTeamspace));
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

    return leads.slice().sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [rawLeads, currentUser, assigneeFilter, dateRange, activeFilter, stageUsers, currentTeamspace]);

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
        toast({ title: 'Lead cleanup complete', description: `Permanently removed ${selectedLeads.length} leads.` });
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
          <h1 className="text-7xl font-black tracking-tighter text-primary">Leads</h1>
          <p className="text-2xl text-muted-foreground font-semibold">Managing active lead operations.</p>
        </div>
        <div className="flex items-center gap-4">
          {currentUser?.role === 'admin' && (
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
              Add Lead
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
                  {f === 'fresh_uploads' ? 'New Leads' : f === 'pending' ? 'Pending' : getLeadStatusLabel(f)}
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
                  <SelectValue placeholder={currentUser?.role === 'admin' ? 'Admin Lead Pool' : 'Assigned To Me'} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="direct" className="text-[11px] font-black uppercase">
                    {currentUser?.role === 'admin' ? 'Admin Lead Pool' : 'Assigned To Me'}
                  </SelectItem>
                  {(users || [])
                    .filter((u) => {
                      if (currentUser?.role === 'admin') return u.role === 'sales_team_lead';
                      if (currentUser?.role === 'sales_team_lead') {
                        return belongsToTeamLeadTeam(u, currentUser, currentTeamspace);
                      }
                      return false;
                    })
                    .map((u) => (
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
                  {currentUser?.role === 'admin' && (
                    <Button variant="destructive" className="rounded-xl shadow-lg px-5 font-black h-11" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
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
              Delete <span className="text-foreground font-bold">{selectedLeads.length}</span> leads permanently?
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
