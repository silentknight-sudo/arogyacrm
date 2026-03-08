'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import KanbanBoard from './kanban-board';
import { CreateDealDialog } from './create-deal-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, Contact, Product } from '@/types';
import { useApp } from '@/context/app-context';


export default function DealsPage() {
  const { currentTeamspace, isUserLoading, areTeamspacesLoading } = useApp();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() =>
    !isUserLoading && !areTeamspacesLoading && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'accounts'))
      : null
  , [firestore, currentTeamspace, isUserLoading, areTeamspacesLoading]);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && !areTeamspacesLoading && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace, isUserLoading, areTeamspacesLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const displayLoading = isLoadingAccounts || isLoadingContacts || isUserLoading || areTeamspacesLoading || isLoadingProducts;

  return (
    <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Sales Pipeline</h1>
                <p className="text-muted-foreground font-medium">
                    Manage and grow your product-based wellness deals.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateDealDialog 
                    accounts={accounts || []} 
                    contacts={contacts || []}
                    products={products || []}
                    isLoading={displayLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Deal
                    </Button>
                </CreateDealDialog>
            </div>
        </div>
        <div className="flex-1 rounded-[2.5rem] border bg-card/50 backdrop-blur-sm shadow-inner overflow-hidden">
            <KanbanBoard />
        </div>
    </div>
  );
}
