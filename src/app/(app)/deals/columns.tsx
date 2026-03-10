'use client';

import { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Deal, UserProfile, DealStage, Contact } from '@/types';
import { updateDealStage } from './actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const stages: DealStage[] = ['new', 'pending', 'not connect', 'busy', 'done', 'cancel'];

const StageSelector = ({ deal }: { deal: Deal }) => {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const handleStageChange = (newStage: DealStage) => {
    if (!currentTeamspace) return;
    startTransition(async () => {
      const result = await updateDealStage({
        dealId: deal.id,
        teamspaceId: currentTeamspace.id,
        stage: newStage,
      });

      if (result.success) {
        toast({
          title: 'Pipeline Updated',
          description: `Opportunity moved to "${newStage}".`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Transition Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <Select 
      disabled={isPending} 
      defaultValue={deal.stage} 
      onValueChange={(v) => handleStageChange(v as DealStage)}
    >
      <SelectTrigger className="h-8 w-[140px] rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted/50 border-none">
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map(s => (
          <SelectItem key={s} value={s} className="text-[10px] font-black uppercase">{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const columns: ColumnDef<Deal>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="font-black uppercase tracking-widest text-[10px] hover:bg-transparent px-0">
          Deal Name
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-black text-primary tracking-tight text-sm">{row.getValue('name')}</span>,
  },
  {
    id: 'email',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Email</div>,
    cell: ({ row, table }) => {
        const contactId = row.original.contactId;
        const contacts = (table.options.meta as any)?.contacts || [] as Contact[];
        const contact = contacts.find((c: Contact) => c.id === contactId);
        return <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{contact?.email || 'N/A'}</span>
    }
  },
  {
    id: 'phone',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Phone Number</div>,
    cell: ({ row, table }) => {
        const contactId = row.original.contactId;
        const contacts = (table.options.meta as any)?.contacts || [] as Contact[];
        const contact = contacts.find((c: Contact) => c.id === contactId);
        return <span className="text-xs font-bold text-foreground">{contact?.phone || 'N/A'}</span>
    }
  },
  {
    accessorKey: 'updatedAt',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Update Date</div>,
    cell: ({ row }) => {
        const date = row.original.updatedAt || row.original.createdAt;
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return <span className="text-[10px] font-bold text-muted-foreground">{format(d, 'PP')}</span>;
    },
  },
  {
    accessorKey: 'ownerId',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Assigned Person</div>,
    cell: ({ row, table }) => {
        const ownerId = row.getValue('ownerId') as string;
        const users = (table.options.meta as any)?.users || [] as UserProfile[];
        const user = users.find((u: UserProfile) => u.id === ownerId);
        
        if (!user) return <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Unassigned</span>;

        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 ring-1 ring-primary/5">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-black">{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-foreground">{user.displayName}</span>
            </div>
        );
    }
  },
  {
    accessorKey: 'stage',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Stage</div>,
    cell: ({ row }) => <StageSelector deal={row.original} />,
  },
];
