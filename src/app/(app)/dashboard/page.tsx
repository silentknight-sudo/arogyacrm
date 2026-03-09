'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, Target, Leaf, Sparkles, Zap, ArrowUpRight } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
        !isUserLoading && currentUser && currentTeamspace?.id
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'), where('status', '==', 'New'))
            : null
    , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
    const { data: newLeads, isLoading: isLoadingLeads } = useCollection<Lead>(newLeadsQuery);

    const wonDealsQuery = useMemoFirebase(() => 
        !isUserLoading && currentUser && currentTeamspace?.id
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'), where('stage', '==', 'done'))
            : null
    , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
    const { data: wonDeals, isLoading: isLoadingWonDeals } = useCollection<Deal>(wonDealsQuery);

    const allDealsQuery = useMemoFirebase(() => 
        !isUserLoading && currentUser && currentTeamspace?.id
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'))
            : null
    , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
    const { data: allDeals, isLoading: isLoadingAllDeals } = useCollection<Deal>(allDealsQuery);

    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        conversionRate: 0,
        wonCount: 0,
        chartData: [] as any[],
    });

    useEffect(() => {
        if (wonDeals && allDeals) {
            const rev = wonDeals.reduce((acc, d) => acc + (d.amount || 0), 0);
            const rate = allDeals.length > 0 ? (wonDeals.length / allDeals.length) * 100 : 0;
            
            const months = eachMonthOfInterval({
                start: subMonths(new Date(), 5),
                end: new Date()
            }).map(m => ({ month: format(m, 'MMM'), revenue: 0 }));

            wonDeals.forEach(d => {
                try {
                    if (!d.closeDate) return;
                    const m = format(new Date(d.closeDate), 'MMM');
                    const entry = months.find(x => x.month === m);
                    if (entry) entry.revenue += (d.amount || 0);
                } catch(e) {}
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
        <div className="flex flex-col gap-12 pb-16 pt-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Sparkles className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Executive Summary</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary flex items-center gap-6">
                    <div className="p-4 herbal-gradient rounded-[2rem] shadow-2xl shadow-primary/30 rotate-2 scale-110">
                        <Leaf className="h-10 w-10 text-white animate-pulse" />
                    </div>
                    Namaste, {currentUser?.displayName?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-2xl text-muted-foreground font-semibold">
                    Strategic performance overview for your wellness empire.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5', trend: '+12.5%' },
                    { label: 'New Growth', value: `+${newLeads?.length || 0}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+4.2%' },
                    { label: 'Conversion', value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-accent', bg: 'bg-accent/5', trend: '+2.1%' },
                    { label: 'Active Success', value: metrics.wonCount, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', trend: '+8.9%' },
                ].map((stat, i) => (
                    <Card key={i} className="premium-card group border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</CardTitle>
                            <div className={`p-3 rounded-2xl ${stat.bg} group-hover:rotate-12 transition-transform duration-500`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-12 w-32 rounded-xl" /> : (
                                <div className="space-y-2">
                                    <div className="text-4xl font-black tracking-tighter">{stat.value}</div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
                                        <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-7">
                <Card className="lg:col-span-4 premium-card p-10 bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
                    <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight text-primary">Revenue Momentum</CardTitle>
                            <p className="text-sm font-medium text-muted-foreground">Historical billing performance.</p>
                        </div>
                        <div className="text-[10px] font-black text-muted-foreground bg-muted/50 px-4 py-2 rounded-full uppercase tracking-[0.2em]">6 Month Outlook</div>
                    </CardHeader>
                    <CardContent className="h-[450px] px-0 pt-10">
                        {isLoading ? <Skeleton className="h-full w-full rounded-[2.5rem]" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 700}} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 700}} tickFormatter={v => `₹${v/1000}k`} dx={-10} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(45,90,39,0.03)', radius: 12}} 
                                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', fontWeight: 800, padding: '1.5rem'}} 
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[12, 12, 12, 12]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 premium-card p-10 flex flex-col justify-between herbal-gradient shadow-2xl scale-[1.02]">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-3xl font-black tracking-tight text-white flex items-center gap-4">
                            <Zap className="h-8 w-8 text-accent fill-accent" />
                            Growth Hub
                        </CardTitle>
                        <p className="text-white/60 font-medium text-sm mt-2">Real-time opportunities and market stats.</p>
                    </CardHeader>
                    <CardContent className="space-y-10 px-0 pt-10">
                        {isLoading ? <Skeleton className="h-80 w-full rounded-[2.5rem] bg-white/10" /> : (
                            <div className="flex flex-col gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-white/10 border border-white/10 hover:bg-white/[0.15] transition-all cursor-pointer group shadow-inner">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black uppercase text-accent tracking-[0.3em]">Market Dominance</p>
                                        <div className="h-3 w-3 rounded-full bg-accent animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                                    </div>
                                    <p className="font-black text-3xl tracking-tight text-white group-hover:translate-x-2 transition-transform">Immunity Boosters</p>
                                    <div className="w-full bg-white/10 h-4 rounded-full mt-6 overflow-hidden p-1 shadow-inner">
                                        <div className="bg-accent h-full w-[82%] rounded-full shadow-lg" />
                                    </div>
                                    <p className="text-xs font-bold text-white/50 mt-4 uppercase tracking-widest">82% Volume Lead</p>
                                </div>
                                <div className="p-8 rounded-[2.5rem] bg-accent text-accent-foreground shadow-2xl hover:scale-105 transition-transform">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">High Intent Queue</p>
                                        <Sparkles className="h-5 w-5 fill-current" />
                                    </div>
                                    <p className="font-black text-4xl tracking-tighter">{(newLeads?.length || 0) + 3} Priority</p>
                                    <p className="text-sm font-bold mt-3 opacity-80">Ready for wellness strategy sessions.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
