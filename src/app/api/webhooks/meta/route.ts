import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/firebase/admin';

/**
 * META DIRECT INGESTION ENDPOINT
 * Rebuilt for high-velocity real-time capture and automatic deal syncing.
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

async function processMetaLead(metaLeadId: string) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch(`https://graph.facebook.com/v21.0/${metaLeadId}?access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) return;

  const getVal = (name: string) => data.field_data?.find((f: any) => f.name === name)?.values?.[0] || '';

  // Strategic Routing: Find first available teamspace
  const teamSnap = await adminDb.collection('teamspaces').limit(1).get();
  if (teamSnap.empty) return;
  const tsId = teamSnap.docs[0].id;

  const leadRef = adminDb.collection('teamspaces').doc(tsId).collection('leads').doc();
  const leadId = leadRef.id;

  const newLeadData = {
    id: leadId,
    fullName: getVal('full_name') || 'Meta Prospect',
    email: getVal('email') || '',
    phone: (getVal('phone_number') || '').replace(/^p:/, '').trim(),
    source: 'Meta Ads',
    status: 'new',
    assignedToIds: [], 
    reassigned: false,
    metaLeadId: metaLeadId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await leadRef.set(newLeadData);
  
  // High-intensity alerting for admins
  await adminDb.collection('notifications').add({
    title: 'Meta Arrival',
    description: `New prospect "${newLeadData.fullName}" captured from ads.`,
    timestamp: new Date().toISOString(),
    type: 'system',
    link: '/leads'
  });
}