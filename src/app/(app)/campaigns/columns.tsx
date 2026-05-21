'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { buildPublicUrl } from '@/lib/utils';
import { deleteCampaign } from './actions';
import type { Campaign } from '@/types';
import { useTransition } from 'react';

const CampaignActions = ({ campaign }: { campaign: Campaign }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const landingPath = `/landing/${encodeURIComponent(campaign.id)}`;
  const landingUrl = buildPublicUrl(landingPath);

  const copyText = async (value: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast({ title: 'Copied', description: successMessage });
    } catch (error) {
      console.error('COPY_CAMPAIGN_VALUE_FAILED:', error);
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Please try again or copy manually.' });
    }
  };

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => copyText(campaign.id, 'Campaign ID copied to clipboard.')}>
            Copy campaign ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copyText(landingUrl, 'Landing page link copied to clipboard.')}>
              Copy landing page link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            disabled={isPending}
            onClick={() => {
              const confirmed = window.confirm(`Delete campaign "${campaign.name}"? This will also delete captured landing leads.`);
              if (!confirmed) return;
              startTransition(async () => {
                const result = await deleteCampaign({
                  teamspaceId: campaign.teamspaceId,
                  campaignId: campaign.id,
                });
                if (result.success) {
                  toast({ title: 'Campaign deleted', description: 'The campaign and its landing leads were removed.' });
                } else {
                  toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
                }
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
};


export const columns: ColumnDef<Campaign>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>
  },
  {
    id: 'view',
    header: 'View',
    cell: ({ row }) => {
      const campaign = row.original;
      const landingPath = `/landing/${encodeURIComponent(campaign.id)}`;
      const landingUrl = buildPublicUrl(landingPath);
      return (
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={`/campaigns/${campaign.id}`}>Open</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => window.open(landingUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
        status === 'Active' ? 'default' :
        status === 'Completed' ? 'secondary' :
        status === 'Planned' ? 'outline' : 'destructive';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'landingPath',
    header: 'Landing Link',
    cell: ({ row }) => {
      const landingPath = `/landing/${encodeURIComponent(row.original.id)}`;
      return <span className="text-xs font-medium">{landingPath}</span>;
    },
  },
  {
    accessorKey: 'budget',
    header: () => <div className="text-right">Budget</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('budget'))
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'budgetInterval',
    header: 'Budget Type',
    cell: ({ row }) => <Badge variant="outline">{(row.getValue('budgetInterval') as string) || 'Daily'}</Badge>,
  },
  {
    id: 'actions',
    cell: ({ row }) => <CampaignActions campaign={row.original} />,
  },
];
