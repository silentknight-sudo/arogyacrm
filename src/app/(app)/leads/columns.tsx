'use client';

import { useState, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Loader2, BellRing, PencilLine, CheckCircle2, CircleOff, PauseCircle, XCircle, History, Hourglass } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { getLeadStatusLabel } from '@/lib/status-labels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusCards: Array<{ status: LeadStatus; icon: any; className: string }> = [
  { status: 'new', icon: Hourglass, className: 'border-amber-200 bg-amber-50 text-amber-700' },
  { status: 'done', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { status: 'not intrested', icon: XCircle, className: 'border-rose-200 bg-rose-50 text-rose-700' },
  { status: 'intrested', icon: PauseCircle, className: 'border-sky-200 bg-sky-50 text-sky-700' },
  { status: 'CNP', icon: CircleOff, className: 'border-orange-200 bg-orange-50 text-orange-700' },
];

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
  const { currentTeamspace, currentUser } = useApp();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(normalizeStatus(lead.status));
  const [reminderUnit, setReminderUnit] = useState<'none' | 'hours' | 'days'>(
    lead.reminderAt ? (lead.reminderUnit || 'days') : 'none'
  );
  const [reminderValue, setReminderValue] = useState<string>(
    lead.reminderValue ? String(lead.reminderValue) : ''
  );
  const [note, setNote] = useState('');

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
        note,
        updatedBy: currentUser?.displayName || currentUser?.email || '',
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
          ? `${lead.fullName} moved to ${getLeadStatusLabel(status)} with a ${parsedReminderValue} ${reminderUnit} reminder.`
          : `${lead.fullName} moved to ${getLeadStatusLabel(status)}.`,
      });
      setOpen(false);
    });
  };

  const history = [...(lead.statusHistory || [])].reverse();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-xl border-primary/10 bg-background font-black uppercase tracking-[0.15em] text-[10px]">
          <PencilLine className="mr-2 h-3.5 w-3.5" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl rounded-[2rem] border border-border/60 bg-card p-8 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-4 text-2xl font-black text-primary">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{lead.fullName?.slice(0, 2).toUpperCase()}</span>
            <span>{lead.fullName}</span>
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            Lead ID: {lead.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="update" className="mt-2">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="update" className="rounded-xl font-black"><PencilLine className="mr-2 h-4 w-4" />Update Lead</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-black"><History className="mr-2 h-4 w-4" />History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="mt-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                Select Status
              </Label>
              <div className="grid gap-3 sm:grid-cols-5">
                {statusCards.map((item) => {
                  const Icon = item.icon;
                  const selected = status === item.status;
                  return (
                    <button
                      key={item.status}
                      type="button"
                      disabled={isPending}
                      onClick={() => setStatus(item.status)}
                      className={`rounded-2xl border p-4 text-center transition-all hover:scale-[1.02] ${item.className} ${selected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-80'}`}
                    >
                      <Icon className="mx-auto mb-2 h-6 w-6" />
                      <span className="text-xs font-black">{getLeadStatusLabel(item.status)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                Remark / Query
              </Label>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add caller remark, query, or follow-up note" className="min-h-24 rounded-2xl border-primary/10" />
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
          </TabsContent>

          <TabsContent value="history" className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No history yet.</div>
            ) : history.map((item, index) => {
              const updatedAt = item.updatedAt?.toDate ? item.updatedAt.toDate() : item.updatedAt ? new Date(item.updatedAt) : null;
              return (
                <div key={`${item.status}-${index}`} className="overflow-hidden rounded-2xl border bg-background">
                  <div className="bg-primary/10 px-5 py-3 text-sm font-black text-primary">{updatedAt ? format(updatedAt, 'PPp') : 'Time not provided'}</div>
                  <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Name</p><p className="font-bold">{lead.fullName}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">TC Name</p><p className="font-bold">{item.updatedBy || 'not provided'}</p></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Last Status</p><Badge>{getLeadStatusLabel(item.status)}</Badge></div>
                    <div><p className="text-[10px] font-black uppercase text-muted-foreground">Campaign</p><p className="font-bold">{lead.campaignId || 'not provided'}</p></div>
                    <div className="sm:col-span-2"><p className="text-[10px] font-black uppercase text-muted-foreground">Remark</p><p className="font-medium text-muted-foreground">{item.note || 'not provided'}</p></div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const AssignedToCell = ({ assignedToIds, users }: { assignedToIds: string[], users: UserProfile[] }) => {
    const assignedUsers = (assignedToIds || []).map(id => users.find(u => u.id === id)).filter(Boolean) as UserProfile[];
    if (assignedUsers.length === 0) return <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic opacity-40">Unassigned</span>;

    return (
        <div className="flex max-w-[220px] flex-wrap gap-1.5">
            {assignedUsers.map(user => (
                <Badge key={user.id} variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-black">
                    {user.displayName}
                </Badge>
            ))}
        </div>
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
