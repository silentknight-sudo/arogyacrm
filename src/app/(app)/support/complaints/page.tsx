
'use client';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Complaint, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateComplaintDialog } from './create-complaint-dialog';

export default function ComplaintsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const complaintsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'complaints'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    if (currentUser.role === 'admin') {
        return query(
          collection(firestore, 'users'), 
          where('teamspaceIds', 'array-contains', currentTeamspace.id)
        );
    }
    
    if (currentUser.role === 'sales_team_lead') {
        return query(
          collection(firestore, 'users'), 
          where('createdBy', '==', currentUser.id)
        );
    }
    
    return null;
  }, [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingComplaints || isLoadingContacts || isLoadingUsers;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Escalations</h1>
                <p className="text-muted-foreground font-medium">
                    Track and manage customer complaints.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateComplaintDialog 
                  contacts={contacts || []}
                  users={users || []}
                  isLoading={isLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log Escalation
                    </Button>
                </CreateComplaintDialog>
            </div>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={complaints || []} />
            </div>
        )}
    </div>
  );
}
