'use client';
import { Button } from '@/components/ui/button';
import { BadgeIndianRupee, Megaphone, PackageCheck, PlusCircle, ShieldQuestion, UserCheck, Users } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Ticket, Contact, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTicketDialog } from './create-ticket-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const helpCategories = [
  { title: 'Campaign & Performance', icon: Megaphone, issues: ['I have issue in new leads', 'I have issue in pending leads', 'I have issue in my team performance'] },
  { title: 'Confirmation', icon: UserCheck, issues: ['I have issue in confirmation process', 'I have issue in confirmation item performance', 'I have issue in the done leads'] },
  { title: 'HCR or Orders & Delivery', icon: PackageCheck, issues: ['RTO issue', 'I have issue in the delivery process', 'I want to know the delivery status AWB'] },
  { title: 'Payments & Salary', icon: BadgeIndianRupee, issues: ['I have issue in payment process', 'I have issue in salary process'] },
  { title: 'Attendance', icon: Users, issues: ['I have issue in attendance process', 'I have issue in leave process'] },
  { title: 'Complaints & Others', icon: ShieldQuestion, issues: ['I want to file a complaint against any team member', 'I want to file a complaint against my manager'] },
];

export default function TicketsPage() {
  const { currentTeamspace, currentUser, isUserLoading } = useApp();
  const firestore = useFirestore();

  const ticketsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'tickets'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  
  const { data: tickets, isLoading: isLoadingTickets } = useCollection<Ticket>(ticketsQuery);

  const contactsQuery = useMemoFirebase(() =>
    !isUserLoading && currentUser && currentTeamspace?.id
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'contacts'))
      : null
  , [firestore, currentTeamspace?.id, currentUser, isUserLoading]);
  const { data: contacts, isLoading: isLoadingContacts } = useCollection<Contact>(contactsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (isUserLoading || !currentUser || !currentTeamspace?.id) return null;
    
    // Fetch all users in this teamspace for ticket assignment
    const memberIds = currentTeamspace?.memberIds || [];
    if (memberIds.length === 0) return null;

    return query(collection(firestore, 'users'), where(documentId(), 'in', memberIds));
  }, [firestore, currentTeamspace, currentUser, isUserLoading]);
  
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const isLoading = isUserLoading || isLoadingTickets || isLoadingContacts || isLoadingUsers;

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-primary">Support</h1>
                <p className="text-muted-foreground font-medium">
                    Help topics and ticket management.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateTicketDialog 
                  contacts={contacts || []}
                  users={users || []}
                  isLoading={isLoading}
                >
                    <Button className="rounded-2xl herbal-gradient shadow-xl shadow-primary/20 px-6 py-6 font-bold">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Button>
                </CreateTicketDialog>
            </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {helpCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="rounded-[2rem] border-primary/10 shadow-sm">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-black">{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.issues.map((issue) => (
                    <button key={issue} className="block w-full rounded-xl border bg-background px-4 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                      {issue}
                    </button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        ) : (
            <div className="premium-card p-1">
              <DataTable columns={columns} data={tickets || []} />
            </div>
        )}
    </div>
  );
}
