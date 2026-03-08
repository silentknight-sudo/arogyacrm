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
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const refundsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'refunds'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: refunds, isLoading: isLoadingRefunds } = useCollection<Refund>(refundsQuery);

  const salesOrdersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);

  const usersQuery = useMemoFirebase(() => {
    return (!isUserLoading && currentUser && currentTeamspace?.id)
        ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) 
        : null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingRefunds || isLoadingSalesOrders || isLoadingUsers;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Refund Requests</h1>
                <p className="text-muted-foreground font-medium">
                    Process and track customer refunds.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateRefundDialog 
                    salesOrders={salesOrders || []}
                    users={users || []}
                    isLoading={isLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Request
                    </Button>
                </CreateRefundDialog>
            </div>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={refunds || []} />
            </div>
        )}
    </div>
  );
}