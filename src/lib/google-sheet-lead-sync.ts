import { revalidatePath } from 'next/cache';
import { adminDb, FieldValue } from '@/firebase/admin';

export type LeadSyncConfig = {
  teamspaceId: string;
  sheetUrl: string;
  assignedToId: string;
  createdBy: string;
  enabled?: boolean;
  intervalMinutes?: number;
};

export type GoogleSheetSyncResult = {
  success: boolean;
  count: number;
  skipped: number;
  error?: string;
};

function toCsvUrl(sheetUrl: string) {
  const url = new URL(sheetUrl);
  const gid = url.searchParams.get('gid') || '0';
  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match?.[1]) {
    throw new Error('Invalid Google Sheet link.');
  }
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function getVal(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '').trim();
}

function makeSyncKey(phone: string, email: string, name: string) {
  return [phone, email.toLowerCase(), name.toLowerCase()].join('|');
}

async function resolveAdminRecipient(config: LeadSyncConfig) {
  const creator = await adminDb.collection('users').doc(config.createdBy).get();
  if (creator.exists && creator.data()?.role === 'admin') return creator.id;

  const teamspace = await adminDb.collection('teamspaces').doc(config.teamspaceId).get();
  const ownerId = teamspace.data()?.ownerId;
  if (ownerId) {
    const owner = await adminDb.collection('users').doc(ownerId).get();
    if (owner.exists && owner.data()?.role === 'admin') return owner.id;
  }

  const admins = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (admins.empty) throw new Error('No admin account is available to receive synced leads.');
  return admins.docs[0].id;
}

export async function syncGoogleSheetLeads(config: LeadSyncConfig): Promise<GoogleSheetSyncResult> {
  try {
    const adminRecipientId = await resolveAdminRecipient(config);
    const response = await fetch(toCsvUrl(config.sheetUrl), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to fetch Google Sheet data.');
    }

    const csv = await response.text();
    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return { success: true, count: 0, skipped: 0 };
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    let count = 0;
    let skipped = 0;

    for (const row of rows.slice(1)) {
      const record = headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = row[index] ?? '';
        return acc;
      }, {});

      const fullName = getVal(record, ['name', 'full name', 'full_name', 'customer name']);
      const email = getVal(record, ['email', 'email address', 'email_address']);
      const phone = normalizePhone(getVal(record, ['phone', 'phone number', 'mobile', 'mobile number']));

      if (!fullName || !phone) {
        skipped += 1;
        continue;
      }

      const sourceSyncKey = makeSyncKey(phone, email, fullName);
      const leadsRef = adminDb.collection('teamspaces').doc(config.teamspaceId).collection('leads');
      const existing = await leadsRef.where('sourceSyncKey', '==', sourceSyncKey).limit(1).get();

      if (!existing.empty) {
        skipped += 1;
        continue;
      }

      const createdValue = getVal(record, ['created_time', 'created at', 'created_at']);

      await leadsRef.add({
        fullName,
        email: email || undefined,
        phone,
        status: 'new',
        source: getVal(record, ['source', 'platform']) || 'google_sheet_sync',
        assignedToIds: [adminRecipientId],
        teamspaceId: config.teamspaceId,
        reassigned: false,
        notes: getVal(record, ['notes', 'query']) || undefined,
        sourceSyncKey,
        sourceSyncUrl: config.sheetUrl,
        createdAt: createdValue || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      count += 1;
    }

    if (count > 0) {
      await adminDb.collection('users').doc(adminRecipientId).collection('notifications').add({
        title: 'New Synced Leads',
        description: `${count} new leads were imported into your New Leads pool from Google Sheets.`,
        type: 'lead_sync',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads?status=fresh_uploads',
      });
    }

    revalidatePath('/leads');
    revalidatePath('/dashboard');
    revalidatePath('/settings');

    return { success: true, count, skipped };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      skipped: 0,
      error: error?.message || 'Failed to sync leads from Google Sheets.',
    };
  }
}
