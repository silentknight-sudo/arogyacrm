'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { Account } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AccountActions = ({ account }: { account: Account }) => {
  const { toast } = useToast();

  const handleCopyId = () => {
    navigator.clipboard.writeText(account.id).then(() => {
      toast({
        title: 'Copied!',
        description: 'Account ID copied to clipboard.',
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
  
  return (
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
            Copy account ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};


export const columns: ColumnDef<Account>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
  },
  {
    accessorKey: 'website',
    header: 'Website',
    cell: ({ row }) => {
      const website = row.getValue('website') as string;
      if (!website) return <span className="text-muted-foreground">-</span>;
      return <a href={`https://${website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{website}</a>
    }
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone ? <span>{phone}</span> : <span className="text-muted-foreground">-</span>;
    }
  },
  {
    accessorKey: 'ownerId',
    header: 'Owner',
    // In a real app, you'd fetch the user's name from this ID
    cell: ({ row }) => <div className="text-xs text-muted-foreground truncate">{row.getValue('ownerId')}</div>
  },
  {
    id: 'actions',
    cell: ({ row }) => <AccountActions account={row.original} />,
  },
];
