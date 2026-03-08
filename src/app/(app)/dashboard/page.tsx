'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, Target, Leaf, Sparkles } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useApp } from '@/context/app-context';
import type { Lead, Deal } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
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
            
            // Generate last 6 months for chart
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
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-primary flex items-center gap-3">
                    <Leaf className="h-8 w-8 text-accent animate-pulse" />
                    Namaste, {currentUser?.displayName?.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground font-medium">Empowering wellness through smart insights.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
                    { label: 'New Leads', value: `+${newLeads?.length || 0}`, icon: Users, color: 'text-blue-600' },
                    { label: 'Conversion', value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-accent' },
                    { label: 'Deals Won', value: metrics.wonCount, icon: TrendingUp, color: 'text-green-600' },
                ].map((stat, i) => (
                    <Card key={i} className="premium-card overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-black">{stat.value}</div>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 premium-card p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-accent" />
                            Revenue Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] px-0">
                        {isLoading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.chartData}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickFormatter={v => `₹${v/1000}k`} />
                                    <Tooltip cursor={{fill: 'rgba(45,90,39,0.05)'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 premium-card p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl">Growth Focus</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? <Skeleton className="h-64 w-full" /> : (
                            <div className="flex flex-col gap-4">
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs font-bold uppercase text-primary/60 mb-1">Top Performer</p>
                                    <p className="font-bold text-lg">Immunity Boosters</p>
                                    <div className="w-full bg-primary/10 h-2 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-primary h-full w-[75%]" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                                    <p className="text-xs font-bold uppercase text-accent/60 mb-1">High Intent Leads</p>
                                    <p className="font-bold text-lg">{newLeads?.filter(l => (l.score || 0) > 80).length || 0} Ready to Convert</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
