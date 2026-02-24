'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import type { Lead } from '@/types';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
    const { currentTeamspace } = useApp();
    const firestore = useFirestore();

    const leadsQuery = useMemoFirebase(() =>
        currentTeamspace
            ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
            : null
    , [firestore, currentTeamspace]);

    const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

    const leadSourceChartData = useMemoFirebase(() => {
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
    

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">
                        Detailed analytics and insights into your business performance.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Lead Source Distribution</CardTitle>
                        <CardDescription>Where your leads are coming from.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {isLoadingLeads && <Skeleton className="h-[300px] w-full" />}
                       {!isLoadingLeads && (
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={leadSourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
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
            </div>
        </div>
    );
}
