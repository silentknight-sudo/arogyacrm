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
import React, { useState, useEffect } from 'react';
import type { Lead, UserProfile } from '@/types';
import { useApp } from '@/context/app-context';


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  users: UserProfile[];
  externalSelection?: Lead[];
  onSelectionChange?: (leads: Lead[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  users,
  externalSelection,
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const { currentUser } = useApp();
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
    onRowSelectionChange: (updater) => {
        const next = typeof updater === 'function' ? updater(rowSelection) : updater;
        setRowSelection(next);
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    meta: {
      users,
    },
  });

  // Sync internal selection back to parent
  useEffect(() => {
    if (onSelectionChange) {
        const selectedLeads = table.getSelectedRowModel().rows.map(row => row.original as Lead);
        onSelectionChange(selectedLeads);
    }
  }, [rowSelection, table, onSelectionChange]);

  // Sync external selection (Select N) to internal table state
  useEffect(() => {
    if (externalSelection) {
        const newSelection: Record<string, boolean> = {};
        table.getRowModel().rows.forEach(row => {
            if (externalSelection.some(l => l.id === (row.original as Lead).id)) {
                newSelection[row.id] = true;
            }
        });
        setRowSelection(newSelection);
    }
  }, [externalSelection, table]);

  return (
    <div>
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by lead name..."
          value={(table.getColumn('fullName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('fullName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm rounded-xl border-none bg-muted/20 px-4 focus-visible:ring-primary/20"
        />
      </div>
      <div className="rounded-[2rem] border-none bg-background shadow-inner overflow-hidden">
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
                  className="hover:bg-primary/[0.02] border-primary/5 h-16"
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
                  className="h-32 text-center text-muted-foreground font-medium italic opacity-50"
                >
                  No strategic prospects found matching your current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
      <div className="flex items-center justify-end space-x-4 py-6">
        <div className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} Prospect(s) Selected
        </div>
        <div className="flex items-center gap-2">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl border-primary/10 hover:bg-primary/5 font-bold"
            >
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl border-primary/10 hover:bg-primary/5 font-bold"
            >
            Next
            </Button>
        </div>
      </div>
    </div>
  );
}
