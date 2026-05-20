'use client';

import { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ExternalLink, Loader2, ClipboardList, BellRing } from 'lucide-react';
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
import { setLeadReminder, updateLeadStatus } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import { Badge } from '@/components/ui/badge';

const statuses: LeadStatus[] = ['new', 'intrested', 'CNP', 'done', 'not intrested'];

const normalizeStatus = (status: string): LeadStatus => {
  const map: Record<string, LeadStatus> = {
    'pending': 'intrested',
    'interested': 'intrested',
    'busy': 'CNP',
    'cancelled': 'not intrested',
    'canceled': 'not intrested',
    'not interested': 'not intrested',
  };
  return map[status.toLowerCase()] || (status as LeadStatus);
};

const getPrefilledGoogleFormUrl = (lead: Lead, currentUser: UserProfile | null) => {
  const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfAnhtLkqtbd408RGQ31Ad9m6EfwE3dx_UmtPFgI-yyuQykug/viewform';
  const params = new URLSearchParams();
  
  params.append('usp', 'pp_url');
  params.append('entry.1165241773', currentUser?.displayName || ''); // Sale Person
  params.append('entry.1228229865', lead.fullName || '');             // Customer Name
  params.append('entry.1741544755', lead.phone || '');                // Phone No.
  params.append('entry.492500057', lead.email || '');                 // Mail
  params.append('entry.2001479836', lead.demographicData?.country || ''); // Address/Location
  params.append('entry.1444985794', normalizeStatus(lead.status));    // Response
  
  return `${baseUrl}?${params.toString()}`;
};

const StatusSelector = ({ lead }: { lead: Lead }) => {
  const { toast } = useToast();
  const { currentTeamspace, currentUser } = useApp();
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
          title: 'Stage Transitioned',
          description: (
            <div className="flex flex-col gap-3 pt-2">
              <p className="font-medium">Lead moved to "{newStatus}".</p>
              <Button variant="default" size="sm" asChild className="herbal-gradient w-fit rounded-xl font-bold shadow-lg">
                <a href={getPrefilledGoogleFormUrl(lead, currentUser)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Open Feedback Form
                </a>
              </Button>
            </div>
          ),
        });
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
      }
    });
  };

  const currentStatus = normalizeStatus(lead.status);

  return (
    <div className="flex items-center gap-2">
      <Select 
        key={lead.id}
        disabled={isPending} 
        value={currentStatus} 
        onValueChange={(v) => handleStatusChange(v as LeadStatus)}
      >
        <SelectTrigger className="h-8 w-[130px] rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted/30 border-none">
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map(s => (
            <SelectItem key={s} value={s} className="text-[10px] font-black uppercase">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-full" asChild>
            <a href={getPrefilledGoogleFormUrl(lead, currentUser)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-xl font-bold">Feedback Loop</TooltipContent>
      </Tooltip>
    </div>
  );
};

const ReminderSelector = ({ lead }: { lead: Lead }) => {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();
  const reminderDays = typeof lead.reminderDays === 'number' ? String(lead.reminderDays) : '0';

  const handleReminderChange = (value: string) => {
    if (!currentTeamspace) return;
    const days = Number(value);

    startTransition(async () => {
      const result = await setLeadReminder({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        reminderDays: days,
      });

      if (result.success) {
        toast({
          title: days === 0 ? 'Reminder Cleared' : 'Reminder Scheduled',
          description: days === 0
            ? `Reminder removed for ${lead.fullName}.`
            : `Team leader will be reminded in ${days} day${days === 1 ? '' : 's'} for ${lead.fullName}.`,
        });
      } else {
        toast({ variant: 'destructive', title: 'Reminder Failed', description: result.error });
      }
    });
  };

  return (
    <Select disabled={isPending} value={reminderDays} onValueChange={handleReminderChange}>
      <SelectTrigger className="h-8 w-[116px] rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted/30 border-none">
        {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <BellRing className="mr-2 h-3 w-3 text-primary" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0" className="text-[10px] font-black uppercase">No Reminder</SelectItem>
        {Array.from({ length: 15 }, (_, index) => index + 1).map(day => (
          <SelectItem key={day} value={String(day)} className="text-[10px] font-black uppercase">
            {day} Day{day === 1 ? '' : 's'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Team Jurisdiction</p>
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
    accessorKey: 'createdAt',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Created</div>,
    cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return <span className="text-[10px] font-bold text-muted-foreground">{format(d, 'PPp')}</span>;
    },
  },
  {
    accessorKey: 'fullName',
    filterFn: 'includesString',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="font-black uppercase tracking-widest text-[10px] hover:bg-transparent px-0">
          Name
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lead = row.original;
      const { currentUser } = useApp();
      const isAdminOrTL = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

      return (
        <div className="flex flex-col gap-1">
          <span className="font-black text-primary tracking-tight text-sm">{lead.fullName}</span>
          {isAdminOrTL && lead.reassigned && <Badge variant="outline" className="w-fit text-[8px] font-black uppercase bg-accent/10 border-accent/20">Reassigned</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Email</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{row.getValue('email') || 'N/A'}</span>
  },
  {
    accessorKey: 'phone',
    filterFn: 'includesString',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Phone</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue('phone') || 'N/A'}</span>
  },
  {
    accessorKey: 'source',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Source</div>,
    cell: ({ row }) => <Badge variant="secondary" className="text-[9px] font-black uppercase">{row.getValue('source') || 'Direct'}</Badge>
  },
  {
    accessorKey: 'reminderDays',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Reminder</div>,
    cell: ({ row }) => <ReminderSelector lead={row.original} />
  },
  {
    accessorKey: 'status',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Stage</div>,
    cell: ({ row }) => <StatusSelector lead={row.original} />
  },
  {
    accessorKey: 'assignedToIds',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Owner</div>,
    cell: ({ row, table }) => {
        const assignedToIds = row.getValue('assignedToIds') as string[] || [];
        const users = (table.options.meta as any)?.users || [];
        return <AssignedToCell assignedToIds={assignedToIds} users={users} />;
    }
  },
];
