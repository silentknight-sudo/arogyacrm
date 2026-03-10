'use server';

import { adminAuth, adminDb, handleAdminSDKError } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateUserInputSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  teamspaceIds: z.array(z.string()),
  creatorId: z.string().min(1),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

type CreateUserResult = {
  success: boolean;
  error?: string;
};

export async function createUser(values: CreateUserInput): Promise<CreateUserResult> {
  try {
    const validatedInput = CreateUserInputSchema.parse(values);
    
    // 1. VERIFY PERMISSIONS
    const creatorDoc = await adminDb.collection('users').doc(validatedInput.creatorId).get();
    if (!creatorDoc.exists) throw new Error('Unauthorized creator context.');
    
    const creatorData = creatorDoc.data();
    const creatorRole = creatorData?.role;

    if (creatorRole === 'sales_team_lead') {
        // TL can only create Sales Executives
        if (validatedInput.role !== 'sales_executive') {
            throw new Error('Team Leaders can only onboard Sales Executives.');
        }
        // TL can only assign to teamspaces they are in
        const isAuthorizedTS = validatedInput.teamspaceIds.every(id => creatorData?.teamspaceIds?.includes(id));
        if (!isAuthorizedTS) {
            throw new Error('You cannot assign users to workspaces outside your jurisdiction.');
        }
    } else if (creatorRole !== 'admin') {
        throw new Error('You do not have administrative privileges.');
    }

    // 2. CREATE IN AUTH
    const userRecord = await adminAuth.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      displayName: validatedInput.displayName,
      emailVerified: false, 
    });

    const newUserId = userRecord.uid;

    // 3. CREATE PROFILE
    const userDocRef = adminDb.collection('users').doc(newUserId);
    await userDocRef.set({
      id: newUserId,
      displayName: validatedInput.displayName,
      email: validatedInput.email,
      role: validatedInput.role,
      teamspaceIds: validatedInput.teamspaceIds,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      avatar: `https://picsum.photos/seed/${newUserId}/100/100`,
      createdBy: validatedInput.creatorId,
    });
    
    await adminAuth.setCustomUserClaims(newUserId, { role: validatedInput.role });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}


const DeleteUserSchema = z.object({
  userId: z.string().min(1),
  adminId: z.string().min(1),
});

export async function deleteUser(values: { userId: string, adminId: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, adminId } = DeleteUserSchema.parse(values);

    const adminUserDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminUserDoc.exists) throw new Error('Unauthorized session.');
    
    const adminData = adminUserDoc.data();
    const adminRole = adminData?.role;

    const targetUserDoc = await adminDb.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) throw new Error('User profile not found.');
    const targetData = targetUserDoc.data();

    // HIERARCHY PROTECTION
    if (userId === adminId) {
        throw new Error('Self-decommissioning is restricted.');
    }

    if (adminRole === 'admin') {
        // Full access
    } else if (adminRole === 'sales_team_lead') {
        // Can only delete Sales Executives they personally created
        if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== adminId) {
            throw new Error('You can only manage members you have personally onboarded.');
        }
    } else {
        throw new Error('Unauthorized.');
    }

    await adminAuth.deleteUser(userId);
    await adminDb.collection('users').doc(userId).delete();

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}

const UpdatePasswordSchema = z.object({
  userId: z.string().min(1),
  adminId: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function updateUserPassword(values: z.infer<typeof UpdatePasswordSchema>): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, adminId, password } = UpdatePasswordSchema.parse(values);

    // Verify privileges
    const adminUserDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminUserDoc.exists) throw new Error('Unauthorized session.');
    
    const adminData = adminUserDoc.data();
    const adminRole = adminData?.role;

    const targetUserDoc = await adminDb.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) throw new Error('User profile not found.');
    const targetData = targetUserDoc.data();

    // HIERARCHY PROTECTION
    if (userId === adminId) {
        // Users can always change their own password if they reach this server action
    } else if (adminRole === 'admin') {
        // Admin can change anyone
    } else if (adminRole === 'sales_team_lead') {
        // TL can only change Sales Executives they personally created
        if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== adminId) {
            throw new Error('You can only reset credentials for members you have personally onboarded.');
        }
    } else {
        throw new Error('Unauthorized: You do not have management privileges.');
    }

    await adminAuth.updateUser(userId, { password });
    
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}
