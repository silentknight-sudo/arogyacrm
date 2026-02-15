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
import type { Teamspace } from '@/types';

const TeamspaceActions = ({ teamspace }: { teamspace: Teamspace }) => {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(teamspace.id)}>
            Copy teamspace ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Edit teamspace</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete teamspace</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
