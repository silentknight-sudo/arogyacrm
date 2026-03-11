'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { SalesOrder, Contact, Product } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateSalesOrderDialog } from './create-sales-order-dialog';

export default function SalesOrdersPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const salesOrdersQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

    const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);


  const isLoading = isLoadingSalesOrders || isLoadingContacts || isLoadingProducts;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">Sales Orders</h1>
                <p className="text-muted-foreground">
                    Manage confirmed stakeholder orders and fulfillment.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateSalesOrderDialog 
                  contacts={contacts || []}
                  products={products || []}
                  isLoading={isLoading}
                >
                    <Button className="herbal-gradient font-bold rounded-xl shadow-lg">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Sales Order
                    </Button>
                </CreateSalesOrderDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={salesOrders || []} />}
    </div>
  );
}
