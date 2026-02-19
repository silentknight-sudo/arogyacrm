'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateTeamspaceSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string().min(1, 'Owner ID is required.'),
});

export type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceSchema>;
type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string; };

export async function adminCreateTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateTeamspaceSchema.parse(values);
        
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
        revalidatePath('/admin/users'); // User's teamspace list might change

        return { success: true, teamspaceId: newTeamspaceId, name: validatedInput.name };

    } catch (error: any) {
        console.error('Error creating teamspace:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create teamspace: ${errorMessage}` };
    }
}
