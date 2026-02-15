
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
import type { Campaign } from '@/types';
import { format } from 'date-fns';

const CampaignActions = ({ campaign }: { campaign: Campaign }) => {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(campaign.id)}>
            Copy campaign ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Edit campaign</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};


export const columns: ColumnDef<Campaign>[] = [
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Active' ? 'default' :
        status === 'Completed' ? 'secondary' :
        status === 'Planned' ? 'outline' : 'destructive';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'budget',
    header: () => <div className="text-right">Budget</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('budget'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
     cell: ({ row }) => format(new Date(row.getValue('startDate')), 'PP'),
  },
  {
    accessorKey: 'endDate',
    header: 'End Date',
     cell: ({ row }) => format(new Date(row.getValue('endDate')), 'PP'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CampaignActions campaign={row.original} />,
  },
];
