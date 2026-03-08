'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { PurchaseOrder, UserProfile, Product } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreatePurchaseOrderDialog } from './create-purchase-order-dialog';

export default function PurchaseOrdersPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const purchaseOrdersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'purchaseOrders'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: purchaseOrders, isLoading: isLoadingPOs } = useCollection<PurchaseOrder>(purchaseOrdersQuery);

  const usersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
        ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) 
        : null,
    [firestore, currentTeamspace?.id, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => 
    !isUserLoading && currentUser 
      ? query(collection(firestore, 'products')) 
      : null
  , [firestore, currentUser, isUserLoading]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const isLoading = isUserLoading || isLoadingPOs || isLoadingUsers || isLoadingProducts;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Purchase Orders</h1>
                <p className="text-muted-foreground font-medium">
                    Create and manage your procurement orders.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreatePurchaseOrderDialog 
                  users={users || []}
                  products={products || []}
                  isLoading={isLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </CreatePurchaseOrderDialog>
            </div>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={purchaseOrders || []} />
            </div>
        )}
    </div>
  );
}