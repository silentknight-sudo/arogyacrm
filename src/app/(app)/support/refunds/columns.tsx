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
import type { Refund } from '@/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const RefundActions = ({ refund }: { refund: Refund }) => {
  const { toast } = useToast();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(refund.id);
      toast({
        title: 'Copied!',
        description: 'Refund ID copied to clipboard.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy ID to clipboard.',
      });
      console.error('Failed to copy ID: ', err);
    }
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
            Copy refund ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
          <DropdownMenuItem>Approve</DropdownMenuItem>
          <DropdownMenuItem>Reject</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};

export const columns: ColumnDef<Refund>[] = [
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
    accessorKey: 'salesOrderId',
    header: 'Sales Order ID'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
       const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Approved' || status === 'Processed' ? 'default' :
        status === 'Rejected' || status === 'Cancelled' ? 'destructive' :
        'outline';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
    {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
     cell: ({ row }) => format(row.original.createdAt.toDate(), 'PP'),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RefundActions refund={row.original} />,
  },
];

    
