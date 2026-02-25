'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Refund, SalesOrder, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateRefundDialog } from './create-refund-dialog';
import { getTeamspaceUsers } from '../../leads/actions';

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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (currentTeamspace) {
      setIsLoadingUsers(true);
      getTeamspaceUsers(currentTeamspace.id).then(result => {
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          console.error("Failed to fetch users:", result.error);
          setUsers([]);
        }
        setIsLoadingUsers(false);
      });
    } else {
        setUsers([]);
        setIsLoadingUsers(false);
    }
  }, [currentTeamspace]);

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
