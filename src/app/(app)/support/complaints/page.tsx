'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Complaint, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateComplaintDialog } from './create-complaint-dialog';

export default function ComplaintsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const complaintsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'complaints'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  // Fetch team members directly on the client. Guarded by profile existence.
  const usersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace && currentTeamspace.memberIds?.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null,
    [firestore, currentTeamspace, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingComplaints || isLoadingContacts || isLoadingUsers;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
                <p className="text-muted-foreground">
                    Track and manage customer complaints.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateComplaintDialog 
                  contacts={contacts || []}
                  users={users || []}
                  isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log Complaint
                    </Button>
                </CreateComplaintDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={complaints || []} />}
    </div>
  );
}