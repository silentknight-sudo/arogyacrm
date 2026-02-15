
'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import KanbanBoard from './kanban-board';
import { CreateDealDialog } from './create-deal-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, Contact } from '@/types';
import { useApp } from '@/context/app-context';


export default function DealsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'accounts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
                <p className="text-muted-foreground">
                    Visualize and manage your deals through the sales process.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateDealDialog 
                    accounts={accounts || []} 
                    contacts={contacts || []}
                    isLoading={isLoadingAccounts || isLoadingContacts}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Deal
                    </Button>
                </CreateDealDialog>
            </div>
        </div>
        <div className="flex-1 rounded-lg border bg-card shadow-sm">
            <KanbanBoard />
        </div>
    </div>
  );
}
