'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const UpdateProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  avatar: z.string().url('Please enter a valid URL for the avatar.').optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
type UpdateProfileResult = { success: boolean; error?: string };

export async function updateUserProfile(values: UpdateProfileInput): Promise<UpdateProfileResult> {
  try {
    const { adminAuth, adminDb, serverTimestamp } = getAdminInstances();
    const validatedInput = UpdateProfileSchema.parse(values);

    const { userId, displayName, avatar } = validatedInput;

    // Update Firebase Auth user
    await adminAuth.updateUser(userId, { displayName, photoURL: avatar });

    // Update Firestore document
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.update({
      displayName,
      avatar,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/profile');
    revalidatePath('/(app)', 'layout'); // Revalidate the whole app layout to update header avatar

    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    let errorMessage = 'An unknown server error occurred.';

    if (error instanceof z.ZodError) {
      errorMessage = error.errors.map(e => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: `Failed to update profile: ${errorMessage}` };
  }
}
