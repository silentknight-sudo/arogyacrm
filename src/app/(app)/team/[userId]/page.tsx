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
import { ArrowLeft, Award, BriefcaseBusiness, CalendarDays, CheckCircle2, FileUp, GraduationCap, KeyRound, Mail, Phone, Shield, UserRound } from 'lucide-react';
import type { Lead, UserProfile } from '@/types';
import { RolePerformancePanel } from '@/components/role-performance-panel';
import { getProfessionalEmployeeId, getRoleLabel } from '@/lib/user-labels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="col-span-2 font-semibold text-foreground">{value}</div>
    </div>
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

  const usersQuery = useMemoFirebase(() => {
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id]);
  const leadsQuery = useMemoFirebase(() => {
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'));
  }, [firestore, currentTeamspace?.id]);

  const { data: usersData, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);
  const { data: leadsData, isLoading: loadingLeads } = useCollection<Lead>(leadsQuery);
  const users = usersData || [];
  const leads = leadsData || [];

  const assignedLeads = useMemo(
    () => leads.filter((lead) => lead.assignedToIds?.includes(userId)),
    [leads, userId]
  );

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
      return member.createdBy === currentUser.id;
    }
    return false;
  }, [currentUser, member]);

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
          <RolePerformancePanel subject={member} leads={leads} users={users} title="Performance Tracker" description="Today, week, month, and year style performance metrics for this telecaller." />
          <Card className="rounded-[2rem] border-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-primary">Campaign Workload</CardTitle>
              <CardDescription>Campaign-wise active workload and completion summary.</CardDescription>
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
            <CardHeader><CardTitle className="text-2xl font-black text-primary">Change Password</CardTitle><CardDescription>Use the three-dot action menu from Telecaller List to reset this employee password securely.</CardDescription></CardHeader>
            <CardContent><Button asChild className="rounded-2xl herbal-gradient font-black"><Link href="/admin/users">Open Telecaller List</Link></Button></CardContent>
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
