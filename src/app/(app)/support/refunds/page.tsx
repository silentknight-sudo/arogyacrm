
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Refund, SalesOrder, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateRefundDialog } from './create-refund-dialog';

export default function RefundsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const refundsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'refunds'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: refunds, isLoading: isLoadingRefunds } = useCollection<Refund>(refundsQuery);

  const salesOrdersQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders'))
      : null
  , [firestore, currentTeamspace]);
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);

  const usersQuery = useMemoFirebase(() =>
    currentTeamspace ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) : null,
    [firestore, currentTeamspace]
  )
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isLoadingRefunds || isLoadingSalesOrders || isLoadingUsers;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
                <p className="text-muted-foreground">
                    Process and track customer refunds.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateRefundDialog 
                    salesOrders={salesOrders || []}
                    users={users || []}
                    isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Refund Request
                    </Button>
                </CreateRefundDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={refunds || []} />}
    </div>
  );
}

    