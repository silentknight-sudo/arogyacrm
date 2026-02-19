'use server';

import { getAdminInstances } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

// Simplified types to remove Zod dependency for debugging
type HandleCreateTeamspaceInput = {
  name: string;
  description?: string;
  ownerId: string;
};
type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string; };

export async function handleCreateTeamspace(values: HandleCreateTeamspaceInput): Promise<CreateTeamspaceResult> {
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

        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: values.name,
            description: values.description || '',
            ownerId: values.ownerId,
            memberIds: [values.ownerId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');

        return { success: true, teamspaceId: newTeamspaceId, name: values.name };

    } catch (error: any) {
        console.error('Error creating teamspace:', error);
        return { success: false, error: `Failed to create teamspace: ${error.message}` };
    }
}
