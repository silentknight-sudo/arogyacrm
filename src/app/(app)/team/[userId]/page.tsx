'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Award, BriefcaseBusiness, CalendarDays, CheckCircle2, CirclePause, FileUp, GraduationCap, KeyRound, Mail, Phone, PhoneOff, Shield, ShieldX, TrendingUp, UserRound, Users } from 'lucide-react';
import type { Lead, UserProfile } from '@/types';
import { RolePerformancePanel } from '@/components/role-performance-panel';
import { getProfessionalEmployeeId, getRoleLabel } from '@/lib/user-labels';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UserActions } from '@/app/(app)/admin/users/columns';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="col-span-2 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function getStageSummary(leads: Lead[]) {
  return {
    total: leads.length,
    pending: leads.filter((lead) => lead.status === 'new').length,
    completed: leads.filter((lead) => lead.status === 'done').length,
    rejected: leads.filter((lead) => lead.status === 'not intrested').length,
    holding: leads.filter((lead) => lead.status === 'intrested').length,
    notConnected: leads.filter((lead) => lead.status === 'CNP').length,
  };
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-background p-5 shadow-sm">
      <div className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${tone}`} />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black text-primary">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({ member, leads }: { member: UserProfile; leads: Lead[] }) {
  const summary = getStageSummary(leads);
  const completion = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
      <Card className="group h-full overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl">
        <CardHeader className="relative pb-3">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
              <AvatarImage src={member.avatar} alt={member.displayName} />
              <AvatarFallback className="bg-primary/10 font-black text-primary">
                {member.displayName?.split(' ').map((name) => name[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl font-black text-primary">{member.displayName}</CardTitle>
              <CardDescription className="truncate font-semibold">{getProfessionalEmployeeId(member)}</CardDescription>
              <Badge variant="secondary" className="mt-2">{getRoleLabel(member.role)}</Badge>
            </div>
            <div className="ml-auto self-start">
              <UserActions user={member} />
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
          <Button asChild variant="outline" className="w-full rounded-2xl font-black">
            <Link href={`/team/${member.id}`}>Open Full Profile & Report</Link>
          </Button>
        </CardContent>
      </Card>
  );
}

export default function TeamMemberProfilePage() {
  const params = useParams<{ userId: string }>();
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const userRef = useMemoFirebase(() => (
    userId ? doc(firestore, 'users', userId) : null
  ), [firestore, userId]);
  const { data: member, isLoading: loadingMember } = useDoc<UserProfile>(userRef);

  const profileTeamspaceId = member?.teamspaceIds?.[0] || currentTeamspace?.id;

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') {
      return query(collection(firestore, 'users'));
    }
    if (member?.role === 'sales_team_lead') {
      return query(
        collection(firestore, 'users'),
        where('createdBy', '==', member.id),
        where('role', '==', 'sales_executive')
      );
    }
    if (!profileTeamspaceId) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', profileTeamspaceId));
  }, [firestore, currentUser, member?.id, member?.role, profileTeamspaceId]);
  const leadsQuery = useMemoFirebase(() => {
    if (!profileTeamspaceId) return null;
    return query(collection(firestore, 'teamspaces', profileTeamspaceId, 'leads'));
  }, [firestore, profileTeamspaceId]);

  const { data: usersData, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: leadsData, isLoading: loadingLeads } = useCollection<Lead>(leadsQuery);
  const users = usersData || [];
  const leads = leadsData || [];

  const assignedLeads = useMemo(
    () => {
      if (!member) return [];
      if (member.role !== 'sales_team_lead') {
        return leads.filter((lead) => lead.assignedToIds?.includes(userId));
      }

      const teamTelecallerIds = users
        .filter((user) => belongsToTeamLeadTeam(user, member, currentTeamspace))
        .map((user) => user.id);

      return leads.filter((lead) =>
        lead.assignedToIds?.some((id) => id === member.id || teamTelecallerIds.includes(id))
      );
    },
    [leads, member, userId, users]
  );

  const teamTelecallers = useMemo(
    () => member?.role === 'sales_team_lead'
      ? users.filter((user) => belongsToTeamLeadTeam(user, member, currentTeamspace))
      : [],
    [currentTeamspace, member, users]
  );

  const assignedSummary = useMemo(() => getStageSummary(assignedLeads), [assignedLeads]);
  const completionRate = assignedSummary.total > 0 ? Math.round((assignedSummary.completed / assignedSummary.total) * 100) : 0;

  const campaignBreakdown = useMemo(() => {
    const grouped = new Map<string, { total: number; pending: number; completed: number }>();

    assignedLeads.forEach((lead) => {
      const key = lead.campaignId || 'unlinked';
      const current = grouped.get(key) || { total: 0, pending: 0, completed: 0 };
      current.total += 1;
      if (lead.status === 'new') current.pending += 1;
      if (lead.status === 'done') current.completed += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries()).map(([campaignId, stats]) => ({
      campaignId,
      ...stats,
    }));
  }, [assignedLeads]);

  const canView = useMemo(() => {
    if (!currentUser || !member) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.id === member.id) return true;
    if (currentUser.role === 'sales_team_lead') {
      return (
        member.id === currentUser.id ||
        member.createdBy === currentUser.id ||
        (!!currentTeamspace?.id && (member.teamspaceIds || []).includes(currentTeamspace.id))
      );
    }
    return false;
  }, [currentTeamspace?.id, currentUser, member]);

  if (loadingMember || loadingUsers || loadingLeads) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (!member || !canView) {
    return (
      <Card className="premium-card">
        <CardContent className="p-10 space-y-4">
          <p className="text-2xl font-black text-primary">Access restricted</p>
          <p className="text-muted-foreground font-medium">
            You do not have permission to view this employee profile.
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team Management
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team Management
        </Link>
      </Button>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <CardHeader className="relative">
          <div className="flex flex-col items-center gap-5 text-center">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              <AvatarImage src={member.avatar} alt={member.displayName} />
              <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                {member.displayName?.split(' ').map((name) => name[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Admin View</p>
              <CardTitle className="text-4xl font-black tracking-tight text-primary">{member.displayName}</CardTitle>
              <CardDescription className="text-lg font-medium">{member.email}</CardDescription>
              <Badge variant="outline" className="capitalize font-black">
                <Shield className="mr-2 h-3.5 w-3.5" />
                {getRoleLabel(member.role)}
              </Badge>
              <div className="flex justify-center">
                <UserActions user={member} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <DetailRow label="Full Name" value={member.displayName} />
          <DetailRow label="Email" value={<span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{member.email}</span>} />
          <DetailRow label="Phone" value={<span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{member.phone || 'Not added yet'}</span>} />
          <DetailRow label="Address" value="Not added yet" />
          <DetailRow label="Employee ID" value={<span className="font-mono text-sm">{getProfessionalEmployeeId(member)}</span>} />
          <DetailRow label="Login Access" value={member.accessStatus === 'blocked' ? <Badge variant="destructive">Blocked</Badge> : <Badge className="bg-emerald-600">Approved</Badge>} />
        </CardContent>
      </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start rounded-[2rem] bg-muted/40 p-2">
          <TabsTrigger value="performance" className="rounded-2xl px-5 py-3 font-black"><Award className="mr-2 h-4 w-4" />Performance</TabsTrigger>
          <TabsTrigger value="password" className="rounded-2xl px-5 py-3 font-black"><KeyRound className="mr-2 h-4 w-4" />Change Password</TabsTrigger>
          <TabsTrigger value="personal" className="rounded-2xl px-5 py-3 font-black"><UserRound className="mr-2 h-4 w-4" />Personal Details</TabsTrigger>
          <TabsTrigger value="qualification" className="rounded-2xl px-5 py-3 font-black"><GraduationCap className="mr-2 h-4 w-4" />Qualification Details</TabsTrigger>
          <TabsTrigger value="experience" className="rounded-2xl px-5 py-3 font-black"><BriefcaseBusiness className="mr-2 h-4 w-4" />Experience Details</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-2xl px-5 py-3 font-black"><FileUp className="mr-2 h-4 w-4" />Documents Uploaded</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card className="relative overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <CardHeader className="relative">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-accent">Complete Record</p>
                  <CardTitle className="mt-2 text-3xl font-black text-primary">
                    {member.role === 'sales_team_lead' ? 'Team Lead Performance Overview' : 'Telecaller Performance Overview'}
                  </CardTitle>
                  <CardDescription className="mt-2 font-semibold">
                    {member.role === 'sales_team_lead'
                      ? 'Combined workload for this TL and all telecallers reporting under them.'
                      : 'Assigned lead workload, outcomes, and activity summary for this telecaller.'}
                  </CardDescription>
                </div>
                <Badge className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
                  {completionRate}% completion
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryTile label="Total Leads" value={assignedSummary.total} icon={Users} tone="bg-gradient-to-br from-amber-400 to-orange-500" />
              <SummaryTile label="Pending" value={assignedSummary.pending} icon={TrendingUp} tone="bg-gradient-to-br from-yellow-400 to-amber-600" />
              <SummaryTile label="Not Connected" value={assignedSummary.notConnected} icon={PhoneOff} tone="bg-gradient-to-br from-orange-400 to-red-500" />
              <SummaryTile label="Completed" value={assignedSummary.completed} icon={CheckCircle2} tone="bg-gradient-to-br from-emerald-400 to-green-600" />
              <SummaryTile label="Holding" value={assignedSummary.holding} icon={CirclePause} tone="bg-gradient-to-br from-sky-400 to-cyan-600" />
              <SummaryTile label="Rejected" value={assignedSummary.rejected} icon={ShieldX} tone="bg-gradient-to-br from-rose-400 to-red-600" />
            </CardContent>
          </Card>

          <RolePerformancePanel
            subject={member}
            leads={leads}
            users={users}
            title="Performance Tracker"
            description={member.role === 'sales_team_lead' ? 'Today, week, month, and year metrics for this TL team.' : 'Today, week, month, and year metrics for this telecaller.'}
            hideTeamMembers
          />

          {member.role === 'sales_team_lead' && (
            <Card className="rounded-[2rem] border-primary/10">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-primary">Team Telecallers</CardTitle>
                <CardDescription>
                  Click any telecaller card to open their advanced profile, documents, and performance breakdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {teamTelecallers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/15 p-6 text-sm font-medium text-muted-foreground italic">
                    No telecallers are currently assigned under this Team Lead.
                  </div>
                ) : teamTelecallers.map((telecaller) => (
                  <TeamMemberCard
                    key={telecaller.id}
                    member={telecaller}
                    leads={leads.filter((lead) => lead.assignedToIds?.includes(telecaller.id))}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[2rem] border-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-primary">Workload Breakdown</CardTitle>
              <CardDescription>Assigned workload and completion summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaignBreakdown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/15 p-6 text-sm font-medium text-muted-foreground italic">
                  No campaign-linked leads are assigned to this employee yet.
                </div>
              ) : campaignBreakdown.map((item) => {
                const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                return (
                  <div key={item.campaignId} className="rounded-2xl border border-primary/10 bg-muted/20 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {item.campaignId === 'unlinked' ? 'General Leads' : `Campaign ${item.campaignId.slice(0, 6)}`}
                    </p>
                    <p className="mt-3 text-3xl font-black text-primary">{percent}%</p>
                    <Progress value={percent} className="mt-3 h-2" />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold">
                      <span>Total {item.total}</span>
                      <span>Pending {item.pending}</span>
                      <span>Done {item.completed}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="rounded-[2rem] border-primary/10">
            <CardHeader><CardTitle className="text-2xl font-black text-primary">Change Password</CardTitle><CardDescription>Reset this employee password securely from this profile.</CardDescription></CardHeader>
            <CardContent className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-5">
              <div>
                <p className="font-black text-primary">{member.displayName}</p>
                <p className="text-sm font-medium text-muted-foreground">{getProfessionalEmployeeId(member)}</p>
              </div>
              <UserActions user={member} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card className="rounded-[2rem] border-primary/10"><CardHeader><CardTitle className="text-2xl font-black text-primary">Personal Details</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><DetailRow label="Date of Birth" value={<span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{member.dateOfBirth || 'Not added yet'}</span>} /><DetailRow label="Workspaces" value={(member.teamspaceIds || []).join(', ') || 'No workspace assigned'} /><DetailRow label="Created By" value={member.createdBy || 'System / Admin'} /><DetailRow label="Avatar" value={member.avatar ? <a href={member.avatar} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Open current photo</a> : 'No photo uploaded'} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="qualification">
          <Card className="rounded-[2rem] border-primary/10"><CardHeader><CardTitle className="text-2xl font-black text-primary">Qualification Details</CardTitle><CardDescription>Education records shown in the same structure as the reference CRM.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><DetailRow label="10th" value="Not uploaded" /><DetailRow label="12th" value="Not uploaded" /><DetailRow label="Graduation" value="Not uploaded" /></CardContent></Card>
        </TabsContent>

        <TabsContent value="experience">
          <Card className="rounded-[2rem] border-primary/10"><CardHeader><CardTitle className="text-2xl font-black text-primary">Experience Details</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><DetailRow label="Previous Company" value="Not added yet" /><DetailRow label="Experience" value="Not added yet" /><DetailRow label="Role" value={getRoleLabel(member.role)} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="rounded-[2rem] border-primary/10">
            <CardHeader><CardTitle className="text-2xl font-black text-primary">Documents Uploaded</CardTitle><CardDescription>Upload placeholders for employee documents.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {['10th Marksheet', '12th Marksheet', 'Graduation Marksheet', 'Post Graduation Marksheet', 'PHD Marksheet', 'Profile Pic', 'Signature'].map((label) => (
                <div key={label} className="rounded-2xl border bg-background p-4">
                  <p className="mb-3 text-sm font-black text-primary">{label}</p>
                  <Input type="file" className="rounded-xl" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
