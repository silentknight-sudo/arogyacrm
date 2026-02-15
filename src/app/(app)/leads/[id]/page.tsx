import { leads, interactionLogs as allLogs } from '@/lib/data';
import { notFound } from 'next/navigation';
import { LeadDetails } from './lead-details';
import { ActivityTimeline } from './activity-timeline';
import { AiSummary } from './ai-summary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = leads.find(l => l.id === params.id);

  if (!lead) {
    notFound();
  }

  const interactionLogs = allLogs[lead.id] || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft />
              <span className="sr-only">Back to leads</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Mail /> Email</Button>
          <Button variant="outline"><Phone /> Call</Button>
          <Button><Edit /> Edit Lead</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <LeadDetails lead={lead} />
          <AiSummary lead={lead} />
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="activity">
            <TabsList className="mb-4">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>
            <TabsContent value="activity">
              <ActivityTimeline logs={interactionLogs} />
            </TabsContent>
            <TabsContent value="details">
              <div className="text-muted-foreground p-8 text-center border rounded-lg">More detailed information will be shown here.</div>
            </TabsContent>
            <TabsContent value="related">
              <div className="text-muted-foreground p-8 text-center border rounded-lg">Related contacts, deals, and accounts will be shown here.</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
