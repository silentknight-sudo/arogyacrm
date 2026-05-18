import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/firebase/admin';

/**
 * STRATEGIC META ADS DIRECT INGESTION
 * Real-time endpoint for Meta lead generation webhooks.
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
    const body = await request.json();
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            await processMetaLead(change.value.leadgen_id);
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

async function processMetaLead(leadId: string) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return;

  const res = await fetch(`https://graph.facebook.com/v21.0/${leadId}?access_token=${token}`);
  const data = await res.json();
  if (data.error) return;

  const getVal = (name: string) => data.field_data?.find((f: any) => f.name === name)?.values?.[0] || '';

  // Dynamic Routing: Find first admin/TL for initial allocation
  const teamSnap = await adminDb.collection('teamspaces').limit(1).get();
  if (teamSnap.empty) return;
  const tsId = teamSnap.docs[0].id;

  const leadRef = adminDb.collection('teamspaces').doc(tsId).collection('leads').doc();
  await leadRef.set({
    id: leadRef.id,
    fullName: getVal('full_name') || 'Meta Prospect',
    email: getVal('email') || '',
    phone: (getVal('phone_number') || '').replace(/^p:/, '').trim(),
    source: 'Meta Ads',
    status: 'new',
    assignedToIds: [], // Ready for strategic allocation
    reassigned: false,
    metaLeadId: leadId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}