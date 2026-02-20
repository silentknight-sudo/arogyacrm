'use server';

import { adminDb, FieldValue, serverTimestamp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

// Teamspace Creation
type CreateTeamspaceInput = {
  name: string;
  description?: string;
  ownerId: string;
};
type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string; };

export async function createNewTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    try {
        if (!values.name || values.name.length < 2) {
            throw new Error('Teamspace name must be at least 2 characters.');
        }
        if (!values.ownerId) {
            throw new Error('Owner ID is required.');
        }

        const newTeamspaceRef = adminDb.collection('teamspaces').doc();
        const newTeamspaceId = newTeamspaceRef.id;

        const userDocRef = adminDb.collection('users').doc(values.ownerId);

        // First, ensure the user profile exists before attempting to write.
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            throw new Error("User profile does not exist. Cannot create teamspace.");
        }
        
        // Step 1: Create the new teamspace document.
        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: values.name,
            description: values.description || '',
            ownerId: values.ownerId,
            memberIds: [values.ownerId], // Add the owner as the first member.
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Step 2: Atomically add the new teamspace ID to the user's list of teamspaces.
        await userDocRef.update({
            teamspaceIds: FieldValue.arrayUnion(newTeamspaceId)
        });
        
        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');
        revalidatePath('/(app)', 'layout'); // Revalidate layout to update teamspace list

        return { success: true, teamspaceId: newTeamspaceId, name: values.name };

    } catch (error: any) {
        console.error('Error creating teamspace:', error);
        return { success: false, error: `Failed to create teamspace: ${error.message}` };
    }
}
