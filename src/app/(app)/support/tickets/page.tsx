'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Ticket, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTicketDialog } from './create-ticket-dialog';

export default function TicketsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  // Guarded tickets query
  const ticketsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'tickets'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsQuery);

  // Guarded contacts query
  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  // Guarded team member query
  const usersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace && currentTeamspace.memberIds?.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null,
    [firestore, currentTeamspace, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingTickets || isLoadingContacts || isLoadingUsers;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
                <p className="text-muted-foreground">
                    Manage and resolve customer issues.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateTicketDialog 
                  contacts={contacts || []}
                  users={users || []}
                  isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Button>
                </CreateTicketDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={tickets || []} />}
    </div>
  );
}