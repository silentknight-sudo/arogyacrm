'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useApp, type Theme } from '@/context/app-context';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Monitor, Moon, RefreshCw, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { saveLeadSyncConfig, syncLeadsFromGoogleSheet } from './actions';

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

type LeadSyncConfigDoc = {
  id: string;
  teamspaceId: string;
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

  const [sheetUrl, setSheetUrl] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState('15');

  const canSyncSheets = currentUser?.role === 'admin' || currentUser?.role === 'sales_team_lead';

  const syncConfigRef = useMemoFirebase(
    () => (canSyncSheets && currentTeamspace?.id ? doc(firestore, 'leadSyncConfigs', currentTeamspace.id) : null),
    [firestore, canSyncSheets, currentTeamspace?.id]
  );
  const { data: syncConfig } = useDoc<LeadSyncConfigDoc>(syncConfigRef);

  useEffect(() => {
    if (!syncConfig) return;
    setSheetUrl(syncConfig.sheetUrl || '');
    setAssignedToId(syncConfig.assignedToId || '');
    setAutoSyncEnabled(Boolean(syncConfig.enabled));
    setIntervalMinutes(String(syncConfig.intervalMinutes || 15));
  }, [syncConfig]);

  const usersQuery = useMemoFirebase(() => {
    if (!canSyncSheets || !currentUser || !currentTeamspace?.id) return null;
    if (currentUser.role === 'admin') {
      return query(collection(firestore, 'users'), where('role', '==', 'sales_team_lead'));
    }
    return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
  }, [firestore, currentTeamspace?.id, currentUser, canSyncSheets]);
  const { data: users } = useCollection<UserProfile>(usersQuery);

  const assignableUsers = useMemo(() => {
    if (!users || !currentUser || !currentTeamspace?.id) return [];
    if (currentUser.role === 'admin') {
      return users.filter((user) => user.role === 'sales_team_lead');
    }
    return users.filter(
      (user) =>
        user.role === 'sales_executive' &&
        (user.createdBy === currentUser.id || (user.teamspaceIds || []).includes(currentTeamspace.id))
    );
  }, [users, currentUser, currentTeamspace?.id]);

  const handleSync = () => {
    if (!currentTeamspace?.id || !currentUser?.id || !sheetUrl || !assignedToId) {
      toast({ title: 'Missing fields', description: 'Add a Google Sheet link and assignee first.', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      const result = await syncLeadsFromGoogleSheet({
        teamspaceId: currentTeamspace.id,
        sheetUrl,
        assignedToId,
        createdBy: currentUser.id,
      });
      if (!result.success) {
        toast({ title: 'Sync failed', description: result.error || 'Could not import leads.', variant: 'destructive' });
        return;
      }
      toast({
        title: 'Lead sync complete',
        description: `${result.count} new leads imported, ${result.skipped} skipped.`,
      });
    });
  };

  const handleSaveAutoSync = () => {
    if (!currentTeamspace?.id || !currentUser?.id || !sheetUrl || !assignedToId) {
      toast({ title: 'Missing fields', description: 'Add a Google Sheet link and assignee first.', variant: 'destructive' });
      return;
    }
    startSaving(async () => {
      const result = await saveLeadSyncConfig({
        teamspaceId: currentTeamspace.id,
        sheetUrl,
        assignedToId,
        createdBy: currentUser.id,
        enabled: autoSyncEnabled,
        intervalMinutes: Number(intervalMinutes || 15),
      });
      if (!result.success) {
        toast({ title: 'Could not save sync config', description: result.error || 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Auto sync saved', description: 'Lead sync settings were updated successfully.' });
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
              <CardTitle className="text-2xl font-black">Lead Sync Automation</CardTitle>
              <CardDescription>Sync Meta ad leads from a Google Sheet link and automatically route them into the CRM.</CardDescription>
            </div>
            <Badge variant={autoSyncEnabled ? 'default' : 'secondary'} className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
              {autoSyncEnabled ? 'Auto Sync On' : 'Manual Mode'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Last Sync</p>
                <p className="mt-2 text-lg font-black text-primary">{formatSyncTime(syncConfig?.lastSyncedAt)}</p>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Added</p>
                <p className="mt-2 text-lg font-black text-primary">{syncConfig?.lastSyncCount ?? 0}</p>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Skipped</p>
                <p className="mt-2 text-lg font-black text-primary">{syncConfig?.lastSyncSkipped ?? 0}</p>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Issue</p>
                <p className="mt-2 text-sm font-bold text-primary">{syncConfig?.lastSyncError || 'None'}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {currentUser?.role === 'admin' ? 'Assign Leads To Team Lead' : 'Assign Leads To Telecaller'}
                </Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Choose assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName} {user.employeeId ? `(${user.employeeId})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Auto Sync Interval</Label>
                <Select value={intervalMinutes} onValueChange={setIntervalMinutes}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder="Choose interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every 1 hour</SelectItem>
                    <SelectItem value="360">Every 6 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-primary/10 bg-muted/40 px-5 py-4">
                <div>
                  <p className="text-sm font-black text-primary">Enable Auto Sync</p>
                  <p className="text-xs font-medium text-muted-foreground">Pull new leads from the sheet automatically.</p>
                </div>
                <Switch checked={autoSyncEnabled} onCheckedChange={setAutoSyncEnabled} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveAutoSync} disabled={isSaving || isUserLoading} className="rounded-2xl px-6 font-black">
                {isSaving ? 'Saving...' : 'Save Auto Sync'}
              </Button>
              <Button onClick={handleSync} disabled={isPending || isUserLoading} variant="outline" className="rounded-2xl px-6 font-black">
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                {isPending ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
