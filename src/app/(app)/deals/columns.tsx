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
import type { Deal, UserProfile, DealStage, Contact, Lead } from '@/types';
import { updateDealStage } from './actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const stages: DealStage[] = ['new', 'interested', 'not connect', 'CNP', 'done', 'not interested'];

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

const ItemsCell = ({ lineItems }: { lineItems: any[] }) => {
    if (!lineItems || lineItems.length === 0) return <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40 italic">No Items</span>;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 flex gap-2 items-center text-muted-foreground hover:text-primary rounded-lg border-primary/5">
                    <Package className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {lineItems.length} Products
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 rounded-2xl border-none shadow-2xl bg-card">
                <div className="p-3 border-b border-muted/50 bg-muted/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Strategic Order Configuration</p>
                </div>
                <ScrollArea className="h-48">
                    <div className="p-2 space-y-1">
                        {lineItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-muted/10 border border-primary/5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold leading-tight">{item.productName}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-black">Qty: {item.quantity}</span>
                                </div>
                                <span className="text-[10px] font-black text-primary">₹{item.subtotal.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
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
        const deal = row.original;
        const meta = table.options.meta as any;
        const contacts = meta?.contacts || [] as Contact[];
        const leads = meta?.leads || [] as Lead[];
        
        let email = contacts.find((c: Contact) => c.id === deal.contactId)?.email;
        if (!email && deal.leadId) {
            email = leads.find((l: Lead) => l.id === deal.leadId)?.email;
        }
        
        return <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{email || 'N/A'}</span>;
    }
  },
  {
    id: 'phone',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Phone Number</div>,
    cell: ({ row, table }) => {
        const deal = row.original;
        const meta = table.options.meta as any;
        const contacts = meta?.contacts || [] as Contact[];
        const leads = meta?.leads || [] as Lead[];
        
        let phone = contacts.find((c: Contact) => c.id === deal.contactId)?.phone;
        if (!phone && deal.leadId) {
            phone = leads.find((l: Lead) => l.id === deal.leadId)?.phone;
        }
        
        return <span className="text-xs font-bold text-foreground">{phone || 'N/A'}</span>;
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
    accessorKey: 'lineItems',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Items</div>,
    cell: ({ row }) => <ItemsCell lineItems={row.original.lineItems} />,
  },
  {
    accessorKey: 'stage',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Stage</div>,
    cell: ({ row }) => <StageSelector deal={row.original} />,
  },
];
