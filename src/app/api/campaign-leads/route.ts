import { NextResponse } from 'next/server';
import { adminDb, serverTimestamp } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, campaignId, teamspaceId, fullName, phone, email, city, age, painPoint, customFields } = body || {};

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    let resolvedCampaignId = campaignId || '';
    let resolvedTeamspaceId = teamspaceId || '';

    if (!resolvedCampaignId || !resolvedTeamspaceId) {
      if (!slug) {
        return NextResponse.json({ success: false, error: 'Campaign identifier missing.' }, { status: 400 });
      }

      const campaignSnap = await adminDb.collectionGroup('campaigns').where('slug', '==', slug).limit(1).get();
      if (campaignSnap.empty) {
        return NextResponse.json({ success: false, error: 'Campaign not found.' }, { status: 404 });
      }

      const campaignDoc = campaignSnap.docs[0];
      const campaign = campaignDoc.data() as any;
      resolvedCampaignId = campaignDoc.id;
      resolvedTeamspaceId = campaign.teamspaceId;
    }

    if (!resolvedCampaignId || !resolvedTeamspaceId) {
      return NextResponse.json({ success: false, error: 'Campaign is not configured correctly.' }, { status: 400 });
    }

    const campaignLeadRef = adminDb
      .collection('teamspaces')
      .doc(resolvedTeamspaceId)
      .collection('campaigns')
      .doc(resolvedCampaignId)
      .collection('landingLeads')
      .doc();

    await campaignLeadRef.set({
      id: campaignLeadRef.id,
      campaignId: resolvedCampaignId,
      teamspaceId: resolvedTeamspaceId,
      fullName,
      phone,
      email: email || '',
      city: city || '',
      age: age || '',
      painPoint: painPoint || '',
      customFields: customFields || {},
      source: 'landing_page',
      importedToProspects: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to capture lead.' }, { status: 500 });
  }
}
