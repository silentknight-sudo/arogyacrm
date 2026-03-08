'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Invoice, SalesOrder } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateInvoiceDialog } from './create-invoice-dialog';

export default function InvoicesPage() {
  const { currentTeamspace, isUserLoading } = useApp();
  const firestore = useFirestore();

  const invoicesQuery = useMemoFirebase(() =>
    currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'invoices'))
      : null
  , [firestore, currentTeamspace?.id]);
  
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const salesOrdersQuery = useMemoFirebase(() =>
    currentTeamspace?.id
        ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders'))
        : null
    , [firestore, currentTeamspace?.id]);
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);

  const isLoading = isUserLoading || isLoadingInvoices || isLoadingSalesOrders;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-primary">Invoices</h1>
                <p className="text-muted-foreground">
                    Create and manage customer invoices.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateInvoiceDialog 
                  salesOrders={salesOrders || []}
                  isLoading={isLoading}
                >
                    <Button className="shadow-lg shadow-primary/20 herbal-gradient rounded-xl px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Invoice
                    </Button>
                </CreateInvoiceDialog>
            </div>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={invoices || []} />
            </div>
        )}
    </div>
  );
}
