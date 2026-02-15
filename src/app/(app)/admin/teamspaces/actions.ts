'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminDb, serverTimestamp } from '@/firebase/admin';

// This type is used by the calling component, so we export it.
export type CreateTeamspaceInput = {
  name: string;
  description?: string;
  ownerId: string;
};

// Internal schema for validation
const CreateTeamspaceInputSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string().min(1, 'Owner ID is required.'),
});

type CreateTeamspaceResult = {
    success: boolean;
    error?: string;
    teamspaceId?: string;
};

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    try {
        // Validate the incoming values
        const validatedInput = CreateTeamspaceInputSchema.parse(values);

        const newTeamspaceRef = adminDb.collection('teamspaces').doc();
        const newTeamspaceId = newTeamspaceRef.id;

        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: validatedInput.name,
            description: validatedInput.description || '',
            ownerId: validatedInput.ownerId,
            memberIds: [validatedInput.ownerId], // The creator is the first member
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Revalidate paths to update the UI after creation
        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');

        return { success: true, teamspaceId: newTeamspaceId };

    } catch(error: any) {
        console.error('Error creating teamspace:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
          errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.cause?.message) {
          errorMessage = error.cause.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create teamspace: ${errorMessage}` };
    }
}
