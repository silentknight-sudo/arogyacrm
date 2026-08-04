'use client';

import { useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { Teamspace } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { deleteTeamspace } from './actions';
import { useApp } from '@/context/app-context';
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

const TeamspaceActions = ({ teamspace }: { teamspace: Teamspace }) => {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleCopyId = () => {
    navigator.clipboard.writeText(teamspace.id).then(() => {
        toast({
            title: 'Copied!',
            description: 'Teamspace ID copied to clipboard.',
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
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: 'You must be logged in as admin to delete a teamspace.',
      });
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteTeamspace({
        teamspaceId: teamspace.id,
        adminId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Teamspace deleted',
          description: `${teamspace.name} was deleted and ${result.detachedUsers || 0} linked users were detached.`,
        });
        setIsDeleteOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this teamspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <span className="font-semibold">{teamspace.name}</span> and its workspace CRM data.
              Linked users will be detached from this teamspace and may lose access until reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={buttonVariants({ variant: 'destructive' })}
            >
              {isDeleting ? 'Deleting...' : 'Delete teamspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyId}>
              Copy teamspace ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteOpen(true)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete teamspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </>
  );
};


export const columns: ColumnDef<Teamspace>[] = [
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
    accessorKey: 'name',
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
        const teamspace = row.original;
        return (
            <div className="font-medium">{teamspace.name}</div>
        )
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
   {
    accessorKey: 'memberIds',
    header: 'Members',
    cell: ({ row }) => {
        const members = row.getValue('memberIds') as string[] || [];
        return <span>{members.length}</span>
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <TeamspaceActions teamspace={row.original} />,
  },
];
