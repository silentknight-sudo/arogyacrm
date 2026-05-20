import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/firebase/admin';
import { sendMetaCapiEvent } from '@/lib/meta-capi';

/**
 * META DIRECT INGESTION ENDPOINT
 * High-velocity real-time capture for Meta Lead Ads.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!isValidMetaSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
      return NextResponse.json({ success: false, error: 'Invalid Meta signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen' && change.value?.leadgen_id) {
            await processMetaLead(change.value.leadgen_id, change.value);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('META_WEBHOOK_FAILURE:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

type MetaLeadgenChangeValue = {
  ad_id?: string;
  adgroup_id?: string;
  created_time?: number;
  form_id?: string;
  leadgen_id?: string;
  page_id?: string;
};

function isValidMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) return true;
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const provided = signatureHeader.slice(7);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function getConfiguredTeamspaceId(): string | null {
  return process.env.META_TEAMSPACE_ID || process.env.NEXT_PUBLIC_DEFAULT_TEAMSPACE_ID || null;
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  if (!normalized) return { firstName: '', lastName: '' };

  const parts = normalized.split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

async function processMetaLead(metaLeadId: string, webhookValue?: MetaLeadgenChangeValue) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch(`https://graph.facebook.com/v25.0/${metaLeadId}?access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) {
    console.error('META_LEAD_FETCH_ERROR:', data.error);
    return;
  }

  const getVal = (name: string) => data.field_data?.find((f: any) => f.name === name)?.values?.[0] || '';
  const rawName = getVal('full_name') || [getVal('first_name'), getVal('last_name')].filter(Boolean).join(' ').trim();
  const { firstName, lastName } = splitFullName(rawName || 'Meta Prospect');
  const normalizedPhone = String(getVal('phone_number') || '').replace(/^p:/, '').trim();

  const existingLeadSnap = await adminDb
    .collectionGroup('leads')
    .where('metaLeadId', '==', metaLeadId)
    .limit(1)
    .get();

  if (!existingLeadSnap.empty) {
    console.log(`META_LEAD_DUPLICATE_SKIPPED: ${metaLeadId}`);
    return;
  }

  let tsId = getConfiguredTeamspaceId();
  if (!tsId) {
    const teamSnap = await adminDb.collection('teamspaces').limit(1).get();
    if (teamSnap.empty) return;
    tsId = teamSnap.docs[0].id;
  }

  const teamspaceRef = adminDb.collection('teamspaces').doc(tsId);
  const teamspaceSnap = await teamspaceRef.get();
  if (!teamspaceSnap.exists) {
    console.error(`META_LEAD_TEAMSPACE_NOT_FOUND: ${tsId}`);
    return;
  }

  const teamspace = teamspaceSnap.data() as { ownerId?: string };
  const adminOwnerId = teamspace.ownerId || null;

  const leadRef = adminDb.collection('teamspaces').doc(tsId).collection('leads').doc();
  const newLeadData = {
    id: leadRef.id,
    fullName: rawName || 'Meta Prospect',
    firstName,
    lastName,
    email: getVal('email') || '',
    phone: normalizedPhone,
    source: 'Meta Ads',
    status: 'new',
    assignedToIds: adminOwnerId ? [adminOwnerId] : [],
    reassigned: false,
    teamspaceId: tsId,
    metaLeadId: metaLeadId,
    metaPageId: webhookValue?.page_id || data.page_id || '',
    metaFormId: webhookValue?.form_id || data.form_id || '',
    metaCampaign: {
      adId: webhookValue?.ad_id || '',
      adgroupId: webhookValue?.adgroup_id || '',
      createdTime: webhookValue?.created_time || data.created_time || null,
    },
    attribution: {
      source: 'meta',
      channel: 'paid_social',
      platform: 'facebook_instagram',
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await leadRef.set(newLeadData);

  await sendMetaCapiEvent({
    eventName: 'Lead',
    leadId: metaLeadId,
    email: getVal('email') || '',
    phone: normalizedPhone,
    firstName,
    lastName,
    customData: {
      source: 'meta_ads_webhook',
      teamspace_id: tsId,
      meta_form_id: webhookValue?.form_id || data.form_id || '',
    },
  });
}