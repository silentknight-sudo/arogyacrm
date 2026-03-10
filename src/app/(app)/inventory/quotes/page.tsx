'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Quote, Contact, Product } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateQuoteDialog } from './create-quote-dialog';

export default function QuotesPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const quotesQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'quotes'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);


  const isLoading = isLoadingQuotes || isLoadingContacts || isLoadingProducts;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">Quotes</h1>
                <p className="text-muted-foreground">
                    Create and manage sales quotes for stakeholders.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateQuoteDialog 
                  contacts={contacts || []}
                  products={products || []}
                  isLoading={isLoading}
                >
                    <Button className="herbal-gradient font-bold rounded-xl shadow-lg">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Quote
                    </Button>
                </CreateQuoteDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={quotes || []} />}
    </div>
  );
}