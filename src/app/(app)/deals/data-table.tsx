'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';

import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useEffect } from 'react';
import type { Deal, UserProfile } from '@/types';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  users: UserProfile[];
  externalSelection?: Deal[];
  onSelectionChange?: (deals: Deal[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  users,
  externalSelection,
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    meta: {
      users,
    },
  });

  const lastEmittedRef = React.useRef<string[]>([]);

  useEffect(() => {
    if (onSelectionChange) {
        const selectedDeals = table.getSelectedRowModel().rows.map(row => row.original as Deal);
        const currentIds = selectedDeals.map(d => d.id).sort();
        
        if (JSON.stringify(currentIds) !== JSON.stringify(lastEmittedRef.current)) {
            lastEmittedRef.current = currentIds;
            onSelectionChange(selectedDeals);
        }
    }
  }, [rowSelection, table, onSelectionChange]);

  useEffect(() => {
    if (externalSelection) {
        const externalIds = externalSelection.map(d => d.id).sort();
        const internalIds = table.getSelectedRowModel().rows.map(r => (r.original as Deal).id).sort();

        if (JSON.stringify(externalIds) !== JSON.stringify(internalIds)) {
            const newSelection: Record<string, boolean> = {};
            table.getRowModel().rows.forEach(row => {
                if (externalIds.includes((row.original as Deal).id)) {
                    newSelection[row.id] = true;
                }
            });
            setRowSelection(newSelection);
        }
    }
  }, [externalSelection, table]);

  return (
    <div>
      <div className="rounded-2xl border-none bg-background shadow-inner overflow-hidden">
        <UiTable>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-primary/5">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-primary/[0.02] border-primary/5 h-14"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground font-medium italic opacity-50 text-xs"
                >
                  Empty Stage
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
      <div className="flex items-center justify-end space-x-4 py-4 px-4">
        <div className="flex-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          {table.getFilteredSelectedRowModel().rows.length} Selected
        </div>
        <div className="flex items-center gap-2">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 rounded-lg border-primary/10 hover:bg-primary/5 font-bold text-[10px]"
            >
            Prev
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 rounded-lg border-primary/10 hover:bg-primary/5 font-bold text-[10px]"
            >
            Next
            </Button>
        </div>
      </div>
    </div>
  );
}
