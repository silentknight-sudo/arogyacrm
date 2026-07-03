'use client';

import { useMemo, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, orderBy, query, where } from 'firebase/firestore';
import { Search, Trash2, Users, PhoneCall, UserCheck, History, Filter } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { deleteCampaign } from '../actions';
import { bulkAssignLeads } from '@/app/(app)/leads/actions';
import type { Campaign, CampaignLead, Lead, LeadStatus, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { getLeadStatusLabel, LEAD_STATUS_ORDER } from '@/lib/status-labels';
import { getRoleLabel } from '@/lib/user-labels';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-background p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-primary">{value}</p>
    </div>
  );
}

export default function CampaignDetailPage() {
  const { currentTeamspace, currentUser } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ campaignId: string }>();
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [assignmentTarget, setAssignmentTarget] = useState('');
  const [isPending, startTransition] = useTransition();
  const campaignId = Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId;

  const campaignRef = useMemoFirebase(() => (
    currentTeamspace?.id && campaignId
      ? doc(firestore, 'teamspaces', currentTeamspace.id, 'campaigns', campaignId)
      : null
  ), [campaignId, currentTeamspace?.id, firestore]);

  const campaignLeadsQuery = useMemoFirebase(() => (
    currentTeamspace?.id && campaignId
      ? query(
          collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'),
          where('campaignId', '==', campaignId),
          orderBy('createdAt', 'desc')
        )
      : null
  ), [campaignId, currentTeamspace?.id, firestore]);

  const landingLeadsQuery = useMemoFirebase(() => (
    currentTeamspace?.id && campaignId
      ? query(
          collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns', campaignId, 'landingLeads'),
          orderBy('createdAt', 'desc')
        )
      : null
  ), [campaignId, currentTeamspace?.id, firestore]);

  const usersQuery = useMemoFirebase(() => (
    currentTeamspace?.id
      ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id))
      : null
  ), [currentTeamspace?.id, firestore]);

  const { data: campaign, isLoading: loadingCampaign } = useDoc<Campaign>(campaignRef);
  const { data: leads, isLoading: loadingLeads } = useCollection<Lead>(campaignLeadsQuery);
  const { data: landingLeads, isLoading: loadingLandingLeads } = useCollection<CampaignLead>(landingLeadsQuery);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const employeeOptions = useMemo(
    () => (users || []).filter((user) => user.role === 'sales_executive' || user.role === 'sales_team_lead'),
    [users]
  );

  const filteredLeads = useMemo(() => {
    const leadList = leads || [];
    return leadList.filter((lead) => {
      const searchValue = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        lead.fullName.toLowerCase().includes(searchValue) ||
        lead.phone.toLowerCase().includes(searchValue) ||
        (lead.email || '').toLowerCase().includes(searchValue);

      const matchesAssignee =
        assigneeFilter === 'all' || lead.assignedToIds?.includes(assigneeFilter);

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

      return matchesSearch && matchesAssignee && matchesStatus;
    });
  }, [assigneeFilter, leads, searchTerm, statusFilter]);

  const selectedLeads = useMemo(
    () => filteredLeads.filter((lead) => selectedLeadIds.includes(lead.id)),
    [filteredLeads, selectedLeadIds]
  );

  const summary = useMemo(() => {
    const leadList = leads || [];
    return {
      total: leadList.length,
      captured: landingLeads?.length || 0,
      pending: leadList.filter((lead) => lead.status === 'new').length,
      completed: leadList.filter((lead) => lead.status === 'done').length,
      rejected: leadList.filter((lead) => lead.status === 'not intrested').length,
      holding: leadList.filter((lead) => lead.status === 'intrested').length,
      notConnected: leadList.filter((lead) => lead.status === 'CNP').length,
    };
  }, [landingLeads, leads]);

  const memberStats = useMemo(() => {
    return employeeOptions
      .map((user) => {
        const userLeads = (leads || []).filter((lead) => lead.assignedToIds?.includes(user.id));
        return {
          user,
          total: userLeads.length,
          pending: userLeads.filter((lead) => lead.status === 'new').length,
          completed: userLeads.filter((lead) => lead.status === 'done').length,
          notConnected: userLeads.filter((lead) => lead.status === 'CNP').length,
          holding: userLeads.filter((lead) => lead.status === 'intrested').length,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.pending - a.pending || b.total - a.total);
  }, [employeeOptions, leads]);

  const handleToggleLead = (leadId: string, checked: boolean) => {
    setSelectedLeadIds((current) => (
      checked ? Array.from(new Set([...current, leadId])) : current.filter((id) => id !== leadId)
    ));
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedLeadIds(checked ? filteredLeads.map((lead) => lead.id) : []);
  };

  const handleAssign = () => {
    if (!currentTeamspace?.id || !currentUser?.id || !assignmentTarget || selectedLeads.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Assignment blocked',
        description: 'Select leads and choose an employee before assigning.',
      });
      return;
    }

    startTransition(async () => {
      const result = await bulkAssignLeads({
        leadIds: selectedLeads.map((lead) => lead.id),
        teamspaceId: currentTeamspace.id,
        newAssignedToIds: [assignmentTarget],
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Leads reassigned',
          description: `${selectedLeads.length} campaign leads moved successfully.`,
        });
        setSelectedLeadIds([]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Assignment failed',
          description: result.error,
        });
      }
    });
  };

  const handleDeleteCampaign = () => {
    if (!currentTeamspace?.id || !campaignId || !campaign) return;
    const confirmed = window.confirm(`Delete campaign "${campaign.name}"?`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCampaign({
        teamspaceId: currentTeamspace.id,
        campaignId,
      });

      if (result.success) {
        toast({ title: 'Campaign deleted', description: 'Campaign removed successfully.' });
        router.push('/campaigns');
      } else {
        toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
      }
    });
  };

  if (loadingCampaign || loadingLeads || loadingLandingLeads || loadingUsers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-muted-foreground">Campaign not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="premium-card">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl font-black text-primary">{campaign.name}</CardTitle>
              <Badge variant="secondary">{campaign.status}</Badge>
              <Badge variant="outline">{campaign.type}</Badge>
            </div>
            <CardDescription className="max-w-3xl text-base font-medium">
              {campaign.description || 'Operational campaign dashboard for telecaller assignments and live lead handling.'}
            </CardDescription>
          </div>
          <Button variant="destructive" className="rounded-xl" disabled={isPending} onClick={handleDeleteCampaign}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Campaign
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total Leads" value={summary.total} />
          <MetricCard label="Pending" value={summary.pending} />
          <MetricCard label="Completed" value={summary.completed} />
          <MetricCard label="Rejected" value={summary.rejected} />
          <MetricCard label="Holding" value={summary.holding} />
          <MetricCard label="Not Connected" value={summary.notConnected} />
        </CardContent>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_1.4fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black text-primary">
              <Users className="h-5 w-5" />
              Telecaller Workload
            </CardTitle>
            <CardDescription className="font-medium">
              Pending and completed distribution by employee, similar to the operator view shown in the video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberStats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/15 p-6 text-sm font-medium text-muted-foreground italic">
                No campaign leads are assigned yet.
              </div>
            ) : (
              memberStats.map((item) => (
                <div key={item.user.id} className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-primary">{item.user.displayName}</p>
                      <p className="text-xs font-medium text-muted-foreground">{item.user.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{getRoleLabel(item.user.role)}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold xl:grid-cols-4">
                    <div className="rounded-xl bg-background p-3">Total: {item.total}</div>
                    <div className="rounded-xl bg-background p-3">Pending: {item.pending}</div>
                    <div className="rounded-xl bg-background p-3">Done: {item.completed}</div>
                    <div className="rounded-xl bg-background p-3">NC: {item.notConnected}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black text-primary">
              <PhoneCall className="h-5 w-5" />
              Customer Search And Reassignment
            </CardTitle>
            <CardDescription className="font-medium">
              Search by number or name, filter by telecaller and status, then directly assign selected leads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search customer number, name, or email"
                  className="pl-9"
                />
              </div>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All telecallers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All telecallers</SelectItem>
                  {employeeOptions.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | LeadStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LEAD_STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>{getLeadStatusLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <Select value={assignmentTarget} onValueChange={setAssignmentTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee for reassignment" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssign} disabled={isPending || selectedLeads.length === 0 || !assignmentTarget} className="rounded-xl herbal-gradient">
                <UserCheck className="mr-2 h-4 w-4" />
                Assign {selectedLeads.length || ''} Leads
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-primary/10">
              <div className="grid grid-cols-[52px_1.3fr_1fr_0.9fr_0.9fr] gap-3 border-b bg-muted/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <div>
                  <Checkbox
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onCheckedChange={(checked) => handleToggleAll(Boolean(checked))}
                    aria-label="Select all campaign leads"
                  />
                </div>
                <div>Customer</div>
                <div>Status</div>
                <div>Assigned</div>
                <div>History</div>
              </div>
              <div className="max-h-[460px] overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-muted-foreground">
                    No campaign leads matched these filters.
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const assignedUserNames = (users || [])
                      .filter((user) => lead.assignedToIds?.includes(user.id))
                      .map((user) => user.displayName)
                      .join(', ');

                    return (
                      <div key={lead.id} className="grid grid-cols-[52px_1.3fr_1fr_0.9fr_0.9fr] gap-3 border-b px-4 py-4 text-sm">
                        <div className="pt-1">
                          <Checkbox
                            checked={selectedLeadIds.includes(lead.id)}
                            onCheckedChange={(checked) => handleToggleLead(lead.id, Boolean(checked))}
                            aria-label={`Select ${lead.fullName}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-primary">{lead.fullName}</p>
                          <p className="font-medium text-muted-foreground">{lead.phone}</p>
                          <p className="truncate text-xs text-muted-foreground">{lead.email || lead.source || 'No source'}</p>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="secondary">{getLeadStatusLabel(lead.status)}</Badge>
                          <p className="text-xs text-muted-foreground">{lead.reassigned ? 'Reassigned lead' : 'Original allocation'}</p>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {assignedUserNames || 'Unassigned'}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1 font-semibold text-foreground">
                            <History className="h-3.5 w-3.5" />
                            {lead.statusHistory?.length || 0} updates
                          </div>
                          <p>{lead.notes || 'No customer history yet.'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black text-primary">
            <Filter className="h-5 w-5" />
            Campaign Intake Snapshot
          </CardTitle>
          <CardDescription className="font-medium">
            Imported operational leads versus raw landing entries captured for this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Landing Captured" value={summary.captured} />
          <MetricCard label="Imported To CRM" value={summary.total} />
          <MetricCard
            label="Still In Landing Queue"
            value={Math.max((landingLeads?.length || 0) - summary.total, 0)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
