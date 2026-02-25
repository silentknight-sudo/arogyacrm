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
import { useToast } from '@/hooks/use-toast';

const ComplaintActions = ({ complaint }: { complaint: Complaint }) => {
  const { toast } = useToast();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(complaint.id);
      toast({
        title: 'Copied!',
        description: 'Complaint ID copied to clipboard.',
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
            Copy complaint ID
          </DropdownMenuItem>
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
     cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        if (!createdAt) {
            return 'N/A';
        }
        // Handle both Timestamp objects and serialized date strings
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return format(date, 'PP');
     }
  },
  {
    id: 'actions',
    cell: ({ row }) => <ComplaintActions complaint={row.original} />,
  },
];
