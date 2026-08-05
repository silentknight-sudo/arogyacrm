import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import type { UserProfile } from '@/types';

export const dynamic = 'force-dynamic';

function publicProfile(id: string, data: FirebaseFirestore.DocumentData): UserProfile {
  return {
    id,
    displayName: data.displayName || data.email || 'Team member',
    email: data.email || '',
    employeeId: data.employeeId,
    avatar: data.avatar,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    role: data.role,
    accessStatus: data.accessStatus,
    teamspaceIds: Array.isArray(data.teamspaceIds) ? data.teamspaceIds : [],
    createdBy: data.createdBy,
  };
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(authorization.slice(7));
    const requesterSnapshot = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!requesterSnapshot.exists) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const requester = requesterSnapshot.data() || {};
    if (requester.role === 'sales_executive') {
      return NextResponse.json({ users: [] });
    }

    let snapshots: FirebaseFirestore.QueryDocumentSnapshot[];
    if (requester.role === 'sales_team_lead') {
      // createdBy is the authoritative, index-free TL -> telecaller relationship.
      const result = await adminDb.collection('users').where('createdBy', '==', decodedToken.uid).get();
      snapshots = result.docs.filter((document) => document.data().role === 'sales_executive');
    } else if (requester.role === 'admin') {
      const role = request.nextUrl.searchParams.get('role');
      const result = role === 'sales_team_lead' || role === 'sales_executive'
        ? await adminDb.collection('users').where('role', '==', role).get()
        : await adminDb.collection('users').get();
      snapshots = result.docs;
    } else {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    return NextResponse.json({
      users: snapshots.map((document) => publicProfile(document.id, document.data())),
    });
  } catch (error) {
    console.error('TEAM_ROSTER_API_ERROR:', error);
    return NextResponse.json({ error: 'Unable to load the team roster.' }, { status: 500 });
  }
}
