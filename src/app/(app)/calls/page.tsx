
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Call, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCallDialog } from './create-call-dialog';

export default function CallsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const callsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'calls'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: calls, isLoading: isLoadingCalls } = useCollection<Call>(callsQuery);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const usersQuery = useMemoFirebase(() =>
    currentTeamspace ? query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id)) : null,
    [firestore, currentTeamspace]
  )
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isLoadingCalls || isLoadingContacts || isLoadingUsers;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
                <p className="text-muted-foreground">
                    Log and manage your call activities.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateCallDialog 
                    contacts={contacts || []}
                    users={users || []}
                    isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log Call
                    </Button>
                </CreateCallDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={calls || []} />}
    </div>
  );
}

    