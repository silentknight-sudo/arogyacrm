'use server';

import { adminDb, serverTimestamp, FieldValue } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

type CreateTeamspaceInput = {
  name: string;
  description?: string;
  ownerId: string;
};

type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string; };

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    const { name, description, ownerId } = values;

    if (!name || name.length < 2) {
        return { success: false, error: 'Teamspace name must be at least 2 characters.' };
    }
    if (!ownerId) {
        return { success: false, error: 'Owner ID is required. You may not be properly logged in.' };
    }

    try {
        const userDocRef = adminDb.collection('users').doc(ownerId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            throw new Error(`User profile with ID ${ownerId} does not exist.`);
        }

        const newTeamspaceRef = adminDb.collection('teamspaces').doc();
        const batch = adminDb.batch();
        
        // Queue teamspace creation
        batch.set(newTeamspaceRef, {
            id: newTeamspaceRef.id,
            name: name,
            description: description || '',
            ownerId: ownerId,
            memberIds: [ownerId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Queue user profile update
        batch.update(userDocRef, {
            teamspaceIds: FieldValue.arrayUnion(newTeamspaceRef.id)
        });

        await batch.commit();

        revalidatePath('/admin/teamspaces');
        revalidatePath('/(app)', 'layout');

        return { success: true, teamspaceId: newTeamspaceRef.id, name: name };

    } catch (e: any) {
        console.error('Error creating teamspace:', e);
        return { success: false, error: `Failed to create teamspace: ${e.message}` };
    }
}
