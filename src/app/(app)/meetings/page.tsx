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

  const meetingsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'meetings'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: meetings, isLoading: isLoadingMeetings } = useCollection<Meeting>(meetingsQuery);

  const usersQuery = useMemoFirebase(() => {
    const memberIds = currentTeamspace?.memberIds || [];
    return (!isUserLoading && currentUser && memberIds.length > 0)
        ? query(collection(firestore, 'users'), where(documentId(), 'in', memberIds)) 
        : null;
  }, [firestore, currentTeamspace?.memberIds, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const isLoading = isUserLoading || isLoadingMeetings || isLoadingUsers || isLoadingContacts;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Meetings</h1>
                <p className="text-muted-foreground font-medium">
                    Schedule and manage your meetings.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateMeetingDialog 
                    users={users || []}
                    contacts={contacts || []}
                    isLoading={isLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule Meeting
                    </Button>
                </CreateMeetingDialog>
            </div>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={meetings || []} />
            </div>
        )}
    </div>
  );
}
