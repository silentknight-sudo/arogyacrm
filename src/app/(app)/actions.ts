'use server';

import { getAdminInstances } from '@/firebase/admin';
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
        const { adminDb, serverTimestamp } = getAdminInstances();
        
        if (!values.name || values.name.length < 2) {
            throw new Error('Teamspace name must be at least 2 characters.');
        }
        if (!values.ownerId) {
            throw new Error('Owner ID is required.');
        }

        const newTeamspaceRef = adminDb.collection('teamspaces').doc();
        const newTeamspaceId = newTeamspaceRef.id;

        // Also add the new teamspace to the owner's user profile
        const userDocRef = adminDb.collection('users').doc(values.ownerId);

        await adminDb.runTransaction(async (transaction) => {
            transaction.set(newTeamspaceRef, {
                id: newTeamspaceId,
                name: values.name,
                description: values.description || '',
                ownerId: values.ownerId,
                memberIds: [values.ownerId],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            transaction.update(userDocRef, {
                teamspaceIds: adminDb.FieldValue.arrayUnion(newTeamspaceId)
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
