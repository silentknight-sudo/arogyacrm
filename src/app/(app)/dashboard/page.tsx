'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { useApp } from '@/context/app-context';
import type { Lead, Deal } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';


export default function Dashboard() {
    const { currentUser, currentTeamspace } = useApp();
    const firestore = useFirestore();

    const newLeadsQuery = useMemoFirebase(() => 
        currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'), where('status', '==', 'New'))
            : null
    , [firestore, currentTeamspace]);
    const { data: newLeads, isLoading: isLoadingLeads } = useCollection<Lead>(newLeadsQuery);

    const wonDealsQuery = useMemoFirebase(() => 
        currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'), where('stage', '==', 'Won'))
            : null
    , [firestore, currentTeamspace]);
    const { data: wonDeals, isLoading: isLoadingWonDeals } = useCollection<Deal>(wonDealsQuery);

    const allDealsQuery = useMemoFirebase(() => 
        currentTeamspace 
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'))
            : null
    , [firestore, currentTeamspace]);
    const { data: allDeals, isLoading: isLoadingAllDeals } = useCollection<Deal>(allDealsQuery);

    const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
    const [conversionRate, setConversionRate] = useState<number | null>(null);
    const [dealsWonCount, setDealsWonCount] = useState<number | null>(null);
    const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ month: string, revenue: number }>>([]);

    useEffect(() => {
        if (wonDeals) {
            const calculatedTotalRevenue = wonDeals.reduce((acc, deal) => acc + deal.amount, 0);
            setTotalRevenue(calculatedTotalRevenue);
            setDealsWonCount(wonDeals.length);

            // Calculate monthly revenue for the last 12 months
            const twelveMonthsAgo = subMonths(new Date(), 11);
            const today = new Date();
            const interval = { start: startOfMonth(twelveMonthsAgo), end: endOfMonth(today) };
            
            const months = eachMonthOfInterval(interval).map(d => ({
                month: format(d, 'MMM'),
                revenue: 0,
            }));

            const revenueByMonth = months.reduce((acc, monthData) => {
                acc[monthData.month] = 0;
                return acc;
            }, {} as Record<string, number>);
            
            wonDeals.forEach(deal => {
                const closeDate = new Date(deal.closeDate);
                if (closeDate >= interval.start && closeDate <= interval.end) {
                    const month = format(closeDate, 'MMM');
                    if (revenueByMonth[month] !== undefined) {
                      revenueByMonth[month] += deal.amount;
                    }
                }
            });

            const chartData = Object.keys(revenueByMonth).map(month => ({
                month: month,
                revenue: revenueByMonth[month] || 0,
            }));

            setMonthlyRevenue(chartData);
        }

        if (allDeals && wonDeals) {
             const calculatedConversionRate = allDeals.length > 0 ? (wonDeals.length / allDeals.length) * 100 : 0;
             setConversionRate(calculatedConversionRate);
        }
        
        if (newLeads) {
            setRecentLeads(newLeads.slice(0, 5));
        }

    }, [newLeads, wonDeals, allDeals]);
    
    const isLoadingMetrics = isLoadingLeads || isLoadingWonDeals || isLoadingAllDeals;

    return (
        <div className="flex flex-1 flex-col gap-4">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser?.displayName?.split(' ')[0]}!</h1>
                <p className="text-muted-foreground">Here's a snapshot of your business performance.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{!isLoadingMetrics && totalRevenue !== null ? `₹${totalRevenue.toLocaleString('en-IN')}` : 'Loading...'}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{!isLoadingMetrics && newLeads ? `+${newLeads.length}` : 'Loading...'}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{!isLoadingMetrics && conversionRate !== null ? `${conversionRate.toFixed(1)}%` : 'Loading...'}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{!isLoadingMetrics && dealsWonCount !== null ? `+${dealsWonCount}` : 'Loading...'}</div>
                </CardContent>
            </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyRevenue}>
                    <XAxis
                        dataKey="month"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value / 1000}K`}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ 
                            background: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="revenue"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                    />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                    You have {newLeads?.length || 0} new leads this month.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoadingLeads ? (
                           <p className="text-sm text-muted-foreground">Loading recent leads...</p>
                        ) : recentLeads.length > 0 ? recentLeads.map(lead => (
                            <div key={lead.id} className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{`${lead.firstName} ${lead.lastName}`}</p>
                                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                                </div>
                                <div className="ml-auto font-medium">{lead.source}</div>
                            </div>
                        )) : (
                           <p className="text-sm text-muted-foreground">No new leads this month.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
