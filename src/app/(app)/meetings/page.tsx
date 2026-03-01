'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Meeting, UserProfile, Contact } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateMeetingDialog } from './create-meeting-dialog';

export default function MeetingsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  // Guarded meetings query
  const meetingsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'meetings'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  
  const { data: meetings, isLoading: isLoadingMeetings } = useCollection<Meeting>(meetingsQuery);

  // Guarded team member query
  const usersQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace && currentTeamspace.memberIds?.length > 0
        ? query(collection(firestore, 'users'), where(documentId(), 'in', currentTeamspace.memberIds)) 
        : null,
    [firestore, currentTeamspace, currentUser, isUserLoading]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  // Guarded contacts query
  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const isLoading = isUserLoading || isLoadingMeetings || isLoadingUsers || isLoadingContacts;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
                <p className="text-muted-foreground">
                    Schedule and manage your meetings.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateMeetingDialog 
                    users={users || []}
                    contacts={contacts || []}
                    isLoading={isLoading}
                >
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule Meeting
                    </Button>
                </CreateMeetingDialog>
            </div>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={meetings || []} />}
    </div>
  );
}