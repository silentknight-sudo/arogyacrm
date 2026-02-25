'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Meeting, UserProfile, Contact } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateMeetingDialog } from './create-meeting-dialog';
import { getTeamspaceUsers } from '../leads/actions';

export default function MeetingsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const meetingsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'meetings'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: meetings, isLoading: isLoadingMeetings } = useCollection<Meeting>(meetingsQuery);

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
          setUsers([]);
        }
        setIsLoadingUsers(false);
      });
    } else {
        setUsers([]);
        setIsLoadingUsers(false);
    }
  }, [currentTeamspace]);

  const contactsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const isLoading = isLoadingMeetings || isLoadingUsers || isLoadingContacts;

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
