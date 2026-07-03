'use client';
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
import type { Lead } from '@/types';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, CheckCircle2, CirclePause, LineChart, PhoneOff, ShieldX, Sparkles, Target, Users } from 'lucide-react';
import { getLeadStatusLabel } from '@/lib/status-labels';

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

export default function ReportsPage() {
    const { currentTeamspace, currentUser, isUserLoading } = useApp();
    const firestore = useFirestore();

    const leadsQuery = useMemoFirebase(() =>
        !isUserLoading && currentUser && currentTeamspace
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);

    const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

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
        </div>
    );
}
