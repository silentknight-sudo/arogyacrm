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

        await adminDb.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new Error("User profile does not exist. Cannot create teamspace.");
            }

            // 1. Create the new teamspace document
            transaction.set(newTeamspaceRef, {
                id: newTeamspaceId,
                name: values.name,
                description: values.description || '',
                ownerId: values.ownerId,
                memberIds: [values.ownerId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 2. Update the user's document with the new teamspace ID
            transaction.update(userDocRef, {
                teamspaceIds: FieldValue.arrayUnion(newTeamspaceId)
            });
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
