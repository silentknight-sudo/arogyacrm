'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, Target, Leaf, Sparkles, Zap } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useApp } from '@/context/app-context';
import type { Lead, Deal } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { subMonths, format, eachMonthOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
    const { currentUser, currentTeamspace, isUserLoading } = useApp();
    const firestore = useFirestore();

    const newLeadsQuery = useMemoFirebase(() => 
        !isUserLoading && currentUser && currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'), where('status', '==', 'New'))
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);
    const { data: newLeads, isLoading: isLoadingLeads } = useCollection<Lead>(newLeadsQuery);

    const wonDealsQuery = useMemoFirebase(() => 
        !isUserLoading && currentUser && currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'), where('stage', '==', 'Won'))
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);
    const { data: wonDeals, isLoading: isLoadingWonDeals } = useCollection<Deal>(wonDealsQuery);

    const allDealsQuery = useMemoFirebase(() => 
        !isUserLoading && currentUser && currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'))
            : null
    , [firestore, currentTeamspace, currentUser, isUserLoading]);
    const { data: allDeals, isLoading: isLoadingAllDeals } = useCollection<Deal>(allDealsQuery);

    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        conversionRate: 0,
        wonCount: 0,
        chartData: [] as any[],
    });

    useEffect(() => {
        if (wonDeals && allDeals) {
            const rev = wonDeals.reduce((acc, d) => acc + d.amount, 0);
            const rate = allDeals.length > 0 ? (wonDeals.length / allDeals.length) * 100 : 0;
            
            const months = eachMonthOfInterval({
                start: subMonths(new Date(), 5),
                end: new Date()
            }).map(m => ({ month: format(m, 'MMM'), revenue: 0 }));

            wonDeals.forEach(d => {
                const m = format(new Date(d.closeDate), 'MMM');
                const entry = months.find(x => x.month === m);
                if (entry) entry.revenue += d.amount;
            });

            setMetrics({
                totalRevenue: rev,
                conversionRate: rate,
                wonCount: wonDeals.length,
                chartData: months
            });
        }
    }, [wonDeals, allDeals]);

    const isLoading = isUserLoading || isLoadingLeads || isLoadingWonDeals || isLoadingAllDeals;

    return (
        <div className="flex flex-col gap-10 pb-12">
            <div className="flex flex-col gap-3">
                <h1 className="text-5xl font-black tracking-tighter text-primary flex items-center gap-4">
                    <div className="p-3 herbal-gradient rounded-3xl shadow-xl shadow-primary/20 rotate-3">
                        <Leaf className="h-10 w-10 text-white animate-pulse" />
                    </div>
                    Namaste, {currentUser?.displayName?.split(' ')[0]}
                </h1>
                <p className="text-xl text-muted-foreground font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Elevating your wellness enterprise performance.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'New Growth', value: `+${newLeads?.length || 0}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Conversion', value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/5' },
                    { label: 'Active Success', value: metrics.wonCount, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <Card key={i} className="premium-card overflow-hidden group">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</CardTitle>
                            <div className={`p-2.5 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-10 w-32" /> : <div className="text-4xl font-black tracking-tighter">{stat.value}</div>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-7">
                <Card className="lg:col-span-4 premium-card p-8">
                    <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-accent" />
                            Revenue Momentum
                        </CardTitle>
                        <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full uppercase tracking-widest">Last 6 Months</div>
                    </CardHeader>
                    <CardContent className="h-[400px] px-0 pt-6">
                        {isLoading ? <Skeleton className="h-full w-full rounded-3xl" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.chartData}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600}} tickFormatter={v => `₹${v/1000}k`} />
                                    <Tooltip cursor={{fill: 'rgba(45,90,39,0.03)'}} contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', fontWeight: 700}} />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} barSize={45} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 premium-card p-8 flex flex-col justify-between">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Zap className="h-6 w-6 text-accent" />
                            Growth Hub
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 px-0">
                        {isLoading ? <Skeleton className="h-72 w-full rounded-3xl" /> : (
                            <div className="flex flex-col gap-6">
                                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 hover:bg-primary/[0.08] transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em]">Top Category</p>
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <p className="font-black text-2xl tracking-tight group-hover:text-primary transition-colors">Immunity Boosters</p>
                                    <div className="w-full bg-primary/10 h-3 rounded-full mt-4 overflow-hidden shadow-inner">
                                        <div className="bg-primary h-full w-[82%] rounded-full shadow-lg" />
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground mt-3">82% Market Dominance</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-accent/5 border border-accent/10 hover:bg-accent/[0.08] transition-colors cursor-pointer group">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase text-accent/60 tracking-[0.2em]">High Intent pipeline</p>
                                        <Sparkles className="h-4 w-4 text-accent" />
                                    </div>
                                    <p className="font-black text-2xl tracking-tight group-hover:text-accent transition-colors">{newLeads?.filter(l => (l.score || 0) > 80).length || 0} Priority Leads</p>
                                    <p className="text-xs font-bold text-muted-foreground mt-3">Ready for conversion within 48h.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
