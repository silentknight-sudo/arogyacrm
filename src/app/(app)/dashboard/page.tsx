'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, TrendingUp, Users, Wallet, Leaf, Sparkles, Activity,
  ArrowUpRight, Trophy, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Lead, Deal } from '@/types';

export default function Dashboard() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();

  const isAdmin = currentUser?.role === 'admin';

  // Strategic Data Scoping
  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collectionGroup(firestore, 'leads'));
    if (!currentTeamspace) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'));
  }, [firestore, currentUser, currentTeamspace, isAdmin, isUserLoading]);

  const dealsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collectionGroup(firestore, 'deals'));
    if (!currentTeamspace) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'));
  }, [firestore, currentUser, currentTeamspace, isAdmin, isUserLoading]);

  const { data: leads, isLoading: loadingLeads } = useCollection<Lead>(leadsQuery);
  const { data: deals, isLoading: loadingDeals } = useCollection<Deal>(dealsQuery);

  const stats = useMemo(() => {
    const totalLeads = leads?.length || 0;
    const freshLeads = leads?.filter(l => l.status === 'new').length || 0;
    const totalRevenue = deals?.filter(d => d.stage === 'done').reduce((acc, d) => acc + (d.amount || 0), 0) || 0;
    const winRate = deals?.length ? ((deals.filter(d => d.stage === 'done').length / deals.length) * 100).toFixed(1) : 0;

    return { totalLeads, freshLeads, totalRevenue, winRate };
  }, [leads, deals]);

  if (isUserLoading || loadingLeads || loadingDeals) {
    return (
      <div className="space-y-12 p-8">
        <Skeleton className="h-20 w-96 rounded-[2rem]" />
        <div className="grid gap-8 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-16 pt-4 animate-in fade-in duration-1000">
      {/* STRATEGIC HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-accent mb-1">
          <Sparkles className="h-5 w-5 fill-accent" />
          <span className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Strategic Command</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-8">
          <h1 className="text-7xl font-black tracking-tighter text-primary flex items-center gap-6">
            <div className="p-5 herbal-gradient rounded-[2.5rem] shadow-2xl gold-glow rotate-3 scale-110">
              <Leaf className="h-12 w-12 text-white" />
            </div>
            Namaste, {currentUser?.displayName?.split(' ')[0]}
          </h1>
          <div className="flex items-center gap-6 bg-white/40 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-white/20 shadow-xl">
             <div className="px-8 py-2 border-r border-primary/10 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Operations</p>
                <div className="flex items-center gap-2">
                   <Activity className="h-4 w-4 text-green-500" />
                   <span className="text-xl font-black text-primary">Live</span>
                </div>
             </div>
             <div className="px-8 py-2 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Workspace</p>
                <Badge variant="outline" className="rounded-full font-black border-primary/20 text-primary">{currentTeamspace?.name || 'Global'}</Badge>
             </div>
          </div>
        </div>
      </div>

      {/* CORE METRICS */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: Wallet, trend: '+12%', desc: 'Verified Billings' },
          { label: 'Growth Assets', value: stats.totalLeads, icon: Users, trend: '+5%', desc: 'Prospect Pipeline' },
          { label: 'Fresh Arrivals', value: stats.freshLeads, icon: Target, trend: 'NEW', desc: 'Ready for allocation' },
          { label: 'Efficiency', value: `${stats.winRate}%`, icon: TrendingUp, trend: '+2%', desc: 'Conversion Velocity' },
        ].map((stat, i) => (
          <Card key={i} className="premium-card group overflow-hidden border-none relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</CardTitle>
              <stat.icon className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-5xl font-black tracking-tighter text-primary">{stat.value}</div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{stat.trend}</span>
                  <span className="text-[10px] font-bold text-muted-foreground italic">{stat.desc}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LEADERSHIP PANEL */}
      <div className="grid gap-10 lg:grid-cols-7">
         <Card className="lg:col-span-4 premium-card p-10 bg-white/40 backdrop-blur-3xl border-white/20 shadow-2xl">
            <CardHeader className="px-0 pt-0">
               <CardTitle className="text-3xl font-black tracking-tight text-primary flex items-center gap-4">
                 <Zap className="h-8 w-8 text-accent fill-accent" />
                 Operational Velocity
               </CardTitle>
               <CardDescription className="text-lg font-medium">Real-time engagement across your workspaces.</CardDescription>
            </CardHeader>
            <div className="mt-12 h-64 flex items-center justify-center border-2 border-dashed border-primary/10 rounded-[3rem] text-muted-foreground/40 font-black uppercase tracking-widest text-sm">
               Revenue Projection Terminal
            </div>
         </Card>

         <Card className="lg:col-span-3 premium-card p-10 herbal-gradient shadow-2xl gold-glow border-none">
            <CardHeader className="px-0 pt-0">
               <CardTitle className="text-3xl font-black text-white flex items-center gap-4">
                 <Trophy className="h-8 w-8 text-accent" />
                 Elite Performers
               </CardTitle>
               <CardDescription className="text-white/60 font-medium italic">Highest contributing wellness specialists.</CardDescription>
            </CardHeader>
            <div className="mt-8 space-y-6">
               <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 text-center italic text-white/40 font-medium">
                  Aggregating specialist data...
               </div>
               <div className="p-8 rounded-[2.5rem] bg-accent text-accent-foreground shadow-2xl shadow-accent/20 hover:scale-105 transition-transform group cursor-pointer">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Global Impact</p>
                  <p className="font-black text-4xl tracking-tighter">{stats.totalLeads} Strategic Assets</p>
                  <p className="text-sm font-bold mt-4 flex items-center gap-2">
                    Managed with elite precision <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </p>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}