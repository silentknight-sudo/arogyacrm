'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { collection, collectionGroup, documentId, query, where } from 'firebase/firestore';
import { addDays, addMonths, addYears, isAfter } from 'date-fns';
import { BarChart3, CalendarDays, CheckCircle2, CirclePause, Package, PhoneOff, ShieldX, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Campaign, Lead, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getLeadStatusLabel } from '@/lib/status-labels';
import { getProfessionalEmployeeId, getRoleLabel } from '@/lib/user-labels';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';
import { useTeamRoster } from '@/hooks/use-team-roster';

type StageSummary = {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
  holding: number;
  notConnected: number;
};

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

function getStageSummary(leads: Lead[]): StageSummary {
  return {
    total: leads.length,
    pending: leads.filter((lead) => lead.status === 'new').length,
    completed: leads.filter((lead) => lead.status === 'done').length,
    rejected: leads.filter((lead) => lead.status === 'not intrested').length,
    holding: leads.filter((lead) => lead.status === 'intrested').length,
    notConnected: leads.filter((lead) => lead.status === 'CNP').length,
  };
}

function getLeadDate(lead: Lead): Date | null {
  const source = lead.updatedAt || lead.createdAt;
  if (!source) return null;
  return source.toDate ? source.toDate() : new Date(source);
}

function filterLeadsByPeriod(leads: Lead[], period: PeriodFilter) {
  if (period === 'custom') return leads;
  const now = new Date();
  const start =
    period === 'today'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : period === 'week'
        ? addDays(now, -7)
        : period === 'month'
          ? addMonths(now, -1)
          : addYears(now, -1);

  return leads.filter((lead) => {
    const date = getLeadDate(lead);
    return date ? isAfter(date, start) : false;
  });
}

function StageChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CheckCircle2;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-semibold text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

function TrackerMetric({
  label,
  value,
  icon: Icon,
  accent,
  detail,
}: {
  label: string;
  value: number;
  icon: typeof CheckCircle2;
  accent: string;
  detail: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5 transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${accent}`} />
      <CardContent className="relative flex items-center gap-5 p-6">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] ${accent} shadow-inner`}>
          <Icon className="h-8 w-8 text-white drop-shadow" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-muted-foreground">{label}</p>
          <p className="mt-1 text-4xl font-black tracking-tight text-primary">{value}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign, leads }: { campaign: Campaign; leads: Lead[] }) {
  const summary = getStageSummary(leads);
  const completion = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block">
      <Card className="h-full rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-lg font-black text-primary">{campaign.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0">{campaign.status}</Badge>
          </div>
          <CardDescription className="line-clamp-1 font-medium">
            {campaign.productName || campaign.type || 'Campaign'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Completed</span>
              <span className="text-xs font-black text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <StageChip label={getLeadStatusLabel('new')} value={summary.pending} icon={Users} />
            <StageChip label={getLeadStatusLabel('done')} value={summary.completed} icon={CheckCircle2} />
            <StageChip label={getLeadStatusLabel('not intrested')} value={summary.rejected} icon={ShieldX} />
            <StageChip label={getLeadStatusLabel('intrested')} value={summary.holding} icon={CirclePause} />
            <div className="col-span-2">
              <StageChip label={getLeadStatusLabel('CNP')} value={summary.notConnected} icon={PhoneOff} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total Leads</span>
            <span className="text-2xl font-black text-primary">{summary.total}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProductCard({ productName, leads }: { productName: string; leads: Lead[] }) {
  const summary = getStageSummary(leads);
  const completion = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <Card className="h-full overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5">
      <CardHeader className="relative">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <CardTitle className="line-clamp-2 text-2xl font-black text-primary">{productName}</CardTitle>
            <CardDescription className="mt-1 font-semibold">Product-wise lead status</CardDescription>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Completed</span>
            <span className="text-sm font-black text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StageChip label={getLeadStatusLabel('new')} value={summary.pending} icon={Users} />
          <StageChip label={getLeadStatusLabel('done')} value={summary.completed} icon={CheckCircle2} />
          <StageChip label={getLeadStatusLabel('not intrested')} value={summary.rejected} icon={ShieldX} />
          <StageChip label={getLeadStatusLabel('intrested')} value={summary.holding} icon={CirclePause} />
          <div className="col-span-2">
            <StageChip label={getLeadStatusLabel('CNP')} value={summary.notConnected} icon={PhoneOff} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Total Leads</span>
          <span className="text-3xl font-black text-primary">{summary.total}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceRow({ user, leads }: { user: UserProfile; leads: Lead[] }) {
  const summary = getStageSummary(leads);
  const completion = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <Link href={`/team/${user.id}`} className="grid gap-4 rounded-[1.5rem] border border-primary/10 bg-background/80 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:shadow-xl md:grid-cols-[1.2fr_120px_1fr] md:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary">
          {user.displayName?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-black text-primary">{user.displayName}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {getRoleLabel(user.role)} · {getProfessionalEmployeeId(user)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-primary">{completion}%</p>
        <p className="text-xs font-bold text-muted-foreground">completion</p>
      </div>
      <div className="space-y-2">
        <Progress value={completion} className="h-2" />
        <div className="grid grid-cols-4 gap-2 text-xs font-black text-muted-foreground">
          <span>Total {summary.total}</span>
          <span>Pending {summary.pending}</span>
          <span>Done {summary.completed}</span>
          <span>NC {summary.notConnected}</span>
        </div>
      </div>
    </Link>
  );
}

function TelecallerProfileCard({ user, leads }: { user: UserProfile; leads: Lead[] }) {
  const summary = getStageSummary(leads);
  const completion = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <Link href={`/team/${user.id}`} className="group block">
      <Card className="h-full overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl">
        <CardHeader className="relative pb-3">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl herbal-gradient text-lg font-black text-white shadow-lg">
              {user.displayName?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl font-black text-primary">{user.displayName}</CardTitle>
              <CardDescription className="truncate font-semibold">{getProfessionalEmployeeId(user)}</CardDescription>
              <Badge variant="secondary" className="mt-2">{getRoleLabel(user.role)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-primary/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Completion</span>
              <span className="text-sm font-black text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.total}</p><p className="text-muted-foreground">Total</p></div>
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.pending}</p><p className="text-muted-foreground">Pending</p></div>
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.completed}</p><p className="text-muted-foreground">Done</p></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.notConnected}</p><p className="text-muted-foreground">NC</p></div>
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.holding}</p><p className="text-muted-foreground">Hold</p></div>
            <div className="rounded-xl border bg-background p-3"><p className="text-lg text-primary">{summary.rejected}</p><p className="text-muted-foreground">Reject</p></div>
          </div>
          <Button variant="outline" className="w-full rounded-2xl font-black">
            View Advanced Brief
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();
  const isAdmin = currentUser?.role === 'admin';
  const isTeamLead = currentUser?.role === 'sales_team_lead';
  const isTelecaller = currentUser?.role === 'sales_executive';

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collectionGroup(firestore, 'leads'));
    if (!currentTeamspace?.id) return null;

    const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
    if (isTelecaller) {
      return query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));
    }

    return query(leadsRef);
  }, [currentUser, currentTeamspace?.id, firestore, isAdmin, isTelecaller, isUserLoading]);

  const campaignsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collectionGroup(firestore, 'campaigns'));
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns'));
  }, [currentUser, currentTeamspace?.id, firestore, isAdmin, isUserLoading]);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collection(firestore, 'users'));
    if (isTeamLead) return null;
    return query(collection(firestore, 'users'), where(documentId(), '==', currentUser.id));
  }, [currentTeamspace?.id, currentUser, firestore, isAdmin, isTeamLead, isUserLoading]);

  const { data: rawLeads, isLoading: loadingLeads } = useCollection<Lead>(leadsQuery);
  const { data: campaigns, isLoading: loadingCampaigns } = useCollection<Campaign>(campaignsQuery);
  const { data: firestoreUsers, isLoading: loadingFirestoreUsers } = useCollection<UserProfile>(usersQuery);
  const { users: rosterUsers, isLoading: loadingRoster } = useTeamRoster();
  const users = isTeamLead ? rosterUsers : firestoreUsers;
  const loadingUsers = isTeamLead ? loadingRoster : loadingFirestoreUsers;

  const leads = useMemo(() => {
    const leadList = rawLeads || [];
    if (!currentUser) return [];
    if (isAdmin) return leadList;
    if (isTelecaller) return leadList.filter((lead) => lead.assignedToIds?.includes(currentUser.id));
    if (isTeamLead) {
      const teamTelecallerIds = (users || [])
        .filter((user) => belongsToTeamLeadTeam(user, currentUser, currentTeamspace))
        .map((user) => user.id);
      const visibleIds = new Set([currentUser.id, ...teamTelecallerIds]);
      return leadList.filter((lead) => lead.assignedToIds?.some((id) => visibleIds.has(id)));
    }
    return [];
  }, [currentUser, currentTeamspace?.id, isAdmin, isTeamLead, isTelecaller, rawLeads, users]);

  const visibleCampaigns = useMemo(() => {
    const leadList = leads || [];
    const campaignList = campaigns || [];
    if (!isTelecaller) return campaignList;

    const assignedCampaignIds = new Set(leadList.map((lead) => lead.campaignId).filter(Boolean));
    return campaignList.filter((campaign) => assignedCampaignIds.has(campaign.id));
  }, [campaigns, isTelecaller, leads]);

  const productGroups = useMemo(() => {
    const campaignById = new Map((campaigns || []).map((campaign) => [campaign.id, campaign]));
    const grouped = new Map<string, Lead[]>();

    (leads || []).forEach((lead) => {
      const campaign = lead.campaignId ? campaignById.get(lead.campaignId) : undefined;
      const productName =
        campaign?.productName ||
        campaign?.name ||
        lead.productAsked?.[0] ||
        lead.source ||
        'General Product';

      grouped.set(productName, [...(grouped.get(productName) || []), lead]);
    });

    return Array.from(grouped.entries())
      .map(([productName, productLeads]) => ({ productName, leads: productLeads }))
      .sort((a, b) => b.leads.length - a.leads.length);
  }, [campaigns, leads]);

  const periodLeads = useMemo(() => filterLeadsByPeriod(leads || [], period), [leads, period]);
  const totalSummary = useMemo(() => getStageSummary(periodLeads), [periodLeads]);
  const allTimeSummary = useMemo(() => getStageSummary(leads || []), [leads]);
  const conversionRate = totalSummary.total > 0 ? Math.round((totalSummary.completed / totalSummary.total) * 100) : 0;

  const performanceUsers = useMemo(() => {
    const userList = users || [];
    if (isAdmin) return userList.filter((user) => user.role === 'sales_team_lead');
    if (isTeamLead) return userList.filter((user) => user.role === 'sales_executive');
    if (currentUser) return [currentUser];
    return [];
  }, [currentUser, isAdmin, isTeamLead, users]);

  const teamTelecallers = useMemo(() => {
    if (!isTeamLead || !currentUser) return [];
    return (users || []).filter((user) => belongsToTeamLeadTeam(user, currentUser, currentTeamspace));
  }, [currentTeamspace, currentUser, isTeamLead, users]);

  const visibleCampaignIds = useMemo(
    () => new Set((leads || []).map((lead) => lead.campaignId).filter(Boolean)),
    [leads]
  );

  const teamLeadCampaigns = useMemo(
    () => (campaigns || []).filter((campaign) => visibleCampaignIds.has(campaign.id)),
    [campaigns, visibleCampaignIds]
  );

  if (isUserLoading || loadingLeads || loadingCampaigns || loadingUsers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isTeamLead) {
    return (
      <div className="space-y-10 pb-12">
        <section className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-accent">Welcome back, {currentUser?.displayName || 'Team Lead'}!</p>
          <h1 className="text-4xl font-black tracking-tight text-primary">Performance Tracker</h1>
          <p className="max-w-3xl text-sm font-semibold text-muted-foreground">
            Live view of leads assigned to you and your telecallers. Counts update directly from Firestore as lead status changes.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <TrackerMetric label="New Leads" value={allTimeSummary.total} icon={Users} accent="bg-gradient-to-br from-amber-400 to-orange-500" detail="Total assigned visible leads" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('new')}`} value={allTimeSummary.pending} icon={TrendingUp} accent="bg-gradient-to-br from-yellow-400 to-amber-600" detail="Untouched or pending leads" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('CNP')}`} value={allTimeSummary.notConnected} icon={PhoneOff} accent="bg-gradient-to-br from-orange-400 to-red-500" detail="Not connected attempts" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('done')}`} value={allTimeSummary.completed} icon={CheckCircle2} accent="bg-gradient-to-br from-emerald-400 to-green-600" detail={`${allTimeSummary.total > 0 ? Math.round((allTimeSummary.completed / allTimeSummary.total) * 100) : 0}% completion`} />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('intrested')}`} value={allTimeSummary.holding} icon={CirclePause} accent="bg-gradient-to-br from-sky-400 to-cyan-600" detail="Follow-up or holding leads" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('not intrested')}`} value={allTimeSummary.rejected} icon={ShieldX} accent="bg-gradient-to-br from-rose-400 to-red-600" detail="Rejected lead outcomes" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-primary">Campaign Details</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Each campaign card shows only outcomes from leads assigned to your team.
              </p>
            </div>
            <Badge variant="secondary">{teamLeadCampaigns.length} campaigns</Badge>
          </div>
          {teamLeadCampaigns.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
                No campaign leads are assigned to your team yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamLeadCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  leads={(leads || []).filter((lead) => lead.campaignId === campaign.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-primary">Telecaller Profiles</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Open any card to view the full advanced brief profile and report.
              </p>
            </div>
            <Badge variant="secondary">{teamTelecallers.length} telecallers</Badge>
          </div>
          {teamTelecallers.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
                No telecallers are currently assigned under your team.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamTelecallers.map((telecaller) => (
                <TelecallerProfileCard
                  key={telecaller.id}
                  user={telecaller}
                  leads={(leads || []).filter((lead) => lead.assignedToIds?.includes(telecaller.id))}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (isTelecaller) {
    return (
      <div className="space-y-10 pb-12">
        <section className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-accent">Welcome back, {currentUser?.displayName || 'Telecaller'}!</p>
          <h1 className="text-4xl font-black tracking-tight text-primary">Performance Tracker</h1>
          <p className="max-w-3xl text-sm font-semibold text-muted-foreground">
            Live view of your assigned leads and active campaign outcomes only.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <TrackerMetric label="New Leads" value={allTimeSummary.total} icon={Users} accent="bg-gradient-to-br from-amber-400 to-orange-500" detail="Total leads assigned to you" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('new')}`} value={allTimeSummary.pending} icon={TrendingUp} accent="bg-gradient-to-br from-yellow-400 to-amber-600" detail="Untouched or pending leads" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('CNP')}`} value={allTimeSummary.notConnected} icon={PhoneOff} accent="bg-gradient-to-br from-orange-400 to-red-500" detail="Not connected attempts" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('done')}`} value={allTimeSummary.completed} icon={CheckCircle2} accent="bg-gradient-to-br from-emerald-400 to-green-600" detail={`${allTimeSummary.total > 0 ? Math.round((allTimeSummary.completed / allTimeSummary.total) * 100) : 0}% completion`} />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('intrested')}`} value={allTimeSummary.holding} icon={CirclePause} accent="bg-gradient-to-br from-sky-400 to-cyan-600" detail="Follow-up or holding leads" />
          <TrackerMetric label={`Total Calls ${getLeadStatusLabel('not intrested')}`} value={allTimeSummary.rejected} icon={ShieldX} accent="bg-gradient-to-br from-rose-400 to-red-600" detail="Rejected lead outcomes" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-primary">Campaign Details</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Only campaigns with leads assigned to you are shown here.
              </p>
            </div>
            <Badge variant="secondary">{visibleCampaigns.length} campaigns</Badge>
          </div>
          {visibleCampaigns.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
                No campaign leads are assigned to you yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  leads={(leads || []).filter((lead) => lead.campaignId === campaign.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <section className="relative overflow-hidden rounded-[3rem] border border-primary/10 bg-card p-8 shadow-2xl shadow-primary/10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-accent">Welcome back, {currentUser?.displayName || 'Team'}!</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl herbal-gradient shadow-xl shadow-primary/20">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight text-primary">Performance Tracker</h1>
                <p className="mt-1 text-base font-semibold text-muted-foreground">
                  {isAdmin
                    ? 'Monitor team lead performance, product campaigns, and CRM-wide lead movement.'
                    : isTeamLead
                      ? `Monitor ${currentTeamspace?.name || 'your team'} telecallers with real-time lead insights.`
                      : 'Track your assigned products, calls, and lead outcomes.'}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="rounded-2xl px-5 py-3 text-sm font-black">
            {getRoleLabel(currentUser?.role)} · {currentTeamspace?.name || 'All Teamspaces'}
          </Badge>
        </div>

        <div className="relative mt-8 flex flex-wrap gap-3">
          {[
            ['today', 'Today'],
            ['week', 'Week'],
            ['month', 'Month'],
            ['year', 'Year'],
            ['custom', 'Custom'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value as PeriodFilter)}
              className={`rounded-2xl px-6 py-3 text-sm font-black transition-all ${period === value ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-background/70 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
              {label}
              {value === 'custom' ? <CalendarDays className="ml-2 inline h-4 w-4" /> : <Sparkles className="ml-2 inline h-4 w-4" />}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <TrackerMetric label="New Leads" value={totalSummary.total} icon={Users} accent="bg-gradient-to-br from-amber-400 to-orange-500" detail={`${allTimeSummary.total} all-time visible leads`} />
        <TrackerMetric label={`Total Calls ${getLeadStatusLabel('new')}`} value={totalSummary.pending} icon={TrendingUp} accent="bg-gradient-to-br from-yellow-400 to-amber-600" detail="Untouched or pending leads" />
        <TrackerMetric label={`Total Calls ${getLeadStatusLabel('CNP')}`} value={totalSummary.notConnected} icon={PhoneOff} accent="bg-gradient-to-br from-orange-400 to-red-500" detail="Not connected attempts" />
        <TrackerMetric label={`Total Calls ${getLeadStatusLabel('done')}`} value={totalSummary.completed} icon={CheckCircle2} accent="bg-gradient-to-br from-emerald-400 to-green-600" detail={`${conversionRate}% conversion in this view`} />
        <TrackerMetric label={`Total Calls ${getLeadStatusLabel('intrested')}`} value={totalSummary.holding} icon={CirclePause} accent="bg-gradient-to-br from-sky-400 to-cyan-600" detail="Follow-up or holding leads" />
        <TrackerMetric label={`Total Calls ${getLeadStatusLabel('not intrested')}`} value={totalSummary.rejected} icon={ShieldX} accent="bg-gradient-to-br from-rose-400 to-red-600" detail="Rejected lead outcomes" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-primary">{isTeamLead || isTelecaller ? 'Product Lead Details' : 'Campaign Details'}</h2>
            <p className="text-sm font-medium text-muted-foreground">
              {isTeamLead
                ? 'Product-wise total leads and stage distribution for your sales department.'
                : isTelecaller
                  ? 'Your assigned work grouped by product and current lead stage.'
                : 'Each campaign card shows its lead distribution by stage.'}
            </p>
          </div>
          <Badge variant="secondary">{isTeamLead || isTelecaller ? `${productGroups.length} products` : `${visibleCampaigns.length} campaigns`}</Badge>
        </div>
        {isTeamLead || isTelecaller ? (
          productGroups.length === 0 ? (
            <Card className="rounded-lg">
              <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
                {isTeamLead ? 'No product-linked leads are visible for this team yet.' : 'No assigned product leads are visible yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {productGroups.map((item) => (
                <ProductCard key={item.productName} productName={item.productName} leads={item.leads} />
              ))}
            </div>
          )
        ) : visibleCampaigns.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
              No campaigns are visible for this role yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                leads={(leads || []).filter((lead) => lead.campaignId === campaign.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-black text-primary">
                {isAdmin ? 'Team Lead Performance' : isTeamLead ? 'Telecaller Performance' : 'My Performance'}
              </h2>
              <p className="text-sm font-medium text-muted-foreground">Ranked by lead completion and visible workload.</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-2xl px-4 py-2 font-black">{period.toUpperCase()} view</Badge>
        </div>
        <div className="space-y-3">
          {performanceUsers.length === 0 ? (
            <Card className="rounded-lg">
              <CardContent className="p-8 text-center text-sm font-medium text-muted-foreground">
                No performance records are available yet.
              </CardContent>
            </Card>
          ) : (
            performanceUsers.map((user) => {
              const scopedLeads =
                user.role === 'sales_team_lead'
                  ? periodLeads.filter((lead) => {
                      const teamTelecallerIds = (users || [])
                        .filter((member) => belongsToTeamLeadTeam(member, user, currentTeamspace))
                        .map((member) => member.id);
                      return lead.assignedToIds?.some((id) => id === user.id || teamTelecallerIds.includes(id));
                    })
                  : periodLeads.filter((lead) => lead.assignedToIds?.includes(user.id));

              return <PerformanceRow key={user.id} user={user} leads={scopedLeads} />;
            })
          )}
        </div>
      </section>
    </div>
  );
}
