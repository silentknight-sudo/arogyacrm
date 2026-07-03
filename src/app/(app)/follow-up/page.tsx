'use client';

import Link from 'next/link';
import { Flame, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FollowUpPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Follow Up</h1>
        <p className="text-muted-foreground font-medium">Track hot leads and overdue reminders.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-[2rem] border-primary/10">
          <CardHeader>
            <Flame className="mb-4 h-10 w-10 text-orange-500" />
            <CardTitle className="text-2xl font-black">Hot Leads Incoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Leads currently in Holding and waiting for follow-up.</p>
            <Button asChild className="rounded-2xl"><Link href="/follow-up/hot">Open Hot Leads</Link></Button>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-primary/10">
          <CardHeader>
            <Clock className="mb-4 h-10 w-10 text-red-500" />
            <CardTitle className="text-2xl font-black">Overdue Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Reminder-based leads that need attention now.</p>
            <Button asChild variant="outline" className="rounded-2xl"><Link href="/follow-up/overdue">Open Overdue Leads</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
