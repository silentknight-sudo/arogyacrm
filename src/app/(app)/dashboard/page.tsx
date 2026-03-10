'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    DollarSign, Users, TrendingUp, Target, Leaf, Sparkles, Zap, 
    ArrowUpRight, BarChart3, Trophy, Activity, ChevronRight, UserCheck, AlertCircle
} from 'lucide-react';
import { 
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, 
    CartesianGrid, Line, LineChart, Cell, Pie, PieChart 
} from 'recharts';
import { useApp } from '@/context/app-context';
import type { Lead, Deal, UserProfile } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { subMonths, format, eachMonthOfInterval, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = ['#2D5A27', '#D4AF37', '#4ade80', '#fbbf24', '#1A3A17'];

export default function Dashboard() {
    const { currentUser, currentTeamspace, isUserLoading, areTeamspacesLoading } = useApp();
    const firestore = useFirestore();

    // 1. DATA FETCHING: Role-Based Intelligence
    const isAdmin = currentUser?.role === 'admin';
    const isTL = currentUser?.role === 'sales_team_lead';

    // Fetch deals
    const allDealsQuery = useMemoFirebase(() => {
        if (isUserLoading || !currentUser) return null;
        if (isAdmin) return query(collectionGroup(firestore, 'deals'));
        if (!currentTeamspace) return null;
        
        const dealsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'deals');
        if (isTL) return query(dealsRef);
        return query(dealsRef, where('ownerId', '==', currentUser.id));
    }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, isAdmin, isTL]);

    const { data: deals, isLoading: isLoadingDeals } = useCollection<Deal>(allDealsQuery);

    // Fetch leads
    const allLeadsQuery = useMemoFirebase(() => {
        if (isUserLoading || !currentUser) return null;
        if (isAdmin) return query(collectionGroup(firestore, 'leads'));
        if (!currentTeamspace) return null;

        const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
        if (isTL) return query(leadsRef);
        return query(leadsRef, where('assignedToIds', 'array-contains', currentUser.id));
    }, [firestore, currentTeamspace?.id, currentUser, isUserLoading, isAdmin, isTL]);

    const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(allLeadsQuery);

    // Fetch users for leaderboard: Strict Creator Lock for Team Leads
    const usersQuery = useMemoFirebase(() => {
        if (isUserLoading || !currentUser) return null;
        if (isAdmin) return query(collection(firestore, 'users'), where('role', '==', 'sales_team_lead'));
        if (isTL) {
            // Team Leads only see and track members they personally onboarded
            return query(collection(firestore, 'users'), where('createdBy', '==', currentUser.id));
        }
        return null;
    }, [firestore, currentUser, isUserLoading, isAdmin, isTL]);

    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    // 2. METRICS CALCULATION
    const metrics = useMemo(() => {
        const safeDeals = deals || [];
        const safeLeads = leads || [];
        const safeUsers = users || [];

        const wonDeals = safeDeals.filter(d => d.stage === 'done');
        const totalRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const conversionRate = safeDeals.length > 0 ? (wonDeals.length / safeDeals.length) * 100 : 0;
        
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date()
        }).map(m => ({
            month: format(m, 'MMM'),
            revenue: 0,
            leads: 0
        }));

        wonDeals.forEach(d => {
            if (!d.closeDate) return;
            try {
                const date = new Date(d.closeDate);
                if (!isValid(date)) return;
                const m = format(date, 'MMM');
                const entry = months.find(x => x.month === m);
                if (entry) entry.revenue += (Number(d.amount) || 0);
            } catch (e) {}
        });

        safeLeads.forEach(l => {
            if (!l.createdAt) return;
            try {
                const date = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
                if (!isValid(date)) return;
                const m = format(date, 'MMM');
                const entry = months.find(x => x.month === m);
                if (entry) entry.leads += 1;
            } catch (e) {}
        });

        const leaderboard = safeUsers
            .map(user => {
                const userDeals = safeDeals.filter(d => d.ownerId === user.id && d.stage === 'done');
                const userRevenue = userDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                return {
                    ...user,
                    revenue: userRevenue,
                    dealCount: userDeals.length
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            totalRevenue,
            conversionRate,
            wonCount: wonDeals.length,
            leadsCount: safeLeads.length,
            chartData: months,
            leaderboard
        };
    }, [deals, leads, users]);

    const isLoading = isUserLoading || isLoadingDeals || isLoadingLeads || isLoadingUsers || areTeamspacesLoading;
    const isContextReady = isAdmin || !!currentTeamspace;
    const isError = !isLoading && isContextReady && (deals === null || leads === null);
    const noWorkspaces = !isUserLoading && !areTeamspacesLoading && !isAdmin && (!currentUser?.teamspaceIds || currentUser.teamspaceIds.length === 0);

    if (isLoading) {
        return (
            <div className="space-y-12 pb-16 pt-4">
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <Skeleton className="h-6 w-96 rounded-lg" />
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid gap-10 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 h-[500px] rounded-[2.5rem]" />
                    <Skeleton className="lg:col-span-3 h-[500px] rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    if (noWorkspaces) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className="p-6 rounded-full bg-muted/50">
                    <UserCheck className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-primary">Workspace Required</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your account is not currently assigned to any teamspaces. Please contact an administrator.
                    </p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className="p-6 rounded-full bg-muted/50">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-primary">Strategic Hub Offline</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        We couldn't retrieve your operational data. This usually happens during security rule propagation.
                    </p>
                </div>
                <Alert className="max-w-md border-primary/10 bg-primary/5">
                    <Zap className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        Try adding a new Prospect or Deal to trigger synchronization.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const roleTitle = isAdmin ? 'Global Empire' : isTL ? 'Team Headquarters' : 'Personal Desk';

    return (
        <div className="flex flex-col gap-12 pb-16 pt-4">
            {/* STRATEGIC HEADER */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Sparkles className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">{roleTitle} Overview</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-6">
                    <h1 className="text-6xl font-black tracking-tighter text-primary flex items-center gap-6">
                        <div className="p-4 herbal-gradient rounded-[2rem] shadow-2xl shadow-primary/30 rotate-2 scale-110">
                            <Leaf className="h-10 w-10 text-white animate-pulse" />
                        </div>
                        Namaste, {currentUser?.displayName?.split(' ')[0]}
                    </h1>
                    <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] border border-primary/5 shadow-inner">
                        <div className="px-6 py-2 border-r border-primary/10">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pipeline Status</p>
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-[#4ade80]" />
                                <span className="text-lg font-black text-primary">Operational</span>
                            </div>
                        </div>
                        <div className="px-6 py-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Workspace</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full font-black border-primary/20 text-primary">{currentTeamspace?.name || 'Global Catalog'}</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KEY METRIC CARDS */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Revenue', value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary', trend: '+12.5%', desc: 'Verified Billings' },
                    { label: 'Growth Leads', value: `+${metrics.leadsCount}`, icon: Users, color: 'text-blue-600', trend: '+4.2%', desc: 'Prospect Momentum' },
                    { label: 'Conversion', value: `${metrics.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-accent', trend: '+2.1%', desc: 'Efficiency' },
                    { label: 'Won Success', value: metrics.wonCount, icon: TrendingUp, color: 'text-[#4ade80]', trend: '+8.9%', desc: 'Cycles' },
                ].map((stat, i) => (
                    <Card key={i} className="premium-card group border-none shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-4xl font-black tracking-tighter text-primary">{stat.value}</div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground italic">{stat.desc}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* VISUALIZATIONS */}
            <div className="grid gap-10 lg:grid-cols-7">
                <Card className="lg:col-span-4 premium-card p-10 bg-white/40 backdrop-blur-3xl border-white/20 shadow-2xl">
                    <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight text-primary">Revenue Momentum</CardTitle>
                            <CardDescription className="text-sm font-bold text-muted-foreground">Comparative billing and prospect velocity.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="rounded-full bg-primary/10 text-primary border-none px-4 py-1 font-black text-[10px] uppercase">Revenue</Badge>
                            <Badge className="rounded-full bg-blue-100 text-blue-600 border-none px-4 py-1 font-black text-[10px] uppercase">Leads</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[450px] px-0 pt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.chartData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2D5A27" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#1A3A17" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 800}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 800}} tickFormatter={v => `₹${v/1000}k`} dx={-10} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(45,90,39,0.03)', radius: 12}} 
                                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', fontWeight: 800, padding: '1.5rem', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)'}} 
                                />
                                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[12, 12, 12, 12]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 premium-card p-10 herbal-gradient shadow-2xl border-none">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-accent rounded-2xl shadow-xl shadow-accent/20">
                                <Trophy className="h-6 w-6 text-accent-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-3xl font-black tracking-tight text-white">{isAdmin ? 'Leaderboard' : 'Top Specialists'}</CardTitle>
                                <CardDescription className="text-white/60 font-bold">{isAdmin ? 'Aggregated Team Lead Performance' : 'Highest contributing recruits'}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 px-0 pt-8">
                        {metrics.leaderboard.length > 0 ? metrics.leaderboard.map((user, idx) => (
                            <div key={user.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-accent/20 ring-4 ring-white/5">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-white/10 text-white font-black">{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-accent-foreground shadow-lg">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-white text-lg tracking-tight group-hover:text-accent transition-colors">{user.displayName}</span>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{user.role.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-white tracking-tighter">₹{user.revenue.toLocaleString()}</div>
                                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{user.dealCount} Successful Cycles</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 italic text-white/40 font-medium">
                                No performance data for your recruits.
                            </div>
                        )}
                        
                        <div className="mt-8 p-8 rounded-[2.5rem] bg-accent text-accent-foreground shadow-2xl hover:scale-105 transition-transform group cursor-pointer">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Global Dominance</p>
                                <Sparkles className="h-5 w-5 fill-current" />
                            </div>
                            <p className="font-black text-4xl tracking-tighter">{(metrics.leadsCount)} Priority Prospects</p>
                            <p className="text-sm font-bold mt-3 opacity-80 flex items-center gap-2">
                                Ready for wellness strategy sessions <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
