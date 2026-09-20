'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { syncGoogleSheetLeads } from '@/lib/google-sheet-lead-sync';

const LeadSyncSheetSchema = z.object({
  sheetId: z.string().optional(),
  teamspaceId: z.string().min(1),
  campaignId: z.string().min(1, 'Select a product first.'),
  sheetUrl: z.string().url(),
  assignedToId: z.string().min(1),
  createdBy: z.string().min(1),
  enabled: z.boolean(),
  intervalMinutes: z.number().min(1).max(1440),
});

export async function saveLeadSyncConfig(values: z.infer<typeof LeadSyncSheetSchema>) {
  try {
    const input = LeadSyncSheetSchema.parse(values);

    const sheetsRef = adminDb.collection('leadSyncConfigs').doc(input.teamspaceId).collection('sheets');
    const sheetRef = input.sheetId ? sheetsRef.doc(input.sheetId) : sheetsRef.doc();
    const existing = input.sheetId ? await sheetRef.get() : null;

    await sheetRef.set(
      {
        id: sheetRef.id,
        teamspaceId: input.teamspaceId,
        campaignId: input.campaignId,
        sheetUrl: input.sheetUrl,
        assignedToId: input.assignedToId,
        createdBy: input.createdBy,
        enabled: input.enabled,
        intervalMinutes: input.intervalMinutes,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: existing?.exists ? existing.data()?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    revalidatePath('/settings');
    return { success: true, sheetId: sheetRef.id };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const DeleteLeadSyncSheetSchema = z.object({
  teamspaceId: z.string().min(1),
  sheetId: z.string().min(1),
});

export async function deleteLeadSyncSheet(values: z.infer<typeof DeleteLeadSyncSheetSchema>) {
  try {
    const input = DeleteLeadSyncSheetSchema.parse(values);
    await adminDb
      .collection('leadSyncConfigs')
      .doc(input.teamspaceId)
      .collection('sheets')
      .doc(input.sheetId)
      .delete();

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
  campaignId: z.string().optional(),
  sheetId: z.string().optional(),
});

export async function syncLeadsFromGoogleSheet(values: z.infer<typeof SyncNowSchema>) {
  try {
    const input = SyncNowSchema.parse(values);
    const result = await syncGoogleSheetLeads(input);

    if (input.sheetId) {
      await adminDb
        .collection('leadSyncConfigs')
        .doc(input.teamspaceId)
        .collection('sheets')
        .doc(input.sheetId)
        .set(
          {
            lastSyncedAt: FieldValue.serverTimestamp(),
            lastSyncCount: result.count,
            lastSyncSkipped: result.skipped,
            lastSyncError: result.success ? null : result.error || 'Sync failed',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      revalidatePath('/settings');
    }

    return result;
  } catch (error: any) {
    return { success: false, count: 0, skipped: 0, error: handleAdminSDKError(error) };
  }
}
