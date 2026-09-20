'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useApp, type Theme } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Monitor, Moon, RefreshCw, Sun, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { deleteLeadSyncSheet, saveLeadSyncConfig, syncLeadsFromGoogleSheet } from './actions';
import type { Campaign } from '@/types';

const themeTiles = [
  { name: 'Default Arogya Bio Theme', value: 'light', gradient: 'from-[#1f3b2f] via-[#45624f] to-[#d3b66b]' },
  { name: 'Sunset', value: 'light', gradient: 'from-[#f8b195] via-[#f67280] to-[#6c5b7b]' },
  { name: 'Midnight', value: 'dark', gradient: 'from-[#101827] via-[#1f2a44] to-[#536976]' },
  { name: 'Rose', value: 'light', gradient: 'from-[#ff9a9e] via-[#fad0c4] to-[#fbc2eb]' },
  { name: 'Forest', value: 'light', gradient: 'from-[#134e5e] via-[#71b280] to-[#a8e063]' },
  { name: 'Jshine', value: 'system', gradient: 'from-[#12c2e9] via-[#c471ed] to-[#f64f59]' },
  { name: 'Ocean', value: 'light', gradient: 'from-[#2193b0] via-[#6dd5ed] to-[#b2fefa]' },
  { name: 'Midnight City', value: 'dark', gradient: 'from-[#232526] via-[#414345] to-[#0f2027]' },
] as const;

type LeadSyncSheetDoc = {
  id: string;
  teamspaceId: string;
  campaignId: string;
  sheetUrl: string;
  assignedToId: string;
  enabled: boolean;
  intervalMinutes: number;
  lastSyncedAt?: any;
  lastSyncCount?: number;
  lastSyncSkipped?: number;
  lastSyncError?: string | null;
};

function formatSyncTime(value: any) {
  if (!value) return 'Never';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString();
}

export default function SettingsPage() {
  const { currentUser, currentTeamspace, theme, setTheme, isUserLoading } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState('1');

  const canSyncSheets = currentUser?.role === 'admin';

  const campaignsQuery = useMemoFirebase(
    () => (canSyncSheets && currentTeamspace?.id ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'campaigns')) : null),
    [firestore, canSyncSheets, currentTeamspace?.id]
  );
  const { data: products } = useCollection<Campaign>(campaignsQuery);

  const sheetsQuery = useMemoFirebase(
    () => (canSyncSheets && currentTeamspace?.id ? query(collection(firestore, 'leadSyncConfigs', currentTeamspace.id, 'sheets')) : null),
    [firestore, canSyncSheets, currentTeamspace?.id]
  );
  const { data: sheets } = useCollection<LeadSyncSheetDoc>(sheetsQuery);

  useEffect(() => {
    if (!selectedProductId && (products || []).length > 0) {
      setSelectedProductId(products![0].id);
    }
  }, [products, selectedProductId]);

  const sheetsForProduct = useMemo(
    () => (sheets || []).filter((sheet) => sheet.campaignId === selectedProductId),
    [sheets, selectedProductId]
  );

  const productName = (campaignId: string) =>
    (products || []).find((product) => product.id === campaignId)?.name ||
    (products || []).find((product) => product.id === campaignId)?.productName ||
    'Unknown Product';

  const handleAddSheet = () => {
    if (!currentTeamspace?.id || !currentUser?.id || !sheetUrl || !selectedProductId) {
      toast({ title: 'Missing fields', description: 'Choose a product and add a Google Sheet link first.', variant: 'destructive' });
      return;
    }
    startSaving(async () => {
      const result = await saveLeadSyncConfig({
        teamspaceId: currentTeamspace.id,
        campaignId: selectedProductId,
        sheetUrl,
        assignedToId: currentUser.id,
        createdBy: currentUser.id,
        enabled: autoSyncEnabled,
        intervalMinutes: Number(intervalMinutes || 1),
      });
      if (!result.success) {
        toast({ title: 'Could not connect sheet', description: result.error || 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Google Sheet connected', description: 'This sheet is now linked to the selected product.' });
      setSheetUrl('');
    });
  };

  const handleToggleSheet = (sheet: LeadSyncSheetDoc, enabled: boolean) => {
    if (!currentTeamspace?.id || !currentUser?.id) return;
    startSaving(async () => {
      await saveLeadSyncConfig({
        sheetId: sheet.id,
        teamspaceId: currentTeamspace.id,
        campaignId: sheet.campaignId,
        sheetUrl: sheet.sheetUrl,
        assignedToId: sheet.assignedToId || currentUser.id,
        createdBy: currentUser.id,
        enabled,
        intervalMinutes: sheet.intervalMinutes || 1,
      });
    });
  };

  const handleIntervalChange = (sheet: LeadSyncSheetDoc, minutes: string) => {
    if (!currentTeamspace?.id || !currentUser?.id) return;
    startSaving(async () => {
      await saveLeadSyncConfig({
        sheetId: sheet.id,
        teamspaceId: currentTeamspace.id,
        campaignId: sheet.campaignId,
        sheetUrl: sheet.sheetUrl,
        assignedToId: sheet.assignedToId || currentUser.id,
        createdBy: currentUser.id,
        enabled: sheet.enabled,
        intervalMinutes: Number(minutes),
      });
    });
  };

  const handleSyncNow = (sheet: LeadSyncSheetDoc) => {
    if (!currentTeamspace?.id || !currentUser?.id) return;
    setSyncingId(sheet.id);
    startTransition(async () => {
      const result = await syncLeadsFromGoogleSheet({
        teamspaceId: currentTeamspace.id,
        sheetUrl: sheet.sheetUrl,
        assignedToId: sheet.assignedToId || currentUser.id,
        createdBy: currentUser.id,
        campaignId: sheet.campaignId,
        sheetId: sheet.id,
      });
      setSyncingId(null);
      if (!result.success) {
        toast({ title: 'Sync failed', description: result.error || 'Could not import leads.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Lead sync complete', description: `${result.count} new leads imported, ${result.skipped} skipped.` });
    });
  };

  const handleDeleteSheet = (sheet: LeadSyncSheetDoc) => {
    if (!currentTeamspace?.id) return;
    setDeletingId(sheet.id);
    startSaving(async () => {
      await deleteLeadSyncSheet({ teamspaceId: currentTeamspace.id, sheetId: sheet.id });
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Theme Settings</h1>
        <p className="text-muted-foreground font-medium">Choose the dashboard theme color and automate lead sync from Google Sheets.</p>
      </div>

      <Card className="rounded-[2rem] border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-black">Choose Theme Color</CardTitle>
          <CardDescription>Reference CRM themes mapped to your available light, dark, and system appearance modes.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)} className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2 xl:grid-cols-4">
            {themeTiles.map((tile) => {
              const Icon = tile.value === 'dark' ? Moon : tile.value === 'system' ? Monitor : Sun;
              const selected = theme === tile.value;
              return (
                <Label key={tile.name} className="cursor-pointer">
                  <RadioGroupItem value={tile.value} className="sr-only" />
                  <div className={`relative flex h-40 items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${tile.gradient} p-5 text-white shadow-lg transition-all hover:scale-[1.02] ${selected ? 'ring-4 ring-primary ring-offset-2' : ''}`}>
                    <div className="absolute inset-0 bg-black/10" />
                    {selected && (
                      <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="relative text-center">
                      <Icon className="mx-auto mb-3 h-7 w-7" />
                      <p className="text-xl font-black">{tile.name}</p>
                    </div>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {canSyncSheets && (
        <Card className="rounded-[2rem] border-primary/10">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl font-black">Product Lead Sync Automation</CardTitle>
              <CardDescription>Connect one or more Google Sheets to each product. Leads sync into the Admin New Leads pool before assignment.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr_auto] md:items-end">
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products || []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Google Sheet Link</Label>
                <Input
                  value={sheetUrl}
                  onChange={(event) => setSheetUrl(event.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={isUserLoading}
                  className="h-12 rounded-2xl"
                />
              </div>
              <Button onClick={handleAddSheet} disabled={isSaving || isUserLoading || !selectedProductId} className="h-12 rounded-2xl px-6 font-black">
                {isSaving ? 'Adding...' : 'Add Sheet'}
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Default Sync Interval For New Sheets</Label>
                <Select value={intervalMinutes} onValueChange={setIntervalMinutes}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Choose interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every 1 minute</SelectItem>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every 1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-primary/10 bg-muted/40 px-5 py-4">
                <div>
                  <p className="text-sm font-black text-primary">Enable Auto Sync By Default</p>
                  <p className="text-xs font-medium text-muted-foreground">New sheets start with auto sync on.</p>
                </div>
                <Switch checked={autoSyncEnabled} onCheckedChange={setAutoSyncEnabled} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Connected Sheets{selectedProductId ? ` · ${productName(selectedProductId)}` : ''}
                </p>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                  {sheetsForProduct.length} sheet{sheetsForProduct.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {sheetsForProduct.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-primary/20 p-8 text-center text-sm font-medium text-muted-foreground">
                  No Google Sheets connected to this product yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sheetsForProduct.map((sheet) => (
                    <div key={sheet.id} className="rounded-3xl border border-primary/10 bg-primary/5 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="max-w-xl truncate text-sm font-bold text-primary">{sheet.sheetUrl}</p>
                        <Badge variant={sheet.enabled ? 'default' : 'secondary'} className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                          {sheet.enabled ? 'Auto Sync On' : 'Manual Mode'}
                        </Badge>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border border-primary/10 bg-background p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Last Sync</p>
                          <p className="mt-1 text-sm font-black text-primary">{formatSyncTime(sheet.lastSyncedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/10 bg-background p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Added</p>
                          <p className="mt-1 text-sm font-black text-primary">{sheet.lastSyncCount ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/10 bg-background p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Skipped</p>
                          <p className="mt-1 text-sm font-black text-primary">{sheet.lastSyncSkipped ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/10 bg-background p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Issue</p>
                          <p className="mt-1 truncate text-xs font-bold text-primary">{sheet.lastSyncError || 'None'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Select value={String(sheet.intervalMinutes || 1)} onValueChange={(value) => handleIntervalChange(sheet, value)}>
                          <SelectTrigger className="h-10 w-[190px] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Every 1 minute</SelectItem>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every 1 hour</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-background px-3 py-2">
                          <span className="text-xs font-bold text-muted-foreground">Auto Sync</span>
                          <Switch checked={sheet.enabled} onCheckedChange={(checked) => handleToggleSheet(sheet, checked)} />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncNow(sheet)}
                          disabled={isPending && syncingId === sheet.id}
                          className="rounded-xl font-black"
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${isPending && syncingId === sheet.id ? 'animate-spin' : ''}`} />
                          {isPending && syncingId === sheet.id ? 'Syncing...' : 'Sync Now'}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSheet(sheet)}
                          disabled={isSaving && deletingId === sheet.id}
                          className="rounded-xl font-black"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
