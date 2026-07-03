'use client';

import { useState } from 'react';
import { collection, query } from 'firebase/firestore';
import { Download, UploadCloud } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Campaign } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function AddOnPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [campaignId, setCampaignId] = useState('');

  const campaignsQuery = useMemoFirebase(() =>
    currentTeamspace?.id ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns')) : null
  , [firestore, currentTeamspace?.id]);

  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);

  const downloadTemplate = () => {
    const csv = 'name,mobile,email,pin_code,address,query\nSample Customer,9999999999,sample@example.com,110001,Delhi,Product query\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lead-upload-format.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Add ON</h1>
        <p className="text-muted-foreground font-medium">Upload campaign lead sheets using the CRM format.</p>
      </div>

      <Card className="rounded-[2rem] border-primary/10 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black">Bulk Lead Upload</CardTitle>
              <CardDescription>Select the campaign first, then upload the sheet.</CardDescription>
            </div>
            <Button variant="outline" className="rounded-2xl" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Format
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={campaignId} onValueChange={setCampaignId} disabled={isLoading}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              {(campaigns || []).map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-background shadow-inner">
              <UploadCloud className="h-12 w-12 text-primary" />
            </div>
            <Badge className="mb-4 rounded-full px-4 py-1">Upload Campaign Sheet</Badge>
            <h2 className="text-3xl font-black text-primary">Drag & Drop or Browse to Upload File</h2>
            <p className="mt-3 text-sm font-medium text-muted-foreground">Supported format: CSV/XLSX. Required columns: name, mobile, campaign, address, query.</p>
            <input type="file" accept=".csv,.xlsx,.xls" className="mx-auto mt-8 block max-w-sm rounded-2xl border bg-background p-3 text-sm" disabled={!campaignId} />
            {!campaignId && <p className="mt-3 text-xs font-bold text-orange-600">Choose a campaign to enable upload.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
