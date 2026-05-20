import { NextResponse } from 'next/server';
import { adminDb, serverTimestamp } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, fullName, phone, email, city, age, painPoint } = body || {};

    if (!slug || !fullName || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const campaignSnap = await adminDb.collectionGroup('campaigns').where('slug', '==', slug).limit(1).get();
    if (campaignSnap.empty) {
      return NextResponse.json({ success: false, error: 'Campaign not found.' }, { status: 404 });
    }

    const campaignDoc = campaignSnap.docs[0];
    const campaign = campaignDoc.data() as any;
    const campaignId = campaignDoc.id;
    const teamspaceId = campaign.teamspaceId;

    const campaignLeadRef = adminDb
      .collection('teamspaces')
      .doc(teamspaceId)
      .collection('campaigns')
      .doc(campaignId)
      .collection('landingLeads')
      .doc();

    await campaignLeadRef.set({
      id: campaignLeadRef.id,
      campaignId,
      teamspaceId,
      fullName,
      phone,
      email: email || '',
      city: city || '',
      age: age || '',
      painPoint: painPoint || '',
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
