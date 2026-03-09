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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { AssignLeadDialog } from './assign-lead-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

function LeadScoringResultDialog({ open, onOpenChange, result, leadName }: { open: boolean; onOpenChange: (open: boolean) => void; result: AiLeadScoringAndPrioritizationOutput | null, leadName: string }) {
  if (!result) return null;

  const getPriorityBadgeColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High': return 'bg-red-500 hover:bg-red-500';
      case 'Medium': return 'bg-yellow-500 hover:bg-yellow-500';
      case 'Low': return 'bg-green-500 hover:bg-green-500';
      default: return 'bg-gray-500 hover:bg-gray-500';
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary"/>
            AI Lead Score for {leadName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Here is the AI-generated score and priority for this lead based on the available data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 space-y-4">
          <div className="flex items-baseline justify-center gap-4">
            <div className="text-6xl font-bold">{result.leadScore}</div>
            <div className="text-2xl text-muted-foreground">/ 100</div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium">Priority:</span>
            <Badge className={getPriorityBadgeColor(result.priority)}>{result.priority}</Badge>
          </div>
          <div>
            <h4 className="font-semibold">Reasoning:</h4>
            <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md border">{result.reasoning}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Close</AlertDialogAction>
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
        title: "AI Scoring Failed",
        description: response.error || 'An unknown error occurred.',
      });
    }
    setIsLoading(false);
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(lead.id).then(() => {
      toast({ title: 'Copied!', description: 'Lead ID copied to clipboard.' });
    }).catch(() => {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy ID.' });
    });
  };

  return (
    <>
      <LeadScoringResultDialog open={isScoringDialogOpen} onOpenChange={setScoringDialogOpen} result={result} leadName={lead.fullName} />
      <AssignLeadDialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen} lead={lead} users={users} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
           <DropdownMenuItem asChild>
            <Link href={`/leads/${lead.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleScoreLead} disabled={isLoading}>
            <Bot className="mr-2 h-4 w-4" />
            {isLoading ? 'Scoring...' : 'Score with AI'}
          </DropdownMenuItem>
          {canAssign && (
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAssignDialogOpen(true); }}>
              <Users className="mr-2 h-4 w-4" />
              Assign Lead
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyId}>
            Copy lead ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const CreatedAtCell = ({ dateString }: { dateString: string }) => {
    const [formatted, setFormatted] = useState<string>('');
    
    useEffect(() => {
        if (!dateString) return;
        try {
            setFormatted(formatDistanceToNow(new Date(dateString), { addSuffix: true }));
        } catch (e) {
            setFormatted('N/A');
        }
    }, [dateString]);

    return <span>{formatted || '...'}</span>;
};

export const columns: ColumnDef<Lead>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/leads/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.getValue('fullName')}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="truncate max-w-[150px] inline-block">{row.getValue('email') || '-'}</span>
  },
    {
    accessorKey: 'assignedToIds',
    header: 'Assigned To',
    cell: ({ row, table }) => {
        const assignedToIds = row.getValue('assignedToIds');
        const ids = Array.isArray(assignedToIds) ? assignedToIds : [];
        const users = (table.options.meta as any)?.users || [];
        const assignedUsers = ids.map(id => users.find((u: any) => u.id === id)).filter(Boolean) as UserProfile[];
        
        if (assignedUsers.length === 0) {
            return <span className="text-muted-foreground text-xs italic">Unassigned</span>;
        }

        const visibleUsers = assignedUsers.slice(0, 3);
        const remainingCount = assignedUsers.length - visibleUsers.length;

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center -space-x-2">
                        {visibleUsers.map(user => (
                            <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={user.avatar} alt={user.displayName} />
                                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                        {remainingCount > 0 && (
                            <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarFallback>+{remainingCount}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {assignedUsers.map(u => u.displayName).join(', ')}
                </TooltipContent>
            </Tooltip>
        );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Qualified' || status === 'Converted' ? 'default' :
        status === 'New' ? 'outline' :
        status === 'Contacted' ? 'secondary' : 'destructive';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
   {
    accessorKey: 'score',
    header: 'AI Score',
    cell: ({ row }) => {
      const score = row.original.score;
      if (score === undefined || score === null) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-semibold">{score}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => <CreatedAtCell dateString={row.getValue('createdAt')} />,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => <LeadActions lead={row.original} table={table} />,
  },
];
