
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Invoice, Account, SalesOrder } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateInvoiceDialog } from './create-invoice-dialog';

export default function InvoicesPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const invoicesQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'invoices'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const accountsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'accounts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);

  const salesOrdersQuery = useMemoFirebase(() =>
    currentTeamspace
        ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders'))
        : null
    , [firestore, currentTeamspace]);
  const { data: salesOrders, isLoading: isLoadingSalesOrders } = useCollection<SalesOrder>(salesOrdersQuery);

  const isLoading = isLoadingInvoices || isLoadingAccounts || isLoadingSalesOrders;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
                <p className="text-muted-foreground">
                    Create and manage customer invoices.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateInvoiceDialog 
                  accounts={accounts || []}
                  salesOrders={salesOrders || []}
                  isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Invoice
                    </Button>
                </CreateInvoiceDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={invoices || []} />}
    </div>
  );
}

    