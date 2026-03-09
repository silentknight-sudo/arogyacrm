'use client';

import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, InteractionLog, Product } from '@/types';
import { LeadDetails } from './lead-details';
import { ActivityTimeline } from './activity-timeline';
import { AiSummary } from './ai-summary';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { ConvertToDealDialog } from '../convert-to-deal-dialog';

export default function LeadDetailPage() {
  const params = useParams() || {};
  const id = params.id as string;
  const { currentTeamspace, currentUser } = useApp();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isConvertDialogOpen, setConvertDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leadRef = useMemoFirebase(() => 
    currentTeamspace && id
      ? doc(firestore, 'teamspaces', currentTeamspace.id, 'leads', id)
      : null
  , [firestore, currentTeamspace, id]);
  
  const { data: lead, isLoading } = useDoc<Lead>(leadRef);

  const productsQuery = useMemoFirebase(() => 
    currentUser ? query(collection(firestore, 'products')) : null
  , [firestore, currentUser]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  if (!mounted || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    notFound();
  }

  const interactionLogs: InteractionLog[] = [];

  return (
    <div className="flex flex-col gap-6">
      <ConvertToDealDialog 
        open={isConvertDialogOpen} 
        onOpenChange={setConvertDialogOpen} 
        lead={lead} 
        products={products || []}
        isLoading={isLoadingProducts}
      />
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft />
              <span className="sr-only">Back to prospects</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.fullName}</h1>
            <p className="text-muted-foreground">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.status !== 'Converted' && (
            <Button onClick={() => setConvertDialogOpen(true)} className="herbal-gradient font-bold shadow-lg shadow-primary/20">
              <ChevronsRight className="mr-2 h-4 w-4" />
              Convert to Deal
            </Button>
          )}
          <Button variant="outline"><Mail className="mr-2 h-4 w-4"/> Email</Button>
          <Button variant="outline"><Phone className="mr-2 h-4 w-4"/> Call</Button>
          <Button variant="secondary"><Edit className="mr-2 h-4 w-4"/> Edit</Button>
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
              <TabsTrigger value="activity">Interaction Log</TabsTrigger>
              <TabsTrigger value="details">Demographics</TabsTrigger>
              <TabsTrigger value="related">Pipeline Context</TabsTrigger>
            </TabsList>
            <TabsContent value="activity">
              <ActivityTimeline logs={interactionLogs} />
            </TabsContent>
            <TabsContent value="details">
              <div className="text-muted-foreground p-8 text-center border rounded-lg">Target industry and company data will be displayed here.</div>
            </TabsContent>
            <TabsContent value="related">
              <div className="text-muted-foreground p-8 text-center border rounded-lg">Linked deals and historical orders will be displayed here.</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}