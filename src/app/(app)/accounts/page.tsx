'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateAccountDialog } from './create-account-dialog';


export default function AccountsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'accounts'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
                <p className="text-muted-foreground">
                    Manage your customer accounts.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateAccountDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Account
                    </Button>
                </CreateAccountDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={accounts || []} />}
    </div>
  );
}
