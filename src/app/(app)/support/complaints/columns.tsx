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
import type { Complaint } from '@/types';
import { format } from 'date-fns';

const ComplaintActions = ({ complaint }: { complaint: Complaint }) => {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(complaint.id)}>
            Copy complaint ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Resolve</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};

export const columns: ColumnDef<Complaint>[] = [
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
        status === 'Resolved' || status === 'Closed' ? 'default' :
        status === 'Investigating' ? 'secondary' :
        'outline';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
    {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => {
      const severity = row.getValue('severity') as string;
       const variant: 'destructive' | 'default' | 'secondary' =
        severity === 'Critical' || severity === 'Major' ? 'destructive' :
        severity === 'Moderate' ? 'default' :
        'secondary';
      return <Badge variant={variant} className="capitalize">{severity}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
     cell: ({ row }) => format(row.original.createdAt.toDate(), 'PP'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ComplaintActions complaint={row.original} />,
  },
];

    