'use client';

import { useMemo, useState } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Search } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Lead } from '@/types';
import { getLeadStatusLabel } from '@/lib/status-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ParcelSearchPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (currentUser.role === 'sales_executive') {
      constraints.unshift(where('assignedToIds', 'array-contains', currentUser.id));
    }
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'), ...constraints);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    const fromDate = from ? startOfDay(new Date(from)) : null;
    const toDate = to ? endOfDay(new Date(to)) : null;

    return (leads || []).filter((lead) => {
      const matchesSearch = !term || [lead.fullName, lead.phone, lead.email, lead.demographicData?.jobTitle, lead.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));

      const createdAt = lead.createdAt?.toDate ? lead.createdAt.toDate() : lead.createdAt ? new Date(lead.createdAt) : null;
      const matchesDate = !createdAt || (!fromDate && !toDate) || isWithinInterval(createdAt, {
        start: fromDate || startOfDay(new Date('2000-01-01')),
        end: toDate || endOfDay(new Date()),
      });

      return matchesSearch && matchesDate;
    });
  }, [leads, search, from, to]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Customers ({filteredLeads.length})</h1>
        <p className="text-muted-foreground font-medium">Search customers by name, phone, date, or lead status.</p>
      </div>

      <Card className="rounded-[2rem] border-primary/10">
        <CardHeader className="gap-4">
          <CardTitle className="text-2xl font-black">All Parcel Search</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name / phone" className="h-12 rounded-2xl pl-10" />
            </div>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-12 rounded-2xl" />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-12 rounded-2xl" />
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => { setSearch(''); setFrom(''); setTo(''); }}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-black">S.No</th>
                  <th className="px-4 py-3 text-left font-black">Date</th>
                  <th className="px-4 py-3 text-left font-black">Name</th>
                  <th className="px-4 py-3 text-left font-black">Mobile</th>
                  <th className="px-4 py-3 text-left font-black">Status</th>
                  <th className="px-4 py-3 text-left font-black">Update</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading customers...</td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No customers found.</td></tr>
                ) : filteredLeads.map((lead, index) => {
                  const createdAt = lead.createdAt?.toDate ? lead.createdAt.toDate() : lead.createdAt ? new Date(lead.createdAt) : null;
                  return (
                    <tr key={lead.id} className="border-t">
                      <td className="px-4 py-3 font-bold">{index + 1}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">{createdAt ? format(createdAt, 'PPp') : 'not provided'}</td>
                      <td className="px-4 py-3 font-black text-primary">{lead.fullName}</td>
                      <td className="px-4 py-3 font-semibold">{lead.phone}</td>
                      <td className="px-4 py-3"><Badge>{getLeadStatusLabel(lead.status)}</Badge></td>
                      <td className="px-4 py-3"><Button size="sm" variant="outline" className="rounded-xl">Update</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
