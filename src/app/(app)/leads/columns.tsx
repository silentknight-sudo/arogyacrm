'use client';

import { useState, useEffect } from 'react';
import { ColumnDef, type Table as TanstackTable } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Star, Bot, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Lead, UserProfile } from '@/types';
import { scoreLeadWithAI } from './actions';
import { AiLeadScoringAndPrioritizationOutput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { AssignLeadDialog } from './assign-lead-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

function LeadScoringResultDialog({ 
  open, 
  onOpenChange, 
  result, 
  leadName 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  result: AiLeadScoringAndPrioritizationOutput | null;
  leadName: string;
}) {
  if (!result) return null;

  const getPriorityBadgeColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High': return 'bg-red-500 hover:bg-red-500';
      case 'Medium': return 'bg-yellow-500 hover:bg-yellow-500';
      case 'Low': return 'bg-green-500 hover:bg-green-500';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl font-black text-primary">
            <Bot className="h-6 w-6 text-accent fill-accent"/>
            Strategic AI Intelligence
          </AlertDialogTitle>
          <AlertDialogDescription className="font-medium">
            AI-generated performance score for {leadName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-6 space-y-6">
          <div className="flex items-baseline justify-center gap-4 bg-primary/5 p-8 rounded-[2rem] border border-primary/5">
            <div className="text-7xl font-black tracking-tighter text-primary">{result.leadScore}</div>
            <div className="text-xl font-bold text-muted-foreground uppercase tracking-widest">/ 100</div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Priority Assignment</span>
            <Badge className={`${getPriorityBadgeColor(result.priority)} rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-lg text-white`}>
              {result.priority}
            </Badge>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-2">Decision Reasoning</h4>
            <p className="text-sm font-medium text-muted-foreground p-5 bg-muted/20 rounded-2xl border border-primary/5 italic">
              "{result.reasoning}"
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Dismiss Insights</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const LeadActions = ({ lead, table }: { lead: Lead, table: TanstackTable<Lead> }) => {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiLeadScoringAndPrioritizationOutput | null>(null);
  const [isScoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);

  const users = (table.options.meta as any)?.users || [];
  const canAssign = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

  const handleScoreLead = async () => {
    setIsLoading(true);
    const response = await scoreLeadWithAI(lead);
    if (response.success && response.data) {
      setResult(response.data);
      setScoringDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Intelligence Extraction Failed",
        description: response.error || 'Check system audit logs.',
      });
    }
    setIsLoading(false);
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(lead.id).then(() => {
      toast({ title: 'System Key Copied', description: 'Lead reference ID stored in clipboard.' });
    }).catch(() => {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Permission denied for clipboard access.' });
    });
  };

  return (
    <>
      <LeadScoringResultDialog open={isScoringDialogOpen} onOpenChange={setScoringDialogOpen} result={result} leadName={lead.fullName} />
      <AssignLeadDialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen} lead={lead} users={users} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
            <span className="sr-only">Open Menu</span>
            <MoreHorizontal className="h-4 w-4 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">Prospect Operations</DropdownMenuLabel>
           <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2.5">
            <Link href={`/leads/${lead.id}`}>
              <Users className="mr-3 h-4 w-4 text-primary" />
              <span className="font-bold">View Pipeline Entry</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleScoreLead} disabled={isLoading} className="rounded-xl cursor-pointer py-2.5">
            <Bot className="mr-3 h-4 w-4 text-accent fill-accent" />
            <span className="font-bold">{isLoading ? 'Processing AI...' : 'Strategic AI Scoring'}</span>
          </DropdownMenuItem>
          {canAssign && (
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAssignDialogOpen(true); }} className="rounded-xl cursor-pointer py-2.5">
              <Users className="mr-3 h-4 w-4 text-primary" />
              <span className="font-bold">Delegate Prospect</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem onClick={handleCopyId} className="rounded-xl cursor-pointer py-2.5 text-xs text-muted-foreground">
            Copy System Reference ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
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
          Stakeholder Name
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Link href={`/leads/${row.original.id}`} className="font-black text-primary hover:text-accent transition-colors tracking-tight text-base">
            {row.getValue('fullName')}
        </Link>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">{row.original.source || 'Discovery Channel'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Contact Logic</div>,
    cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{row.getValue('email') || 'N/A'}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{row.original.phone || 'No phone recorded'}</span>
        </div>
    )
  },
  {
    accessorKey: 'assignedToIds',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Strategic Assignment</div>,
    cell: ({ row, table }) => {
        const assignedToIds = row.getValue('assignedToIds') as string[] || [];
        const users = (table.options.meta as any)?.users || [];
        return <AssignedToCell assignedToIds={assignedToIds} users={users} />;
    }
  },
  {
    accessorKey: 'status',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Pipeline Stage</div>,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Qualified' || status === 'Converted' ? 'default' :
        status === 'New' ? 'outline' :
        status === 'Contacted' ? 'secondary' : 'destructive';
      return <Badge variant={variant} className="capitalize rounded-full px-3 py-0.5 text-[10px] font-black tracking-widest border-none shadow-sm">{status}</Badge>;
    },
  },
   {
    accessorKey: 'score',
    header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="font-black uppercase tracking-widest text-[10px] hover:bg-transparent px-0">
            AI Tier
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        );
    },
    cell: ({ row }) => {
      const score = row.original.score;
      if (score === undefined || score === null) return <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-20">Pending</span>;
      return (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
          </div>
          <span className="font-black text-lg tracking-tighter text-primary">{score}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <div className="font-black uppercase tracking-widest text-[10px]">Discovery Date</div>,
    cell: ({ row }) => {
        const date = row.getValue('createdAt');
        const formatted = date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'N/A';
        return <span className="text-xs font-medium text-muted-foreground">{formatted}</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => <LeadActions lead={row.original} table={table} />,
  },
];
