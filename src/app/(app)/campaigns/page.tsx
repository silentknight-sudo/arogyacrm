'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Campaign } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCampaignDialog } from './create-campaign-dialog';

export default function CampaignsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const campaignsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);


  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                <p className="text-muted-foreground">
                    Manage your marketing campaigns.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateCampaignDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </CreateCampaignDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={campaigns || []} />}
    </div>
  );
}
