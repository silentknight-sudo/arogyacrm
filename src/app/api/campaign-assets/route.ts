import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { adminAuth, adminDb, getAdminStorageBucket } from '@/firebase/admin';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(authorization.slice(7));
    const profile = await adminDb.collection('users').doc(decoded.uid).get();
    const role = profile.data()?.role || decoded.role;
    if (!profile.exists || role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can upload campaign media.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const teamspaceId = String(formData.get('teamspaceId') || 'slt');
    const assetType = String(formData.get('assetType') || 'image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Select an image to upload.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are supported.' }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be smaller than 8 MB.' }, { status: 413 });
    }

    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const objectPath = `campaign-assets/${safeSegment(teamspaceId)}/${safeSegment(decoded.uid)}/${safeSegment(assetType)}-${Date.now()}-${randomUUID()}.${extension}`;
    const downloadToken = randomUUID();
    const bucket = getAdminStorageBucket();
    const object = bucket.file(objectPath);

    await object.save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: file.type,
      metadata: {
        cacheControl: 'public,max-age=31536000,immutable',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedBy: decoded.uid,
          teamspaceId,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
    return NextResponse.json({ success: true, url, path: objectPath });
  } catch (error: any) {
    console.error('CAMPAIGN_ASSET_UPLOAD_FAILED:', error);
    return NextResponse.json({ error: error?.message || 'Image upload failed.' }, { status: 500 });
  }
}
