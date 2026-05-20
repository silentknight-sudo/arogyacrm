'use client';

import { useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Loader2, BellRing, PencilLine } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

const UpdateLeadDialog = ({ lead }: { lead: Lead }) => {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(normalizeStatus(lead.status));
  const [reminderUnit, setReminderUnit] = useState<'none' | 'hours' | 'days'>(
    lead.reminderAt ? (lead.reminderUnit || 'days') : 'none'
  );
  const [reminderValue, setReminderValue] = useState<string>(
    lead.reminderValue ? String(lead.reminderValue) : ''
  );

  const reminderRequired = status === 'intrested';

  const handleSave = () => {
    if (!currentTeamspace) return;
    const parsedReminderValue = Number(reminderValue || '0');

    if (reminderRequired && (reminderUnit === 'none' || parsedReminderValue <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Reminder Required',
        description: 'Choose hours or days and enter a valid reminder time for interested leads.',
      });
      return;
    }

    startTransition(async () => {
      const statusResult = await updateLeadStatus({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        status,
      });

      if (!statusResult.success) {
        toast({ variant: 'destructive', title: 'Update Failed', description: statusResult.error });
        return;
      }

      const reminderResult = await setLeadReminder({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        reminderValue: reminderRequired ? parsedReminderValue : 0,
        reminderUnit: reminderRequired && reminderUnit !== 'none' ? reminderUnit : 'days',
      });

      if (!reminderResult.success) {
        toast({ variant: 'destructive', title: 'Reminder Failed', description: reminderResult.error });
        return;
      }

      toast({
        title: 'Lead Updated',
        description: reminderRequired
          ? `${lead.fullName} moved to ${status} with a ${parsedReminderValue} ${reminderUnit} reminder.`
          : `${lead.fullName} moved to ${status}.`,
      });
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl border-primary/10 bg-background font-black uppercase tracking-[0.15em] text-[10px]">
          <PencilLine className="mr-2 h-3.5 w-3.5" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2rem] border border-border/60 bg-card p-8 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-primary">Update Lead</DialogTitle>
          <DialogDescription className="text-base font-medium">
            Move {lead.fullName} to the next stage and schedule a reminder when needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
              Stage
            </Label>
            <Select disabled={isPending} value={status} onValueChange={(value) => setStatus(value as LeadStatus)}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item} className="font-bold">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reminderRequired && (
            <div className="rounded-2xl border border-primary/10 bg-muted/20 p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BellRing className="h-4 w-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Reminder</p>
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Input
                  type="number"
                  min="1"
                  value={reminderValue}
                  onChange={(event) => setReminderValue(event.target.value)}
                  placeholder="Enter time"
                  className="h-11 rounded-xl border-none bg-background shadow-inner font-bold"
                />
                <Select
                  disabled={isPending}
                  value={reminderUnit}
                  onValueChange={(value) => setReminderUnit(value as 'none' | 'hours' | 'days')}
                >
                  <SelectTrigger className="h-11 rounded-xl border-none bg-background shadow-inner font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Team leaders will keep seeing the popup reminder until they close it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full h-12 rounded-xl herbal-gradient font-black"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    id: 'update',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Update</div>,
    cell: ({ row }) => <UpdateLeadDialog lead={row.original} />
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
