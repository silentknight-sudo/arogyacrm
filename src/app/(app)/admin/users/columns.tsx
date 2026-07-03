'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2, KeyRound, UserRoundCog, Eye, Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { deleteUser, transferTelecallerToTeamLead } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/context/app-context';
import { ChangePasswordDialog } from './change-password-dialog';
import { getProfessionalEmployeeId, getRoleLabel } from '@/lib/user-labels';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';


const UserActions = ({ user }: { user: UserProfile }) => {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const firestore = useFirestore();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTransferring, startTransferTransition] = useTransition();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState('');

  const teamLeadsQuery = useMemoFirebase(() => (
    currentUser?.role === 'admin'
      ? query(collection(firestore, 'users'), where('role', '==', 'sales_team_lead'))
      : null
  ), [firestore, currentUser?.role]);

  const { data: teamLeads, isLoading: isLoadingTeamLeads } = useCollection<UserProfile>(teamLeadsQuery);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id).then(() => {
        toast({
            title: 'Copied!',
            description: 'User ID copied to clipboard.',
        });
    }).catch(err => {
        toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Could not copy ID to clipboard.',
        });
        console.error('Failed to copy ID: ', err);
    });
  };
  
  const handleDelete = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteUser({ userId: user.id, adminId: currentUser.id });
      if (result.success) {
        toast({
          title: 'User Deleted',
          description: `User ${user.displayName} has been permanently deleted.`,
        });
        setIsAlertOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: result.error,
        });
      }
    });
  }

  const canManagePassword = currentUser?.role === 'admin' || 
    (currentUser?.role === 'sales_team_lead' && user.role === 'sales_executive');
  const canTransferTelecaller = currentUser?.role === 'admin' && user.role === 'sales_executive';

  const handleTransfer = () => {
    if (!currentUser || !selectedTeamLeadId) {
      toast({ variant: 'destructive', title: 'Select Team Lead', description: 'Choose a Team Lead before transferring.' });
      return;
    }

    startTransferTransition(async () => {
      const result = await transferTelecallerToTeamLead({
        telecallerId: user.id,
        teamLeadId: selectedTeamLeadId,
        adminId: currentUser.id,
      });

      if (result.success) {
        const teamLead = teamLeads?.find((item) => item.id === selectedTeamLeadId);
        toast({
          title: 'Telecaller Transferred',
          description: `${user.displayName} is now in ${teamLead?.displayName || 'the selected Team Lead'}'s team.`,
        });
        setIsTransferDialogOpen(false);
        setSelectedTeamLeadId('');
      } else {
        toast({ variant: 'destructive', title: 'Transfer Failed', description: result.error });
      }
    });
  };

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{' '}
              <span className="font-semibold">{user.displayName} ({user.email})</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: 'destructive' })}>
              {isDeleting ? 'Deleting...' : 'Yes, delete user'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangePasswordDialog 
        open={isPasswordDialogOpen} 
        onOpenChange={setIsPasswordDialogOpen} 
        user={user} 
      />

      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary">Transfer Telecaller</DialogTitle>
            <DialogDescription className="font-medium">
              Move {user.displayName} directly into another Team Lead&apos;s team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Choose Team Lead</Label>
            <Select value={selectedTeamLeadId} onValueChange={setSelectedTeamLeadId} disabled={isLoadingTeamLeads || isTransferring}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder={isLoadingTeamLeads ? 'Loading team leads...' : 'Select Team Lead'} />
              </SelectTrigger>
              <SelectContent>
                {(teamLeads || []).map((teamLead) => (
                  <SelectItem key={teamLead.id} value={teamLead.id}>
                    {teamLead.displayName} · {getProfessionalEmployeeId(teamLead)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs font-medium text-muted-foreground">
              This updates the telecaller&apos;s teamspace and manager ownership immediately.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsTransferDialogOpen(false)} disabled={isTransferring}>Cancel</Button>
            <Button className="rounded-xl herbal-gradient font-black" onClick={handleTransfer} disabled={isTransferring || !selectedTeamLeadId}>
              {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundCog className="mr-2 h-4 w-4" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/team/${user.id}`}>
              <Eye className="mr-2 h-4 w-4 text-primary" />
              View Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyId}>
            Copy user ID
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {canManagePassword && (
            <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4 text-primary" />
              Reset Password
            </DropdownMenuItem>
          )}

          {canTransferTelecaller && (
            <DropdownMenuItem onClick={() => setIsTransferDialogOpen(true)}>
              <UserRoundCog className="mr-2 h-4 w-4 text-primary" />
              Transfer Team
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsAlertOpen(true)}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            disabled={currentUser?.id === user.id}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};


export const columns: ColumnDef<UserProfile>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'displayName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const user = row.original;
        return (
            <Link href={`/team/${user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium underline-offset-4 hover:underline">{user.displayName}</span>
            </Link>
        )
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'employeeId',
    header: 'Employee ID',
    cell: ({ row }) => {
      const user = row.original;
      return <span className="font-mono text-xs font-bold">{getProfessionalEmployeeId(user)}</span>;
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return <Badge variant="secondary" className="capitalize">{getRoleLabel(role)}</Badge>;
    },
  },
   {
    accessorKey: 'teamspaceIds',
    header: 'Teamspaces',
    cell: ({ row }) => {
        const teamspaces = row.getValue('teamspaceIds') as string[] || [];
        return <span>{teamspaces.length}</span>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];
