'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BarChart3, CheckCircle2, CirclePause, LineChart, PhoneOff, ShieldX, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { getLeadStatusLabel } from '@/lib/status-labels';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';
import { getProfessionalEmployeeId } from '@/lib/user-labels';

const COLORS = ['#31533C', '#D6B66D', '#1D4ED8', '#E11D48', '#0891B2', '#7C3AED'];

function MetricCard({
    title,
    value,
    detail,
    icon: Icon,
    tone,
}: {
    title: string;
    value: number | string;
    detail: string;
    icon: typeof BarChart3;
    tone: string;
}) {
    return (
        <Card className="group relative overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5 transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl ${tone}`} />
            <CardContent className="relative flex items-center gap-5 p-6">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone} text-white shadow-inner`}>
                    <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-muted-foreground">{title}</p>
                    <p className="mt-1 text-4xl font-black tracking-tight text-primary">{value}</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">{detail}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function getLeadSummary(leads: Lead[]) {
    const total = leads.length;
    const pending = leads.filter((lead) => lead.status === 'new').length;
    const completed = leads.filter((lead) => lead.status === 'done').length;
    const rejected = leads.filter((lead) => lead.status === 'not intrested').length;
    const holding = leads.filter((lead) => lead.status === 'intrested').length;
    const notConnected = leads.filter((lead) => lead.status === 'CNP').length;
    const output = completed + rejected + holding + notConnected;
    const conversion = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, completed, rejected, holding, notConnected, output, conversion };
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="rounded-2xl border bg-background p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-black text-primary">{value}</p>
        </div>
    );
}

function TelecallerBriefCard({ telecaller, leads }: { telecaller: UserProfile; leads: Lead[] }) {
    const summary = getLeadSummary(leads);

    return (
        <Link href={`/team/${telecaller.id}`} className="group block">
            <div className="h-full rounded-[1.5rem] border border-primary/10 bg-background p-5 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-xl">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-lg font-black text-primary">{telecaller.displayName}</p>
                        <p className="truncate text-xs font-bold text-muted-foreground">{getProfessionalEmployeeId(telecaller)}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">{summary.conversion}%</Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-primary/5 p-2"><p className="font-black text-primary">{summary.total}</p><p className="text-[9px] font-bold text-muted-foreground">Input</p></div>
                    <div className="rounded-xl bg-emerald-50 p-2"><p className="font-black text-emerald-700">{summary.completed}</p><p className="text-[9px] font-bold text-muted-foreground">Done</p></div>
                    <div className="rounded-xl bg-orange-50 p-2"><p className="font-black text-orange-700">{summary.notConnected}</p><p className="text-[9px] font-bold text-muted-foreground">NC</p></div>
                </div>
            </div>
        </Link>
    );
}

export default function ReportsPage() {
    const { currentTeamspace, currentUser, isUserLoading } = useApp();
    const firestore = useFirestore();

    const leadsQuery = useMemoFirebase(() =>
        !isUserLoading && currentUser && currentTeamspace
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);

    const usersQuery = useMemoFirebase(() =>
        !isUserLoading && currentUser
            ? currentUser.role === 'sales_team_lead'
                ? query(collection(firestore, 'users'), where('role', '==', 'sales_executive'))
                : currentTeamspace
                    ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id))
                    : null
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);

    const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const isTeamLead = currentUser?.role === 'sales_team_lead';
    const teamTelecallers = useMemo(() => {
        if (!currentUser) return [];
        return (users || []).filter((user) => belongsToTeamLeadTeam(user, currentUser, currentTeamspace));
    }, [currentTeamspace, currentUser, users]);

    const teamScopedLeads = useMemo(() => {
        const leadList = leads || [];
        if (!currentUser) return [];
        if (!isTeamLead) return leadList;

        const teamIds = new Set([currentUser.id, ...teamTelecallers.map((user) => user.id)]);
        return leadList.filter((lead) => lead.assignedToIds?.some((id) => teamIds.has(id)));
    }, [currentUser, isTeamLead, leads, teamTelecallers]);

    const leadSourceChartData = useMemo(() => {
        if (!leads) return [];
        const leadSourceData = leads.reduce((acc, lead) => {
            const source = lead.source || 'Unknown';
            if (!acc[source]) {
                acc[source] = 0;
            }
            acc[source]++;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(leadSourceData).map(source => ({
            name: source,
            value: leadSourceData[source]
        }));
    }, [leads]);

    const stageData = useMemo(() => {
        const leadList = leads || [];
        return [
            { name: getLeadStatusLabel('new'), value: leadList.filter((lead) => lead.status === 'new').length, fill: '#D6B66D' },
            { name: getLeadStatusLabel('done'), value: leadList.filter((lead) => lead.status === 'done').length, fill: '#16A34A' },
            { name: getLeadStatusLabel('not intrested'), value: leadList.filter((lead) => lead.status === 'not intrested').length, fill: '#E11D48' },
            { name: getLeadStatusLabel('intrested'), value: leadList.filter((lead) => lead.status === 'intrested').length, fill: '#0891B2' },
            { name: getLeadStatusLabel('CNP'), value: leadList.filter((lead) => lead.status === 'CNP').length, fill: '#F97316' },
        ];
    }, [leads]);

    const totalLeads = leads?.length || 0;
    const completedLeads = stageData.find((item) => item.name === getLeadStatusLabel('done'))?.value || 0;
    const pendingLeads = stageData.find((item) => item.name === getLeadStatusLabel('new'))?.value || 0;
    const conversionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;
    const activeSources = leadSourceChartData.length;
    const topSource = leadSourceChartData.slice().sort((a, b) => b.value - a.value)[0];
    const inputOutputSummary = useMemo(() => getLeadSummary(leads || []), [leads]);
    const teamLeadReports = useMemo(() => {
        const userList = users || [];
        const leadList = leads || [];
        return userList
            .filter((user) => user.role === 'sales_team_lead')
            .map((tl) => {
                const telecallers = userList.filter((user) => user.role === 'sales_executive' && user.createdBy === tl.id);
                const teamIds = new Set([tl.id, ...telecallers.map((user) => user.id)]);
                const teamLeads = leadList.filter((lead) => lead.assignedToIds?.some((id) => teamIds.has(id)));

                return {
                    tl,
                    telecallers,
                    leads: teamLeads,
                    summary: getLeadSummary(teamLeads),
                };
            })
            .sort((a, b) => b.summary.total - a.summary.total);
    }, [leads, users]);

    const teamInputOutputSummary = useMemo(() => getLeadSummary(teamScopedLeads), [teamScopedLeads]);
    const teamStageData = useMemo(() => [
        { name: getLeadStatusLabel('new'), value: teamInputOutputSummary.pending, fill: '#D6B66D' },
        { name: getLeadStatusLabel('done'), value: teamInputOutputSummary.completed, fill: '#16A34A' },
        { name: getLeadStatusLabel('not intrested'), value: teamInputOutputSummary.rejected, fill: '#E11D48' },
        { name: getLeadStatusLabel('intrested'), value: teamInputOutputSummary.holding, fill: '#0891B2' },
        { name: getLeadStatusLabel('CNP'), value: teamInputOutputSummary.notConnected, fill: '#F97316' },
    ], [teamInputOutputSummary]);

    const teamOutputPieData = useMemo(() => teamStageData.filter((item) => item.value > 0), [teamStageData]);
    const telecallerOutcomeData = useMemo(() => (
        teamTelecallers.map((telecaller) => {
            const summary = getLeadSummary(teamScopedLeads.filter((lead) => lead.assignedToIds?.includes(telecaller.id)));
            return {
                name: telecaller.displayName,
                pending: summary.pending,
                completed: summary.completed,
                rejected: summary.rejected,
                holding: summary.holding,
                notConnected: summary.notConnected,
                total: summary.total,
            };
        })
    ), [teamScopedLeads, teamTelecallers]);

    if (isLoadingLeads || isLoadingUsers || isUserLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-40 w-full rounded-[3rem]" />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-[2rem]" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-[2rem]" />
            </div>
        );
    }

    if (isTeamLead) {
        return (
            <div className="space-y-8 pb-12">
                <section className="relative overflow-hidden rounded-[3rem] border border-primary/10 bg-card p-8 shadow-2xl shadow-primary/10">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                    <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl herbal-gradient shadow-xl shadow-primary/20">
                                <LineChart className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.25em] text-accent">Team Reports</p>
                                <h1 className="mt-2 text-5xl font-black tracking-tight text-primary">Reports Management</h1>
                                <p className="mt-2 max-w-2xl text-base font-semibold text-muted-foreground">
                                    Brief outcome analytics for your team only, with live telecaller performance and advanced profile drill-downs.
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="rounded-2xl px-5 py-3 text-sm font-black">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {teamTelecallers.length} Telecallers
                        </Badge>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard title="Team Input" value={teamInputOutputSummary.total} detail="Assigned leads in your team" icon={Users} tone="bg-gradient-to-br from-primary to-[#5F7A43]" />
                    <MetricCard title="Team Output" value={teamInputOutputSummary.output} detail="Moved out of pending" icon={TrendingUp} tone="bg-gradient-to-br from-sky-400 to-blue-700" />
                    <MetricCard title="Completed" value={teamInputOutputSummary.completed} detail={`${teamInputOutputSummary.conversion}% conversion`} icon={CheckCircle2} tone="bg-gradient-to-br from-emerald-400 to-green-700" />
                    <MetricCard title="Pending" value={teamInputOutputSummary.pending} detail="Still waiting for action" icon={CirclePause} tone="bg-gradient-to-br from-amber-400 to-orange-600" />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-primary">Outcome Pie Chart</CardTitle>
                            <CardDescription className="font-medium">Your team&apos;s current lead outcome split.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teamOutputPieData.length === 0 ? (
                                <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed text-sm font-semibold text-muted-foreground">
                                    No outcome data available yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={360}>
                                    <PieChart>
                                        <Pie
                                            data={teamOutputPieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={120}
                                            innerRadius={68}
                                            dataKey="value"
                                        >
                                            {teamOutputPieData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius)'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-primary">Team Outcome Bar Graph</CardTitle>
                            <CardDescription className="font-medium">Pending, completed, rejected, holding, and not connected counts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={teamStageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} interval={0} angle={-8} height={54} />
                                    <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                                        {teamStageData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-primary">Telecaller Outcome Comparison</CardTitle>
                            <CardDescription className="font-medium">Brief outcome distribution for each telecaller in your team.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {telecallerOutcomeData.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-8 text-center text-sm font-semibold text-muted-foreground">
                                    No telecallers are assigned under your team yet.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={380}>
                                    <BarChart data={telecallerOutcomeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} interval={0} angle={-8} height={58} />
                                        <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{
                                                background: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius)'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="pending" name="Pending" stackId="a" fill="#D6B66D" radius={[10, 10, 0, 0]} />
                                        <Bar dataKey="completed" name="Completed" stackId="a" fill="#16A34A" />
                                        <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#E11D48" />
                                        <Bar dataKey="holding" name="Holding" stackId="a" fill="#0891B2" />
                                        <Bar dataKey="notConnected" name="Not Connected" stackId="a" fill="#F97316" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl font-black text-primary">Pipeline Health</CardTitle>
                            <CardDescription className="font-medium">How your team&apos;s assigned leads are distributed right now.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {teamStageData.map((stage) => {
                                const percentage = teamInputOutputSummary.total > 0 ? Math.round((stage.value / teamInputOutputSummary.total) * 100) : 0;
                                return (
                                    <div key={stage.name} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm font-black">
                                            <span>{stage.name}</span>
                                            <span className="text-muted-foreground">{stage.value} · {percentage}%</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-accent">Advanced Views</p>
                            <h2 className="mt-2 text-3xl font-black text-primary">Telecaller Brief Reports</h2>
                            <p className="mt-1 text-sm font-semibold text-muted-foreground">
                                Click any card to open the full advanced brief profile and report.
                            </p>
                        </div>
                        <Badge variant="secondary" className="rounded-2xl px-4 py-2 font-black">{teamTelecallers.length} Cards</Badge>
                    </div>
                    {teamTelecallers.length === 0 ? (
                        <Card className="rounded-[2rem] border-primary/10">
                            <CardContent className="p-10 text-center text-sm font-semibold text-muted-foreground">
                                No telecaller report cards available yet.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {teamTelecallers.map((telecaller) => (
                                <TelecallerBriefCard
                                    key={telecaller.id}
                                    telecaller={telecaller}
                                    leads={teamScopedLeads.filter((lead) => lead.assignedToIds?.includes(telecaller.id))}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        );
    }
    

    return (
        <div className="space-y-8 pb-12">
            <section className="relative overflow-hidden rounded-[3rem] border border-primary/10 bg-card p-8 shadow-2xl shadow-primary/10">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl herbal-gradient shadow-xl shadow-primary/20">
                            <LineChart className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.25em] text-accent">Analytics Command Center</p>
                            <h1 className="mt-2 text-5xl font-black tracking-tight text-primary">Reports Management</h1>
                            <p className="mt-2 max-w-2xl text-base font-semibold text-muted-foreground">
                                Campaign intelligence, source quality, and stage movement for {currentTeamspace?.name || 'your teamspace'}.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="rounded-2xl px-5 py-3 text-sm font-black">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Live Lead Insights
                    </Badge>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {isLoadingLeads ? (
                    [0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-[2rem]" />)
                ) : (
                    <>
                        <MetricCard title="Total Leads" value={totalLeads} detail="All leads in current teamspace" icon={Users} tone="bg-gradient-to-br from-primary to-[#5F7A43]" />
                        <MetricCard title="Conversion Rate" value={`${conversionRate}%`} detail={`${completedLeads} completed leads`} icon={Target} tone="bg-gradient-to-br from-emerald-400 to-green-700" />
                        <MetricCard title="Pending Workload" value={pendingLeads} detail="Leads awaiting action" icon={CirclePause} tone="bg-gradient-to-br from-amber-400 to-orange-600" />
                        <MetricCard title="Active Sources" value={activeSources} detail={topSource ? `Top: ${topSource.name}` : 'No source data yet'} icon={BarChart3} tone="bg-gradient-to-br from-sky-400 to-blue-700" />
                    </>
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <Card className="relative overflow-hidden rounded-[2rem] border-primary/10 bg-card shadow-xl shadow-primary/5">
                    <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
                    <CardHeader className="relative">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black text-primary">
                            <TrendingUp className="h-6 w-6" />
                            Lead Input vs Output
                        </CardTitle>
                        <CardDescription className="font-medium">
                            Input means all leads received. Output means leads that moved out of pending into a final or working outcome.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.5rem] border bg-background p-6">
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Input</p>
                            <p className="mt-2 text-5xl font-black text-primary">{inputOutputSummary.total}</p>
                            <p className="mt-2 text-sm font-bold text-muted-foreground">Total leads entered into this teamspace</p>
                        </div>
                        <div className="rounded-[1.5rem] border bg-background p-6">
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Output</p>
                            <p className="mt-2 text-5xl font-black text-primary">{inputOutputSummary.output}</p>
                            <p className="mt-2 text-sm font-bold text-muted-foreground">Completed, rejected, holding, or not connected</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black text-primary">Outcome Split</CardTitle>
                        <CardDescription className="font-medium">Quick output count across the five working stages.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <MiniStat label={getLeadStatusLabel('new')} value={inputOutputSummary.pending} />
                        <MiniStat label={getLeadStatusLabel('done')} value={inputOutputSummary.completed} />
                        <MiniStat label={getLeadStatusLabel('not intrested')} value={inputOutputSummary.rejected} />
                        <MiniStat label={getLeadStatusLabel('intrested')} value={inputOutputSummary.holding} />
                        <MiniStat label={getLeadStatusLabel('CNP')} value={inputOutputSummary.notConnected} />
                        <MiniStat label="Conversion" value={`${inputOutputSummary.conversion}%`} />
                    </CardContent>
                </Card>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                 <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black text-primary">Lead Source Distribution</CardTitle>
                        <CardDescription className="font-medium">Where your leads are coming from and which channels are creating volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoadingLeads && <Skeleton className="h-[360px] w-full rounded-2xl" />}
                       {!isLoadingLeads && (
                         <ResponsiveContainer width="100%" height={360}>
                            <PieChart>
                                <Pie
                                    data={leadSourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={120}
                                    innerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {leadSourceChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ 
                                        background: 'hsl(var(--background))', 
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                       )}
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black text-primary">Stage Movement</CardTitle>
                        <CardDescription className="font-medium">Modern lead-stage performance across the five CRM stages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingLeads ? (
                            <Skeleton className="h-[360px] w-full rounded-2xl" />
                        ) : (
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} interval={0} angle={-8} height={54} />
                                    <YAxis tick={{ fontSize: 12, fontWeight: 700 }} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{
                                            background: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                                        {stageData.map((entry, index) => (
                                            <Cell key={`stage-cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black text-primary">Pipeline Health</CardTitle>
                        <CardDescription className="font-medium">A fast read on whether the lead engine is moving.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {stageData.map((stage) => {
                            const percentage = totalLeads > 0 ? Math.round((stage.value / totalLeads) * 100) : 0;
                            return (
                                <div key={stage.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-black">
                                        <span>{stage.name}</span>
                                        <span className="text-muted-foreground">{stage.value} · {percentage}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black text-primary">Source Leaderboard</CardTitle>
                        <CardDescription className="font-medium">Ranked acquisition channels by lead count.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {leadSourceChartData.length === 0 ? (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-sm font-semibold text-muted-foreground">
                                No source data available yet.
                            </div>
                        ) : leadSourceChartData
                            .slice()
                            .sort((a, b) => b.value - a.value)
                            .map((source, index) => {
                                const percentage = totalLeads > 0 ? Math.round((source.value / totalLeads) * 100) : 0;
                                return (
                                    <div key={source.name} className="flex items-center gap-4 rounded-2xl border bg-background p-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">#{index + 1}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="truncate font-black text-primary">{source.name}</p>
                                                <p className="text-sm font-black">{source.value}</p>
                                            </div>
                                            <Progress value={percentage} className="mt-2 h-2" />
                                        </div>
                                        <Badge variant="secondary" className="rounded-xl">{percentage}%</Badge>
                                    </div>
                                );
                            })}
                    </CardContent>
                </Card>
            </section>

            <section className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-accent">Team Lead Outcomes</p>
                        <h2 className="mt-2 text-3xl font-black text-primary">TL Advanced Reports</h2>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                            Each TL report shows total input, output outcomes, and brief telecaller reports inside their team.
                        </p>
                    </div>
                    <Badge variant="secondary" className="rounded-2xl px-4 py-2 font-black">{teamLeadReports.length} TLs</Badge>
                </div>

                {isLoadingLeads || isLoadingUsers ? (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {[0, 1].map((item) => <Skeleton key={item} className="h-96 rounded-[2rem]" />)}
                    </div>
                ) : teamLeadReports.length === 0 ? (
                    <Card className="rounded-[2rem] border-primary/10">
                        <CardContent className="p-10 text-center text-sm font-semibold text-muted-foreground">
                            No Team Lead report data available yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {teamLeadReports.map((report) => (
                            <Card key={report.tl.id} className="overflow-hidden rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                                <CardHeader className="relative">
                                    <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
                                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-2xl font-black text-primary">{report.tl.displayName}</CardTitle>
                                            <CardDescription className="mt-1 font-semibold">{getProfessionalEmployeeId(report.tl)} · {report.telecallers.length} telecallers</CardDescription>
                                        </div>
                                        <Button asChild variant="outline" className="rounded-2xl font-black">
                                            <Link href={`/team/${report.tl.id}`}>Advanced View</Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <MiniStat label="Input" value={report.summary.total} />
                                        <MiniStat label="Output" value={report.summary.output} />
                                        <MiniStat label="Conversion" value={`${report.summary.conversion}%`} />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-5">
                                        <MiniStat label="Pending" value={report.summary.pending} />
                                        <MiniStat label="Done" value={report.summary.completed} />
                                        <MiniStat label="Rejected" value={report.summary.rejected} />
                                        <MiniStat label="Holding" value={report.summary.holding} />
                                        <MiniStat label="NC" value={report.summary.notConnected} />
                                    </div>
                                    <div>
                                        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Telecaller Brief Report</p>
                                        {report.telecallers.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed p-6 text-sm font-semibold text-muted-foreground">
                                                No telecallers are assigned under this TL yet.
                                            </div>
                                        ) : (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {report.telecallers.map((telecaller) => (
                                                    <TelecallerBriefCard
                                                        key={telecaller.id}
                                                        telecaller={telecaller}
                                                        leads={(leads || []).filter((lead) => lead.assignedToIds?.includes(telecaller.id))}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
