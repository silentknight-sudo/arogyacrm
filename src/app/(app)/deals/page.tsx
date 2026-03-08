'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Filter } from 'lucide-react';
import KanbanBoard from './kanban-board';
import { CreateDealDialog } from './create-deal-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, Contact, Product } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealsPage() {
  const { currentTeamspace, isUserLoading, areTeamspacesLoading, currentUser } = useApp();
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

  const productsQuery = useMemoFirebase(() => 
    !isUserLoading && currentUser 
      ? query(collection(firestore, 'products')) 
      : null
  , [firestore, currentUser, isUserLoading]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const displayLoading = isLoadingAccounts || isLoadingContacts || isUserLoading || areTeamspacesLoading || isLoadingProducts;

  return (
    <div className="flex flex-col h-full gap-8 pb-8 pt-4">
        <div className="flex items-end justify-between flex-wrap gap-8 px-2">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent mb-1">
                    <Filter className="h-5 w-5 fill-accent" />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Revenue Radar</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-primary">Sales Pipeline</h1>
                <p className="text-2xl text-muted-foreground font-semibold">
                    Manage and grow your product-centric wellness deals.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <CreateDealDialog 
                    accounts={accounts || []} 
                    contacts={contacts || []}
                    products={products || []}
                    isLoading={displayLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 px-10 py-7 text-lg font-black gold-glow scale-105 hover:scale-110 active:scale-95 transition-all">
                        <PlusCircle className="mr-3 h-6 w-6" />
                        Initiate Deal
                    </Button>
                </CreateDealDialog>
            </div>
        </div>

        <div className="flex-1 rounded-[3rem] border-4 border-white shadow-[0_30px_100px_rgba(0,0,0,0.08)] bg-card/40 backdrop-blur-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-accent/[0.02] pointer-events-none" />
            <KanbanBoard />
        </div>
    </div>
  );
}
