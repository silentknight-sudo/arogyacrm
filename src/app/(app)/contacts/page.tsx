'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Contact, Account } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateContactDialog } from './create-contact-dialog';

export default function ContactsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const accountsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'accounts'))
      : null
  , [firestore, currentTeamspace]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);

  const isLoading = isLoadingContacts || isLoadingAccounts;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                <p className="text-muted-foreground">
                    Manage your contacts and their information.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                 <CreateContactDialog accounts={accounts || []} isLoadingAccounts={isLoadingAccounts}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Contact
                    </Button>
                </CreateContactDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={contacts || []} />}
    </div>
  );
}
