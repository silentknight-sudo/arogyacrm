'use client';
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
import { revenueData, leads, deals } from '@/lib/data';
import { useApp } from '@/context/app-context';

export default function Dashboard() {
    const { currentUser } = useApp();

    const totalRevenue = deals.filter(d => d.stage === 'Won').reduce((acc, deal) => acc + deal.value, 0);
    const conversionRate = (deals.filter(d => d.stage === 'Won').length / deals.length) * 100;

    return (
        <div className="flex flex-1 flex-col gap-4">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {currentUser?.name.split(' ')[0]}!</h1>
                <p className="text-muted-foreground">Here's a snapshot of your business performance.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">+{leads.filter(l => l.status === 'New').length}</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">+{deals.filter(d => d.stage === 'Won').length}</div>
                <p className="text-xs text-muted-foreground">+2 since last month</p>
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
                    <BarChart data={revenueData}>
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
                        tickFormatter={(value) => `$${value / 1000}K`}
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
                    You have {leads.filter(l => l.status === 'New').length} new leads this month.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {leads.slice(0, 5).map(lead => (
                            <div key={lead.id} className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{lead.name}</p>
                                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                                </div>
                                <div className="ml-auto font-medium">{lead.source}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
