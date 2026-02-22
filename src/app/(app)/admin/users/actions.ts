'use server';

import { adminAuth, adminDb, serverTimestamp } from '@/firebase/admin';
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    }

    return { success: false, error: errorMessage };
  }
}
