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
import type { Lead, Deal, UserProfile } from '@/types';
import { getPerformanceSummary, RolePerformancePanel } from '@/components/role-performance-panel';

export default function Dashboard() {
  const { currentUser, currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();

  const isAdmin = currentUser?.role === 'admin';
  const isSalesExecutive = currentUser?.role === 'sales_executive';

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

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser) return null;
    if (isAdmin) return query(collection(firestore, 'users'));
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentUser, currentTeamspace?.id, isAdmin, isUserLoading]);

  const { data: leads, isLoading: loadingLeads } = useCollection<Lead>(leadsQuery);
  const { data: deals, isLoading: loadingDeals } = useCollection<Deal>(dealsQuery);
  const { data: users, isLoading: loadingUsers } = useCollection<UserProfile>(usersQuery);

  const stats = useMemo(() => {
    const totalLeads = leads?.length || 0;
    const freshLeads = leads?.filter(l => l.status === 'new').length || 0;
    const totalRevenue = deals?.filter(d => d.stage === 'done').reduce((acc, d) => acc + (d.amount || 0), 0) || 0;
    const winRate = deals?.length ? ((deals.filter(d => d.stage === 'done').length / deals.length) * 100).toFixed(1) : 0;

    return { totalLeads, freshLeads, totalRevenue, winRate };
  }, [leads, deals]);

  const operationsSnapshot = useMemo(() => {
    const leadList = leads || [];
    const total = leadList.length || 1;
    const stageCounts = [
      { label: 'Fresh', value: leadList.filter((lead) => lead.status === 'new').length, color: 'bg-sky-500' },
      { label: 'Interested', value: leadList.filter((lead) => lead.status === 'intrested').length, color: 'bg-emerald-500' },
      { label: 'CNP', value: leadList.filter((lead) => lead.status === 'CNP').length, color: 'bg-amber-500' },
      { label: 'Closed', value: leadList.filter((lead) => lead.status === 'done').length, color: 'bg-primary' },
    ];

    const recentLeads = [...leadList]
      .sort((a, b) => {
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);

    const remindersDue = leadList.filter((lead) => {
      if (!lead.reminderAt) return false;
      const reminderDate = lead.reminderAt?.toDate ? lead.reminderAt.toDate() : new Date(lead.reminderAt);
      return reminderDate <= new Date() && !lead.reminderNotifiedAt;
    }).length;

    return {
      stageCounts: stageCounts.map((stage) => ({
        ...stage,
        percent: Math.round((stage.value / total) * 100),
      })),
      recentLeads,
      remindersDue,
    };
  }, [leads]);

  const elitePerformers = useMemo(() => {
    const leadList = leads || [];
    const userList = users || [];

    return userList
      .filter((user) => ['sales_team_lead', 'sales_executive'].includes(user.role))
      .map((user) => {
        const summary = getPerformanceSummary(user, leadList, userList);
        return {
          user,
          summary,
          score: summary.closed * 100 + summary.interested * 10 + summary.total,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [leads, users]);

  if (isUserLoading || loadingLeads || loadingDeals || loadingUsers) {
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
      {!isSalesExecutive && (
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
      )}

      {/* LEADERSHIP PANEL */}
      <div className="grid gap-10 lg:grid-cols-7">
         <Card className="lg:col-span-4 premium-card p-10 bg-white/40 backdrop-blur-3xl border-white/20 shadow-2xl">
            <CardHeader className="px-0 pt-0">
               <CardTitle className="text-3xl font-black tracking-tight text-primary flex items-center gap-4">
                 <Zap className="h-8 w-8 text-accent fill-accent" />
                 Operational Velocity
               </CardTitle>
               <CardDescription className="text-lg font-medium">Live pipeline stage mix, reminders, and latest movement.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-8 pb-0 space-y-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[2rem] border border-primary/10 bg-background/80 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground mb-2">Reminders Due</p>
                  <p className="text-4xl font-black tracking-tight text-primary">{operationsSnapshot.remindersDue}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Pending call reminders waiting for action.</p>
                </div>
                <div className="rounded-[2rem] border border-primary/10 bg-background/80 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground mb-2">Open Pipeline</p>
                  <p className="text-4xl font-black tracking-tight text-primary">
                    {operationsSnapshot.stageCounts[0].value + operationsSnapshot.stageCounts[1].value + operationsSnapshot.stageCounts[2].value}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Leads still active inside the follow-up cycle.</p>
                </div>
                <div className="rounded-[2rem] border border-primary/10 bg-background/80 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground mb-2">Closed Wins</p>
                  <p className="text-4xl font-black tracking-tight text-primary">{operationsSnapshot.stageCounts[3].value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-2">Completed leads converted through the current workflow.</p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2.5rem] border border-primary/10 bg-background/75 p-6 shadow-inner">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-muted-foreground mb-5">Stage Distribution</p>
                  <div className="space-y-5">
                    {operationsSnapshot.stageCounts.map((stage) => (
                      <div key={stage.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="text-primary">{stage.label}</span>
                          <span className="text-muted-foreground">{stage.value} leads</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${stage.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-primary/10 bg-background/75 p-6 shadow-inner">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-muted-foreground mb-5">Recent Lead Movement</p>
                  <div className="space-y-4">
                    {operationsSnapshot.recentLeads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-primary/10 p-6 text-sm font-medium text-muted-foreground italic">
                        No lead movement yet in this workspace.
                      </div>
                    ) : (
                      operationsSnapshot.recentLeads.map((lead) => {
                        const updatedAt = lead.updatedAt?.toDate ? lead.updatedAt.toDate() : new Date(lead.updatedAt || Date.now());
                        return (
                          <div key={lead.id} className="rounded-2xl border border-primary/10 bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-primary">{lead.fullName}</p>
                                <p className="text-xs font-medium text-muted-foreground">{lead.phone || lead.email || 'No contact info'}</p>
                              </div>
                              <Badge variant="secondary" className="uppercase text-[10px] font-black">
                                {lead.status}
                              </Badge>
                            </div>
                            <p className="mt-3 text-xs font-medium text-muted-foreground">
                              Updated {updatedAt.toLocaleDateString()} at {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
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
               <div className="space-y-4">
                  {elitePerformers.length === 0 ? (
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 text-center italic text-white/40 font-medium">
                      No specialist activity available yet.
                    </div>
                  ) : (
                    elitePerformers.map((performer, index) => (
                      <div key={performer.user.id} className="rounded-[2rem] bg-white/8 border border-white/10 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50 mb-2">
                              Rank #{index + 1}
                            </p>
                            <p className="text-2xl font-black text-white tracking-tight">{performer.user.displayName}</p>
                            <p className="text-xs font-medium text-white/60 capitalize">
                              {performer.user.role.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-white border-none">
                            {performer.summary.closed} closed
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4 text-sm font-bold text-white">
                          <div className="rounded-xl bg-black/10 p-3">
                            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Total</p>
                            <p>{performer.summary.total}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 p-3">
                            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Interested</p>
                            <p>{performer.summary.interested}</p>
                          </div>
                          <div className="rounded-xl bg-black/10 p-3">
                            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Win Rate</p>
                            <p>{performer.summary.conversionRate}%</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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

      {currentUser && !isAdmin && leads && users && (
        <RolePerformancePanel subject={currentUser} leads={leads} users={users} />
      )}

      {isAdmin && currentUser && leads && users && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-primary">Employee Performance Grid</CardTitle>
            <CardDescription className="font-medium">
              Separate performance boxes for every team leader and sales executive.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users
              .filter((user) => ['sales_team_lead', 'sales_executive'].includes(user.role))
              .map((user) => {
                const summary = getPerformanceSummary(user, leads, users);
                return (
                  <div key={user.id} className="rounded-2xl border border-primary/10 bg-muted/20 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-primary">{user.displayName}</p>
                        <p className="text-xs font-medium text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{user.role.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                      <div className="rounded-xl bg-background p-3">Total: {summary.total}</div>
                      <div className="rounded-xl bg-background p-3">Fresh: {summary.fresh}</div>
                      <div className="rounded-xl bg-background p-3">Interested: {summary.interested}</div>
                      <div className="rounded-xl bg-background p-3">Closed: {summary.closed}</div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
