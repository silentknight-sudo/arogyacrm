
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
import type { Contact } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const ContactActions = ({ contact }: { contact: Contact }) => {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.id)}>
            Copy contact ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit contact</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};


export const columns: ColumnDef<Contact>[] = [
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
    accessorFn: row => `${row.firstName} ${row.lastName}`,
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
        const contact = row.original;
        const name = `${contact.firstName} ${contact.lastName}`;
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={contact.avatar} alt={name} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'accountId',
    header: 'Account ID',
    cell: ({ row }) => <div className="text-xs text-muted-foreground truncate">{row.getValue('accountId')}</div>
  },
  {
    id: 'actions',
    cell: ({ row }) => <ContactActions contact={row.original} />,
  },
];
