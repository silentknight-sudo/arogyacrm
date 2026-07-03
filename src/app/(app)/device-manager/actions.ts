'use server';

import { adminAuth, adminDb, handleAdminSDKError } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
