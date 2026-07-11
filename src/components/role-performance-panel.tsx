'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, CheckCircle2, PhoneCall, Sparkles, Target, Users } from 'lucide-react';
import type { Lead, UserProfile } from '@/types';
import { getRoleLabel } from '@/lib/user-labels';

type RolePerformancePanelProps = {
  subject: UserProfile;
  leads: Lead[];
  users: UserProfile[];
  title?: string;
  description?: string;
  hideTeamMembers?: boolean;
};

export type PerformanceSummary = {
  total: number;
  fresh: number;
  interested: number;
  cnp: number;
  closed: number;
  conversionRate: number;
  subordinateUsers: UserProfile[];
};

export function getPerformanceSummary(subject: UserProfile, leads: Lead[], users: UserProfile[]): PerformanceSummary {
  const subordinateUsers = users.filter(
    (user) => user.role === 'sales_executive' && user.createdBy === subject.id
  );

  const relevantIds =
    subject.role === 'sales_team_lead'
      ? new Set([subject.id, ...subordinateUsers.map((user) => user.id)])
      : new Set([subject.id]);

  const scopedLeads =
    subject.role === 'admin'
      ? leads
      : leads.filter((lead) => lead.assignedToIds?.some((id) => relevantIds.has(id)));

  const total = scopedLeads.length;
  const fresh = scopedLeads.filter((lead) => lead.status === 'new').length;
  const interested = scopedLeads.filter((lead) => lead.status === 'intrested').length;
  const cnp = scopedLeads.filter((lead) => lead.status === 'CNP').length;
  const closed = scopedLeads.filter((lead) => lead.status === 'done').length;
  const conversionRate = total > 0 ? Number(((closed / total) * 100).toFixed(1)) : 0;

  return {
    total,
    fresh,
    interested,
    cnp,
    closed,
    conversionRate,
    subordinateUsers,
  };
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof BarChart3;
}) {
  return (
    <Card className="border border-primary/10 shadow-sm rounded-2xl">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-3xl font-black tracking-tight text-primary">{value}</p>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RolePerformancePanel({
  subject,
  leads,
  users,
  title,
  description,
  hideTeamMembers = false,
}: RolePerformancePanelProps) {
  const summary = getPerformanceSummary(subject, leads, users);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-primary">
          {title || `${subject.displayName} Performance Dashboard`}
        </h2>
        <p className="text-muted-foreground font-medium">
          {description ||
            (subject.role === 'sales_team_lead'
              ? 'Team-wide pipeline visibility for your telecallers.'
              : subject.role === 'sales_executive'
                ? 'Your live pipeline and conversion progress.'
                : 'Global operational performance view.')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total Leads" value={summary.total} icon={Users} />
        <SummaryCard label="Pending" value={summary.fresh} icon={Target} />
        <SummaryCard label="Holding" value={summary.interested} icon={Sparkles} />
        <SummaryCard label="Not Connected" value={summary.cnp} icon={PhoneCall} />
        <SummaryCard label="Completed" value={`${summary.closed} (${summary.conversionRate}%)`} icon={CheckCircle2} />
      </div>

      {subject.role === 'sales_team_lead' && !hideTeamMembers && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-xl font-black text-primary">Team Telecallers</CardTitle>
            <CardDescription className="font-medium">
              Live performance across the executives managed by {subject.displayName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.subordinateUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/15 p-6 text-sm font-medium text-muted-foreground italic">
                No telecallers are currently linked to this team lead.
              </div>
            ) : (
              summary.subordinateUsers.map((user) => {
                const memberSummary = getPerformanceSummary(user, leads, users);
                return (
                  <div key={user.id} className="rounded-2xl border border-primary/10 bg-muted/20 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-primary">{user.displayName}</p>
                        <p className="text-xs font-medium text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                      <div className="rounded-xl bg-background p-3">Leads: {memberSummary.total}</div>
                      <div className="rounded-xl bg-background p-3">Completed: {memberSummary.closed}</div>
                      <div className="rounded-xl bg-background p-3">Pending: {memberSummary.fresh}</div>
                      <div className="rounded-xl bg-background p-3">Holding: {memberSummary.interested}</div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
