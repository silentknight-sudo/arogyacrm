'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Flame } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Lead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HotLeadsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    const constraints: any[] = [where('status', '==', 'intrested'), orderBy('createdAt', 'desc')];
    if (currentUser.role === 'sales_executive') constraints.unshift(where('assignedToIds', 'array-contains', currentUser.id));
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'), ...constraints);
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-primary"><Flame className="h-9 w-9 text-orange-500" /> Hot Leads Incoming</h1>
        <p className="text-muted-foreground font-medium">Holding leads that need active follow-up.</p>
      </div>
      <Card className="rounded-[2rem] border-primary/10">
        <CardHeader><CardTitle className="font-black">Hot Leads ({leads?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr><th className="px-4 py-3 text-left">S.No</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Mobile</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Remark</th></tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center">Loading...</td></tr> : (leads || []).map((lead, index) => {
                  const createdAt = lead.createdAt?.toDate ? lead.createdAt.toDate() : lead.createdAt ? new Date(lead.createdAt) : null;
                  return (
                    <tr key={lead.id} className="border-t">
                      <td className="px-4 py-3 font-bold">{index + 1}</td>
                      <td className="px-4 py-3 text-xs">{createdAt ? format(createdAt, 'PPp') : 'not provided'}</td>
                      <td className="px-4 py-3 font-black text-primary">{lead.fullName}</td>
                      <td className="px-4 py-3 font-semibold">{lead.phone}</td>
                      <td className="px-4 py-3"><Badge>Holding</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.notes || 'not provided'}</td>
                    </tr>
                  );
                })}
                {!isLoading && (!leads || leads.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hot leads found.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
