'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateTeamspaceSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string().min(1, 'Owner ID is required.'),
});

type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceSchema>;
type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string };

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
  try {
    const validatedInput = CreateTeamspaceSchema.parse(values);
    const { name, description, ownerId } = validatedInput;

    const userDocRef = adminDb.collection('users').doc(ownerId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${ownerId} does not exist.`);
    }

    const newTeamspaceRef = adminDb.collection('teamspaces').doc();
    
    // Use a write batch to perform an atomic operation
    const batch = adminDb.batch();
    
    // 1. Create the new teamspace
    batch.set(newTeamspaceRef, {
      id: newTeamspaceRef.id,
      name,
      description: description || '',
      ownerId,
      memberIds: [ownerId], // The creator is the first member
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Add the new teamspace ID to the user's list of teamspaces
    batch.update(userDocRef, {
      teamspaceIds: FieldValue.arrayUnion(newTeamspaceRef.id)
    });

    // Commit the atomic batch
    await batch.commit();

    // Revalidate paths to update the UI
    revalidatePath('/admin/teamspaces');
    revalidatePath('/(app)', 'layout'); // Revalidate layout to update teamspace switcher

    return { success: true, teamspaceId: newTeamspaceRef.id, name: name };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: `Failed to create teamspace: ${errorMessage}` };
  }
}
