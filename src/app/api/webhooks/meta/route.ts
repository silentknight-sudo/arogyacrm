
import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/firebase/admin';
import { syncDealForLead } from '@/app/(app)/leads/actions';

/**
 * STRATEGIC META INLET
 * This endpoint allows Meta Ads to push leads directly into the CRM in real-time.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verification handshake for Meta Webhook setup
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
            const leadId = change.value.leadgen_id;
            const pageId = change.value.page_id;
            const formId = change.value.form_id;

            await ingestMetaLead(leadId, pageId, formId);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('META_WEBHOOK_CRITICAL_FAILURE:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function ingestMetaLead(leadId: string, pageId: string, formId: string) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('META_ACCESS_TOKEN_MISSING: Cannot fetch lead details.');
    return;
  }

  // Fetch full lead data from Meta Graph API
  const response = await fetch(`https://graph.facebook.com/v21.0/${leadId}?access_token=${accessToken}`);
  const metaLead = await response.json();

  if (metaLead.error) {
    console.error('META_GRAPH_API_ERROR:', metaLead.error);
    return;
  }

  const fieldData = metaLead.field_data || [];
  const getVal = (name: string) => fieldData.find((f: any) => f.name === name)?.values?.[0] || '';

  const fullName = getVal('full_name') || `${getVal('first_name')} ${getVal('last_name')}`.trim();
  const email = getVal('email');
  const phone = (getVal('phone_number') || '').toString().replace(/^p:/, '').trim();

  // ROUTING LOGIC: Find the primary teamspace and default recipient (First Admin)
  const teamspaceSnap = await adminDb.collection('teamspaces').limit(1).get();
  if (teamspaceSnap.empty) return;
  const teamspaceId = teamspaceSnap.docs[0].id;

  const adminSnap = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
  if (adminSnap.empty) return;
  const recipientId = adminSnap.docs[0].id;

  const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
  const id = leadRef.id;

  const newLead = {
    id,
    fullName: fullName || 'New Meta Prospect',
    email: email || '',
    phone: phone || '',
    source: 'Meta Ads',
    status: 'new',
    assignedToIds: [recipientId],
    teamspaceId,
    reassigned: false,
    attributionFields: JSON.stringify({
      meta_lead_id: leadId,
      meta_form_id: formId,
      meta_page_id: pageId,
      platform: 'fb'
    }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await leadRef.set(newLead);

  // Trigger high-intensity alert for the recipient
  await adminDb.collection('users').doc(recipientId).collection('notifications').add({
    title: 'you got 1 new leads',
    description: `Real-time capture: "${fullName}" from Meta Ads.`,
    type: 'lead_assigned',
    timestamp: new Date().toISOString(),
    read: false,
    link: '/leads'
  });

  // Automated Revenue Sync
  await syncDealForLead(id, teamspaceId);
}
