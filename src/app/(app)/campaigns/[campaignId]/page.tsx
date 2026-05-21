'use client';

import { useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteCampaign, importCampaignLeadToProspects } from '../actions';
import type { Campaign, CampaignLead } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { buildPublicUrl } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export default function CampaignDetailPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ campaignId: string }>();
  const [isPending, startTransition] = useTransition();
  const campaignId = Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId;

  const campaignRef = useMemoFirebase(() => (
    currentTeamspace?.id && campaignId
      ? doc(firestore, 'teamspaces', currentTeamspace.id, 'campaigns', campaignId)
      : null
  ), [firestore, currentTeamspace?.id, campaignId]);

  const leadsQuery = useMemoFirebase(() => (
    currentTeamspace?.id && campaignId
      ? query(
          collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns', campaignId, 'landingLeads'),
          orderBy('createdAt', 'desc')
        )
      : null
  ), [firestore, currentTeamspace?.id, campaignId]);

  const { data: campaign, isLoading: loadingCampaign } = useDoc<Campaign>(campaignRef);
  const { data: landingLeads, isLoading: loadingLeads } = useCollection<CampaignLead>(leadsQuery);

  const landingUrl = useMemo(() => {
    return buildPublicUrl(campaign?.landingPath);
  }, [campaign?.landingPath]);

  const handleImport = (campaignLeadId: string) => {
    if (!currentTeamspace?.id || !campaignId) return;
    startTransition(async () => {
      const result = await importCampaignLeadToProspects({
        teamspaceId: currentTeamspace.id,
        campaignId,
        campaignLeadId,
      });
      if (result.success) {
        toast({ title: 'Lead Imported', description: 'Lead moved to admin fresh prospects.' });
      } else {
        toast({ variant: 'destructive', title: 'Import Failed', description: result.error });
      }
    });
  };

  const handleCopyLink = async () => {
    if (!landingUrl) {
      toast({ variant: 'destructive', title: 'Link unavailable', description: 'Landing page link is not ready yet.' });
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(landingUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = landingUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast({ title: 'Link copied', description: 'Landing page link copied to clipboard.' });
    } catch (error) {
      console.error('COPY_LANDING_LINK_FAILED:', error);
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Please copy the landing link manually below.' });
    }
  };

  const handleOpenLandingPage = () => {
    if (!landingUrl) {
      toast({ variant: 'destructive', title: 'Link unavailable', description: 'Landing page link is not ready yet.' });
      return;
    }

    window.open(landingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteCampaign = () => {
    if (!currentTeamspace?.id || !campaignId || !campaign) return;
    const confirmed = window.confirm(`Delete campaign "${campaign.name}"? This will also remove captured landing leads.`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCampaign({
        teamspaceId: currentTeamspace.id,
        campaignId,
      });
      if (result.success) {
        toast({ title: 'Campaign deleted', description: 'Campaign removed successfully.' });
        router.push('/campaigns');
      } else {
        toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
      }
    });
  };

  if (loadingCampaign || loadingLeads) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-muted-foreground">Campaign not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-3xl font-black text-primary">{campaign.name}</CardTitle>
          <CardDescription className="text-base font-medium">
            {campaign.description || 'Landing-page campaign with direct CRM capture.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary">{campaign.status}</Badge>
              <Badge variant="outline">{campaign.type}</Badge>
              <Badge variant="outline">₹{campaign.currentPrice || 1999}</Badge>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-muted/20 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">Landing Page Link</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl" onClick={handleCopyLink}>
                  Copy Link
                </Button>
                <Button className="rounded-xl herbal-gradient" onClick={handleOpenLandingPage}>
                  Open Landing Page
                </Button>
              </div>
              <p className="mt-3 break-all text-sm font-medium text-muted-foreground">{landingUrl}</p>
            </div>
            <Button variant="destructive" className="rounded-xl" disabled={isPending} onClick={handleDeleteCampaign}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Campaign
            </Button>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-muted/20 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">Campaign Leads Snapshot</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-background p-4">
                <p className="text-xs font-black uppercase text-muted-foreground">Captured</p>
                <p className="mt-2 text-3xl font-black text-primary">{landingLeads?.length || 0}</p>
              </div>
              <div className="rounded-xl bg-background p-4">
                <p className="text-xs font-black uppercase text-muted-foreground">Imported</p>
                <p className="mt-2 text-3xl font-black text-primary">{landingLeads?.filter((lead) => lead.importedToProspects).length || 0}</p>
              </div>
              <div className="rounded-xl bg-background p-4">
                <p className="text-xs font-black uppercase text-muted-foreground">Pending</p>
                <p className="mt-2 text-3xl font-black text-primary">{landingLeads?.filter((lead) => !lead.importedToProspects).length || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-primary">Landing Page Leads</CardTitle>
          <CardDescription className="font-medium">
            Review captured leads and send them into admin fresh prospects when ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!landingLeads?.length ? (
            <div className="rounded-2xl border border-dashed border-primary/15 p-8 text-center text-muted-foreground font-medium italic">
              No landing leads captured yet.
            </div>
          ) : (
            landingLeads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-primary/10 bg-muted/20 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-black text-primary">{lead.fullName}</p>
                  <p className="text-sm font-medium text-muted-foreground">{lead.phone} {lead.city ? `• ${lead.city}` : ''}</p>
                  <p className="text-sm font-medium text-muted-foreground">{lead.painPoint || 'Pain point not specified'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {lead.importedToProspects ? (
                    <Badge variant="secondary">Added to Fresh Prospects</Badge>
                  ) : (
                    <Button
                      disabled={isPending}
                      onClick={() => handleImport(lead.id)}
                      className="rounded-xl herbal-gradient"
                    >
                      Add to Fresh Prospects
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
