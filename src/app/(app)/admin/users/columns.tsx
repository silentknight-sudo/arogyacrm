'use client';

import { useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2, KeyRound } from 'lucide-react';
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
import { deleteUser } from './actions';
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


const UserActions = ({ user }: { user: UserProfile }) => {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.displayName}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return <Badge variant="secondary" className="capitalize">{role.replace(/_/g, ' ')}</Badge>;
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
