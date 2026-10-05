'use server';

import { adminAuth, adminDb, handleAdminSDKError } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

function describeDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown device';

  const ua = userAgent.toLowerCase();
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('iphone')) os = 'iPhone';
  else if (ua.includes('ipad')) os = 'iPad';
  else if (ua.includes('mac os')) os = 'Mac';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = 'Unknown browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  return `${os} · ${browser}`;
}

async function resolveIpLocation(ip: string): Promise<string> {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Unknown location';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return 'Unknown location';

    const data = await response.json();
    const parts = [data.city, data.region, data.country_name].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

function getClientIp(): string {
  const headerList = headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return headerList.get('x-real-ip') || '';
}

const RecordLoginSchema = z.object({
  userId: z.string().min(1),
  userAgent: z.string().optional(),
});

export async function recordLoginSession(values: z.infer<typeof RecordLoginSchema>) {
  try {
    const { userId, userAgent } = RecordLoginSchema.parse(values);
    const ip = getClientIp();
    const [location] = await Promise.all([resolveIpLocation(ip)]);

    const sessionRef = adminDb.collection('users').doc(userId).collection('loginSessions').doc();
    await sessionRef.set({
      id: sessionRef.id,
      device: describeDevice(userAgent || ''),
      userAgent: userAgent || '',
      ip: ip || 'Unknown',
      location,
      loginAt: FieldValue.serverTimestamp(),
      logoutAt: null,
    });

    return { success: true, sessionId: sessionRef.id };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const RecordLogoutSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function recordLogoutSession(values: z.infer<typeof RecordLogoutSchema>) {
  try {
    const { userId, sessionId } = RecordLogoutSchema.parse(values);
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('loginSessions')
      .doc(sessionId)
      .set({ logoutAt: FieldValue.serverTimestamp() }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const UpdateAccessSchema = z.object({
  targetUserId: z.string().min(1),
  adminId: z.string().min(1),
  accessStatus: z.enum(['approved', 'blocked']),
});

async function notifyAdmins(payload: { title: string; description: string; link?: string }) {
  const adminsSnap = await adminDb.collection('users').where('role', '==', 'admin').get();
  const batch = adminDb.batch();
  adminsSnap.docs.forEach((adminDoc) => {
    batch.create(adminDoc.ref.collection('notifications').doc(), {
      title: payload.title,
      description: payload.description,
      type: 'access_approval_request',
      timestamp: new Date().toISOString(),
      read: false,
      link: payload.link || '/device-manager',
    });
  });
  await batch.commit();
}

export async function updateMemberAccess(values: z.infer<typeof UpdateAccessSchema>) {
  try {
    const { targetUserId, adminId, accessStatus } = UpdateAccessSchema.parse(values);

    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new Error('Only admins can approve or block member access.');
    }

    if (targetUserId === adminId) {
      throw new Error('Admins cannot block their own login from Device Manager.');
    }

    const targetRef = adminDb.collection('users').doc(targetUserId);
    const targetDoc = await targetRef.get();
    if (!targetDoc.exists) throw new Error('Member profile not found.');

    await adminAuth.updateUser(targetUserId, { disabled: accessStatus === 'blocked' });
    await targetRef.update({
      accessStatus,
      blockedAt: accessStatus === 'blocked' ? FieldValue.serverTimestamp() : null,
      blockedBy: accessStatus === 'blocked' ? adminId : null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await targetRef.collection('notifications').add({
      title: accessStatus === 'blocked' ? 'Access Blocked' : 'Access Approved',
      description: accessStatus === 'blocked'
        ? 'Your CRM login has been blocked by admin.'
        : 'Your CRM login has been approved. You can login again.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/dashboard',
    });

    revalidatePath('/device-manager');
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const BlockedLoginAttemptSchema = z.object({
  email: z.string().email(),
});

export async function notifyBlockedLoginAttempt(values: z.infer<typeof BlockedLoginAttemptSchema>) {
  try {
    const { email } = BlockedLoginAttemptSchema.parse(values);
    const userRecord = await adminAuth.getUserByEmail(email);
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    if (!userRecord.disabled && userData?.accessStatus !== 'blocked') {
      return { success: true };
    }

    await notifyAdmins({
      title: 'Blocked Login Attempt',
      description: `${userData?.displayName || email} tried to login while blocked. Approve this member from Device Manager if access should be restored.`,
      link: '/device-manager',
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
