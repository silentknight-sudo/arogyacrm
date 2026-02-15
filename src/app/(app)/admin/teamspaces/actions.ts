'use server';

import { adminCreateTeamspace, CreateTeamspaceInput } from '@/ai/flows/admin-create-teamspace-flow';
import { revalidatePath } from 'next/cache';

type CreateTeamspaceResult = {
    success: boolean;
    error?: string;
    teamspaceId?: string;
};

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    try {
        // Call the secure Genkit flow to perform the backend operation
        const result = await adminCreateTeamspace(values);
        
        // Revalidate paths to update the UI after creation
        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');

        return { success: true, teamspaceId: result.teamspaceId };
    } catch(error: any) {
        console.error('Error creating teamspace via flow:', error);
        // Provide a more user-friendly error message
        return { success: false, error: `Failed to create teamspace. Error: ${error.message}` };
    }
}
