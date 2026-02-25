'use client';

import { useState, useTransition } from 'react';
import { ColumnDef, type Table as TanstackTable } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Star, Bot, Users, ChevronsRight } from 'lucide-react';
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
import { scoreLeadWithAI, convertLead } from './actions';
import { AiLeadScoringAndPrioritizationOutput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useApp } from '@/context/app-context';
import { AssignLeadDialog } from './assign-lead-dialog';

function LeadScoringResultDialog({ open, onOpenChange, result, leadName }: { open: boolean; onOpenChange: (open: boolean) => void; result: AiLeadScoringAndPrioritizationOutput | null, leadName: string }) {
  if (!result) return null;

  const getPriorityBadgeColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return 'bg-red-500 hover:bg-red-500';
      case 'Medium':
        return 'bg-yellow-500 hover:bg-yellow-500';
      case 'Low':
        return 'bg-green-500 hover:bg-green-500';
      default:
        return 'bg-gray-500 hover:bg-gray-500';
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
  const [isConverting, startConvertTransition] = useTransition();
  const [isConvertAlertOpen, setConvertAlertOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);


  const users = (table.options.meta as { users?: UserProfile[] })?.users || [];
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
        description: response.error,
      });
    }
    setIsLoading(false);
  };
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(lead.id).then(() => {
      toast({
        title: 'Copied!',
        description: 'Lead ID copied to clipboard.',
      });
    }).catch(err => {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy ID to clipboard.',
      });
      console.error('Failed to copy ID: ', err);
    });
  };

  const handleConvertLead = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You are not authenticated.' });
      return;
    }
    startConvertTransition(async () => {
      const result = await convertLead({ leadId: lead.id, teamspaceId: lead.teamspaceId, currentUserId: currentUser.id });
      if (result.success) {
        toast({
          title: 'Lead Converted',
          description: `Successfully converted ${lead.fullName} to a contact and account.`,
        });
        setConvertAlertOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Conversion Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <>
      <LeadScoringResultDialog open={isScoringDialogOpen} onOpenChange={setScoringDialogOpen} result={result} leadName={lead.fullName} />
      <AssignLeadDialog
        open={isAssignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={lead}
        users={users}
      />
      <AlertDialog open={isConvertAlertOpen} onOpenChange={setConvertAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert this Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new Account and Contact from '{lead.fullName}'. The lead's status will be set to 'Converted'. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertLead} disabled={isConverting}>
              {isConverting ? 'Converting...' : 'Yes, Convert Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <DropdownMenuItem onSelect={() => setAssignDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Assign Lead
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
           <DropdownMenuItem onSelect={() => setConvertAlertOpen(true)} disabled={lead.status === 'Converted'}>
                <ChevronsRight className="mr-2 h-4 w-4" />
                Convert Lead
            </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyId}>
            Copy lead ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
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
  },
    {
    accessorKey: 'assignedToId',
    header: 'Assigned To',
    cell: ({ row, table }) => {
        const assignedToId = row.getValue('assignedToId') as string;
        const users = (table.options.meta as { users?: UserProfile[] })?.users || [];
        const user = users.find(u => u.id === assignedToId);
        return user ? user.displayName : <span className="text-muted-foreground">Unassigned</span>;
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
    accessorKey: 'source',
    header: 'Source',
  },
   {
    accessorKey: 'score',
    header: 'AI Score',
    cell: ({ row }) => {
      const score = row.original.score;
      if (!score) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>{score}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => <LeadActions lead={row.original} table={table} />,
  },
];
