import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/firebase/admin';
import { syncGoogleSheetLeads } from '@/lib/google-sheet-lead-sync';

export const dynamic = 'force-dynamic';

function shouldRun(config: Record<string, any>) {
  if (!config.enabled) return false;
  const intervalMinutes = Number(config.intervalMinutes || 15);
  if (!config.lastSyncedAt) return true;

  const lastSyncDate =
    typeof config.lastSyncedAt?.toDate === 'function'
      ? config.lastSyncedAt.toDate()
      : new Date(config.lastSyncedAt);

  return Date.now() - lastSyncDate.getTime() >= intervalMinutes * 60 * 1000;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const snapshot = await adminDb.collection('leadSyncConfigs').where('enabled', '==', true).get();
  const results = [];

  for (const doc of snapshot.docs) {
    const config = doc.data();
    if (!shouldRun(config)) continue;

    const result = await syncGoogleSheetLeads({
      teamspaceId: config.teamspaceId,
      sheetUrl: config.sheetUrl,
      assignedToId: config.assignedToId,
      createdBy: config.createdBy,
      enabled: config.enabled,
      intervalMinutes: config.intervalMinutes,
    });

    await doc.ref.set(
      {
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastSyncCount: result.count,
        lastSyncSkipped: result.skipped,
        lastSyncError: result.success ? null : result.error || 'Sync failed',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    results.push({ id: doc.id, ...result });
  }

  return NextResponse.json({ success: true, results });
}
