'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Ticket, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTicketDialog } from './create-ticket-dialog';
import { getTeamspaceUsers } from '../../leads/actions';
import { useToast } from '@/hooks/use-toast';

export default function TicketsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ticketsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'tickets'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsQuery);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (currentTeamspace) {
      setIsLoadingUsers(true);
      getTeamspaceUsers(currentTeamspace.id).then(result => {
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          console.error("Failed to fetch users:", result.error);
          toast({
            variant: 'destructive',
            title: 'Failed to Load Team Members',
            description: result.error || 'An unexpected error occurred while fetching the user list.',
          });
          setUsers([]);
        }
        setIsLoadingUsers(false);
      });
    } else {
        setUsers([]);
        setIsLoadingUsers(false);
    }
  }, [currentTeamspace, toast]);

  const isLoading = isLoadingTickets || isLoadingContacts || isLoadingUsers;

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
