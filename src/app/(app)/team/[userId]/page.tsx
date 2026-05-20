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
import { ArrowLeft, CalendarDays, Mail, Phone, Shield } from 'lucide-react';
import type { Lead, UserProfile } from '@/types';
import { RolePerformancePanel } from '@/components/role-performance-panel';

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
    <div className="space-y-8">
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team Management
        </Link>
      </Button>

      <Card className="premium-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              <AvatarImage src={member.avatar} alt={member.displayName} />
              <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                {member.displayName?.split(' ').map((name) => name[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <CardTitle className="text-4xl font-black tracking-tight text-primary">{member.displayName}</CardTitle>
              <CardDescription className="text-lg font-medium">{member.email}</CardDescription>
              <Badge variant="outline" className="capitalize font-black w-fit">
                <Shield className="mr-2 h-3.5 w-3.5" />
                {member.role.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <DetailRow label="Email" value={<span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{member.email}</span>} />
          <DetailRow label="Phone" value={member.phone || 'Not added yet'} />
          <DetailRow label="Date of Birth" value={<span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{member.dateOfBirth || 'Not added yet'}</span>} />
          <DetailRow label="Avatar" value={member.avatar ? <a href={member.avatar} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Open current photo</a> : 'No photo uploaded'} />
          <DetailRow label="Workspaces" value={(member.teamspaceIds || []).join(', ') || 'No workspace assigned'} />
          <DetailRow label="Created By" value={member.createdBy || 'System / Admin'} />
        </CardContent>
      </Card>

      <RolePerformancePanel subject={member} leads={leads} users={users} />
    </div>
  );
}
