'use server';

import { adminAuth, adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateUserInputSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  teamspaceIds: z.array(z.string()),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

type CreateUserResult = {
  success: boolean;
  error?: string;
};

export async function createUser(values: CreateUserInput): Promise<CreateUserResult> {
  try {
    const validatedInput = CreateUserInputSchema.parse(values);
    
    // Step 1: Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      displayName: validatedInput.displayName,
      emailVerified: false, 
    });

    const newUserId = userRecord.uid;

    // Step 2: Create the user profile document in Firestore
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
    });
    
    // Optional: Set custom claims for role-based access if needed for backend rules
    await adminAuth.setCustomUserClaims(newUserId, { role: validatedInput.role });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use by another account.';
    } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
    } else if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(', ');
    } else if (error.message) {
        errorMessage = error.message;
    }

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

    // Verify admin privileges
    const adminUserDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'admin') {
      throw new Error('You do not have permission to perform this action.');
    }
    
    if (userId === adminId) {
        throw new Error('Admins cannot delete their own account.');
    }

    // Step 1: Delete user from Firebase Authentication
    await adminAuth.deleteUser(userId);

    // Step 2: Delete the user profile document in Firestore
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.delete();

    // Note: This does not remove the user from teamspace member lists or re-assign their owned documents.
    // A more robust implementation would handle this, but for this request, this is sufficient.

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    let errorMessage = 'An unexpected server error occurred. This can happen in local development if server credentials are not configured.';
    if (error.message) {
        errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}
