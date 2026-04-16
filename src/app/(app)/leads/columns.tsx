'use client';

import { useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ExternalLink, Loader2, Package, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead, UserProfile, LeadStatus, Product } from '@/types';
import { updateLeadStatus, updateLeadProducts } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useApp } from '@/context/app-context';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const getPrefilledGoogleFormUrl = (lead: Lead, currentUser: UserProfile | null, products: Product[]) => {
  const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfAnhtLkqtbd408RGQ31Ad9m6EfwE3dx_UmtPFgI-yyuQykug/viewform';
  const params = new URLSearchParams();
  
  params.append('usp', 'pp_url');
  params.append('entry.1165241773', currentUser?.displayName || '');
  params.append('entry.1228229865', lead.fullName || '');
  params.append('entry.1741544755', lead.phone || '');
  params.append('entry.492500057', lead.email || '');
  params.append('entry.2001479836', lead.demographicData?.country || '');
  params.append('entry.1444985794', normalizeStatus(lead.status));
  
  const selectedProductNames = (lead.productAsked || [])
    .map(id => products.find(p => p.id === id)?.name || '')
    .join(', ');

  let productChoice = 'Both'; 
  const hasCapsules = selectedProductNames.toLowerCase().includes('capsule');
  const hasOil = selectedProductNames.toLowerCase().includes('oil');
  
  if (hasCapsules && hasOil) productChoice = 'Both';
  else if (hasCapsules) productChoice = 'Gouthealth Capsules';
  else if (hasOil) productChoice = 'Gouthealth Oil';
  else productChoice = 'Both';

  params.append('entry.65345719', productChoice);
  
  return `${baseUrl}?${params.toString()}`;
};

const StatusSelector = ({ lead, products }: { lead: Lead, products: Product[] }) => {
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
                <a href={getPrefilledGoogleFormUrl(lead, currentUser, products)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
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
            <a href={getPrefilledGoogleFormUrl(lead, currentUser, products)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-xl font-bold">Open Pre-filled Form</TooltipContent>
      </Tooltip>
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
      return (
        <div className="flex flex-col gap-1">
          <span className="font-black text-primary tracking-tight text-sm">{lead.fullName}</span>
          {lead.reassigned && <Badge variant="outline" className="w-fit text-[8px] font-black uppercase bg-accent/10 border-accent/20">Reassigned</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Email address</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{row.getValue('email') || 'N/A'}</span>
  },
  {
    accessorKey: 'source',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Source</div>,
    cell: ({ row }) => <Badge variant="secondary" className="text-[9px] font-black uppercase">{row.getValue('source') || 'Direct'}</Badge>
  },
  {
    accessorKey: 'formName',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Form</div>,
    cell: ({ row }) => <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[100px]">{row.getValue('formName') || 'N/A'}</span>
  },
  {
    accessorKey: 'channel',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Channel</div>,
    cell: ({ row }) => <span className="text-[10px] font-bold uppercase">{row.getValue('channel') || 'Lead Gen'}</span>
  },
  {
    accessorKey: 'status',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Stage</div>,
    cell: ({ row, table }) => {
        const products = (table.options.meta as any)?.products || [];
        return <StatusSelector lead={row.original} products={products} />;
    }
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
  {
    accessorKey: 'labels',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Labels</div>,
    cell: ({ row }) => {
        const labels = row.getValue('labels') as string[] || [];
        return <div className="flex gap-1">{labels.map(l => <Badge key={l} className="text-[8px]">{l}</Badge>)}</div>
    }
  },
  {
    accessorKey: 'phone',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Phone</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue('phone') || 'N/A'}</span>
  },
  {
    accessorKey: 'secondaryPhone',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Secondary Phone</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue('secondaryPhone') || 'N/A'}</span>
  },
  {
    accessorKey: 'whatsappNumber',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">WhatsApp number</div>,
    cell: ({ row }) => <span className="text-xs font-bold text-foreground">{row.getValue('whatsappNumber') || 'N/A'}</span>
  },
];
