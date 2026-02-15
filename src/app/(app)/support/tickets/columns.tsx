
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
import { Badge } from '@/components/ui/badge';
import type { Ticket } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const TicketActions = ({ ticket }: { ticket: Ticket }) => {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
            Copy ticket ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Assign to...</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};


export const columns: ColumnDef<Ticket>[] = [
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
    accessorKey: 'subject',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Subject
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('subject')}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Resolved' || status === 'Closed' ? 'secondary' :
        status === 'In Progress' ? 'default' : 'outline';
      return <Badge variant={variant} className="capitalize">{status.replace(/_/g, ' ')}</Badge>;
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
     cell: ({ row }) => {
      const priority = row.getValue('priority') as 'Urgent' | 'High' | 'Medium' | 'Low';
      const variant: 'destructive' | 'default' | 'secondary' =
        priority === 'Urgent' || priority === 'High' ? 'destructive' :
        priority === 'Medium' ? 'default' :
        'secondary';
      return <Badge variant={variant} className="capitalize">{priority}</Badge>;
    },
  },
  {
    accessorKey: 'contactId',
    header: 'Contact ID',
  },
  {
    accessorKey: 'assignedToId',
    header: 'Assigned To ID',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
        const date = row.original.createdAt?.toDate();
        return date ? formatDistanceToNow(date, { addSuffix: true }) : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <TicketActions ticket={row.original} />,
  },
];
