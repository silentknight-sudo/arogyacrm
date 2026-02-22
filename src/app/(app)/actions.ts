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
    const { name, description, ownerId } = values;

    if (!name || name.length < 2) {
        return { success: false, error: 'Teamspace name must be at least 2 characters.' };
    }
    if (!ownerId) {
        return { success: false, error: 'Owner ID is required. You may not be properly logged in.' };
    }

    let userDocRef;
    try {
        userDocRef = adminDb.collection('users').doc(ownerId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return { success: false, error: `User profile with ID ${ownerId} does not exist in the database. Cannot create teamspace.` };
        }
    } catch (e: any) {
        console.error('Error fetching user document:', e);
        return { success: false, error: `Failed to verify user: ${e.message}` };
    }

    const newTeamspaceRef = adminDb.collection('teamspaces').doc();
    const newTeamspaceId = newTeamspaceRef.id;
    
    try {
        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: name,
            description: description || '',
            ownerId: ownerId,
            memberIds: [ownerId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } catch (e: any) {
        console.error('Error creating teamspace document:', e);
        return { success: false, error: `Failed to create teamspace document: ${e.message}` };
    }

    try {
        await userDocRef.update({
            teamspaceIds: FieldValue.arrayUnion(newTeamspaceId)
        });
    } catch (e: any) {
        console.error('Error updating user profile with new teamspace:', e);
        // Attempt to roll back by deleting the created teamspace
        await newTeamspaceRef.delete().catch(delErr => console.error('Failed to roll back teamspace creation:', delErr));
        return { success: false, error: `Failed to add teamspace to user profile: ${e.message}` };
    }
    
    revalidatePath('/admin/teamspaces');
    revalidatePath('/admin/users');
    revalidatePath('/(app)', 'layout');

    return { success: true, teamspaceId: newTeamspaceId, name: name };
}
