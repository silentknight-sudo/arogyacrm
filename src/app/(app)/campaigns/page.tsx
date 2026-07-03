'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Campaign, Lead } from '@/types';
import { useApp } from '@/context/app-context';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCampaignDialog } from './create-campaign-dialog';
import { getLeadStatusLabel } from '@/lib/status-labels';

export default function CampaignsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const campaignsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);

  const leadsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'))
      : null
  , [firestore, currentTeamspace]);

  const { data: leads, isLoading: isLoadingLeads } = useCollection<Lead>(leadsQuery);

  const getCampaignCounts = (campaign: Campaign) => {
    const campaignLeads = (leads || []).filter((lead) => lead.campaignId === campaign.id || lead.source === campaign.name);
    return {
      new: campaignLeads.filter((lead) => lead.status === 'new').length,
      pending: campaignLeads.filter((lead) => lead.status === 'new').length,
      cnp: campaignLeads.filter((lead) => lead.status === 'CNP').length,
      done: campaignLeads.filter((lead) => lead.status === 'done').length,
      hold: campaignLeads.filter((lead) => lead.status === 'intrested').length,
      rejected: campaignLeads.filter((lead) => lead.status === 'not intrested').length,
      total: campaignLeads.length,
    };
  };

  return (
    <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-primary">Campaign Management</h1>
                <p className="text-muted-foreground font-medium">
                    Campaign-wise lead totals and stage distribution.
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <CreateCampaignDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </CreateCampaignDialog>
            </div>
        </div>
        <div className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-4 text-left font-black">S.No</th>
                <th className="px-4 py-4 text-left font-black">Campaign</th>
                <th className="px-4 py-4 text-left font-black">New Leads</th>
                <th className="px-4 py-4 text-left font-black">{getLeadStatusLabel('new')} Leads</th>
                <th className="px-4 py-4 text-left font-black">{getLeadStatusLabel('CNP')} Leads</th>
                <th className="px-4 py-4 text-left font-black">{getLeadStatusLabel('done')} Leads</th>
                <th className="px-4 py-4 text-left font-black">{getLeadStatusLabel('intrested')} Leads</th>
                <th className="px-4 py-4 text-left font-black">{getLeadStatusLabel('not intrested')} Leads</th>
                <th className="px-4 py-4 text-left font-black">Total Leads</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading || isLoadingLeads) ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>Loading campaign counts...</td></tr>
              ) : (campaigns || []).length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>No campaigns found.</td></tr>
              ) : (campaigns || []).map((campaign, index) => {
                const counts = getCampaignCounts(campaign);
                return (
                  <tr key={campaign.id} className="border-t">
                    <td className="px-4 py-3 font-bold">{index + 1}</td>
                    <td className="px-4 py-3 font-black text-primary">{campaign.name}</td>
                    <td className="px-4 py-3">{counts.new}</td>
                    <td className="px-4 py-3">{counts.pending}</td>
                    <td className="px-4 py-3">{counts.cnp}</td>
                    <td className="px-4 py-3">{counts.done}</td>
                    <td className="px-4 py-3">{counts.hold}</td>
                    <td className="px-4 py-3">{counts.rejected}</td>
                    <td className="px-4 py-3 font-black">{counts.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isLoading && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isLoading && <DataTable columns={columns} data={campaigns || []} />}
    </div>
  );
}
