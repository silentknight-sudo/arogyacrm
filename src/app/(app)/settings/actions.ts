'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { syncGoogleSheetLeads } from '@/lib/google-sheet-lead-sync';

const LeadSyncConfigSchema = z.object({
  teamspaceId: z.string().min(1),
  sheetUrl: z.string().url(),
  assignedToId: z.string().min(1),
  createdBy: z.string().min(1),
  enabled: z.boolean(),
  intervalMinutes: z.number().min(5).max(1440),
});

export async function saveLeadSyncConfig(values: z.infer<typeof LeadSyncConfigSchema>) {
  try {
    const input = LeadSyncConfigSchema.parse(values);

    const configRef = adminDb.collection('leadSyncConfigs').doc(input.teamspaceId);
    const existing = await configRef.get();

    await configRef.set(
      {
        id: input.teamspaceId,
        teamspaceId: input.teamspaceId,
        sheetUrl: input.sheetUrl,
        assignedToId: input.assignedToId,
        createdBy: input.createdBy,
        enabled: input.enabled,
        intervalMinutes: input.intervalMinutes,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: existing.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const SyncNowSchema = z.object({
  teamspaceId: z.string().min(1),
  sheetUrl: z.string().url(),
  assignedToId: z.string().min(1),
  createdBy: z.string().min(1),
});

export async function syncLeadsFromGoogleSheet(values: z.infer<typeof SyncNowSchema>) {
  try {
    const input = SyncNowSchema.parse(values);
    return await syncGoogleSheetLeads(input);
  } catch (error: any) {
    return { success: false, count: 0, skipped: 0, error: handleAdminSDKError(error) };
  }
}
