'use server';

import { adminDb, serverTimestamp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

type CreateTeamspaceInput = {
    name: string;
    description: string;
    ownerId: string; // The admin creating the teamspace
};

type CreateTeamspaceResult = {
    success: boolean;
    error?: string;
    teamspaceId?: string;
};

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    try {
        const newTeamspaceRef = adminDb.collection('teamspaces').doc();
        const newTeamspaceId = newTeamspaceRef.id;

        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: values.name,
            description: values.description,
            ownerId: values.ownerId,
            memberIds: [values.ownerId], // Owner is the first member
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');

        return { success: true, teamspaceId: newTeamspaceId };
    } catch(error: any) {
        console.error('Error creating teamspace:', error);
        return { success: false, error: `Failed to create teamspace. Error: ${error.message}` };
    }
}
