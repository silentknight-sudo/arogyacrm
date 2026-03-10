'use client';

import { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead, UserProfile, LeadStatus } from '@/types';
import { updateLeadStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';

const statuses: LeadStatus[] = ['new', 'pending', 'busy', 'done', 'canceled'];

const GOOGLE_FORM_URL = 'https://forms.gle/arogya-lead-feedback';

const StatusSelector = ({ lead }: { lead: Lead }) => {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: LeadStatus) => {
    if (!currentTeamspace) return;
    startTransition(async () => {
      const result = await updateLeadStatus({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        status: newStatus,
      });

      if (result.success) {
        toast({
          title: 'Stage Updated',
          description: (
            <div className="flex flex-col gap-2">
              <p>Lead transitioned to "{newStatus}".</p>
              <Button variant="outline" size="sm" asChild className="w-fit">
                <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3" />
                  Fill Feedback Form
                </a>
              </Button>
            </div>
          ),
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select 
        disabled={isPending || lead.status === 'Converted'} 
        defaultValue={lead.status} 
        onValueChange={(v) => handleStatusChange(v as LeadStatus)}
      >
        <SelectTrigger className="h-8 w-[130px] rounded-lg text-[10px] font-black uppercase tracking-widest">
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(s => (
            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {lead.status !== 'new' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
              <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fill Google Form</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

const AssignedToCell = ({ assignedToIds, users }: { assignedToIds: string[], users: UserProfile[] }) => {
    const assignedUsers = (assignedToIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as UserProfile[];
    if (assignedUsers.length === 0) return <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic opacity-40">Unassigned</span>;
    const visibleUsers = assignedUsers.slice(0, 3);
    const remainingCount = assignedUsers.length - visibleUsers.length;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center -space-x-3 cursor-help">
                    {visibleUsers.map(user => (
                        <Avatar key={user.id} className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-primary/5">
                            <AvatarImage src={user.avatar} alt={user.displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    ))}
                    {remainingCount > 0 && (
                        <Avatar className="h-8 w-8 border-2 border-background bg-muted shadow-sm">
                            <AvatarFallback className="text-[10px] font-black text-muted-foreground">+{remainingCount}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl border-none shadow-xl bg-[#0D1F0B] text-white p-3">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Workspace Specialists</p>
                    {assignedUsers.map(u => (
                        <div key={u.id} className="text-xs font-bold flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-accent" />
                            {u.displayName}
                        </div>
                    ))}
                </div>
            </TooltipContent>
        </Tooltip>
    );
};

export const columns: ColumnDef<Lead>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="rounded-md border-primary/20"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="rounded-md border-primary/20"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="font-black uppercase tracking-widest text-[10px] hover:bg-transparent px-0">
          Lead Name
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/leads/${row.original.id}`} className="font-black text-primary hover:text-accent transition-colors tracking-tight text-sm">
          {row.getValue('fullName')}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Email</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{row.getValue('email') || 'N/A'}</span>
  },
  {
    accessorKey: 'phone',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Phone Number</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue('phone') || 'N/A'}</span>
  },
  {
    accessorKey: 'createdAt',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Assigned Date</div>,
    cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return <span className="text-[10px] font-bold text-muted-foreground">{format(d, 'PP')}</span>;
    },
  },
  {
    accessorKey: 'assignedToIds',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Assigned Person</div>,
    cell: ({ row, table }) => {
        const assignedToIds = row.getValue('assignedToIds') as string[] || [];
        const users = (table.options.meta as any)?.users || [];
        return <AssignedToCell assignedToIds={assignedToIds} users={users} />;
    }
  },
  {
    accessorKey: 'status',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Stage</div>,
    cell: ({ row }) => <StatusSelector lead={row.original} />,
  },
];
