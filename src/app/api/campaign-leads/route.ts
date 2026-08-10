import { NextResponse } from 'next/server';
import { adminDb, serverTimestamp } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, fullName, phone, email, city, age, painPoint, customFields, website } = body || {};

    if (website) return NextResponse.json({ success: true });

    if (!fullName || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Campaign identifier missing.' }, { status: 400 });
    }

    let campaignDoc;
    const publicPage = await adminDb.collection('landingPages').doc(slug).get();
    if (publicPage.exists) {
      const locator = publicPage.data();
      campaignDoc = await adminDb.collection('teamspaces').doc(locator?.teamspaceId).collection('campaigns').doc(locator?.campaignId).get();
    } else {
      const campaignSnap = await adminDb.collectionGroup('campaigns').where('slug', '==', slug).limit(1).get();
      if (!campaignSnap.empty) campaignDoc = campaignSnap.docs[0];
    }
    if (!campaignDoc?.exists) {
      return NextResponse.json({ success: false, error: 'Campaign not found.' }, { status: 404 });
    }

    const campaign = campaignDoc.data() as any;
    const resolvedCampaignId = campaignDoc.id;
    const resolvedTeamspaceId = campaign.teamspaceId;

    if (!campaign.landingPageEnabled || (campaign.landingPageStatus || 'live') !== 'live') {
      return NextResponse.json({ success: false, error: 'Landing page is not live.' }, { status: 403 });
    }

    if (campaign.status === 'Paused' || campaign.status === 'Cancelled') {
      return NextResponse.json({ success: false, error: 'Campaign is not accepting leads right now.' }, { status: 403 });
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

    try {
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
    } catch (error: any) {
      console.error('CAMPAIGN_LEAD_WRITE_FAILED:', error);
      return NextResponse.json({ success: false, error: 'Lead capture is temporarily unavailable.' }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to capture lead.' }, { status: 500 });
  }
}
