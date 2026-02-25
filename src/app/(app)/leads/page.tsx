'use client';

import { useState, useEffect } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc, getDoc } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateLeadDialog } from './create-lead-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { UploadLeadsDialog } from './upload-leads-dialog';

export default function LeadsPage() {
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();

  const leadsQuery = useMemoFirebase(() => 
    currentTeamspace 
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
      : null
  , [firestore, currentTeamspace]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (currentTeamspace?.memberIds && currentTeamspace.memberIds.length > 0) {
      setIsLoadingUsers(true);
      const fetchUsers = async () => {
        try {
          const userPromises = currentTeamspace.memberIds.map(id => getDoc(doc(firestore, 'users', id)));
          const userDocs = await Promise.all(userPromises);
          const fetchedUsers = userDocs
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as UserProfile));
          setUsers(fetchedUsers);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          setUsers([]);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else {
      setUsers([]);
      setIsLoadingUsers(false);
    }
  }, [currentTeamspace, firestore]);

  const isLoading = isLoadingLeads || isLoadingUsers;


  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                <p className="text-muted-foreground">
                    Manage your prospective customers and track their journey.
                </p>
            </div>
             <div className="flex items-center space-x-2">
              {currentUser?.role === 'admin' && (
                <UploadLeadsDialog users={users || []} isLoading={isLoading}>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                </UploadLeadsDialog>
              )}
              <CreateLeadDialog>
                  <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Lead
                  </Button>
              </CreateLeadDialog>
            </div>
        </div>
        
        {isLoading && (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={leads || []} users={users || []} />}
    </div>
  );
}
