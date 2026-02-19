'use server';
/**
 * @fileOverview A Genkit flow for administrators to create new teamspaces.
 * This flow uses the Firebase Admin SDK to securely create a teamspace profile in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminInstances } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

// Define the input schema for the flow
const CreateTeamspaceInputSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string().min(1, 'Owner ID is required.'),
});
export type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceInputSchema>;

const CreateTeamspaceOutputSchema = z.object({
  teamspaceId: z.string(),
  name: z.string(),
});
export type CreateTeamspaceOutput = z.infer<typeof CreateTeamspaceOutputSchema>;

// The exported wrapper function that the client will call
export async function adminCreateTeamspace(input: CreateTeamspaceInput): Promise<CreateTeamspaceOutput> {
  return adminCreateTeamspaceFlow(input);
}

const adminCreateTeamspaceFlow = ai.defineFlow(
  {
    name: 'adminCreateTeamspaceFlow',
    inputSchema: CreateTeamspaceInputSchema,
    outputSchema: CreateTeamspaceOutputSchema,
  },
  async (input) => {
    const { adminDb, serverTimestamp } = getAdminInstances();
    
    const newTeamspaceRef = adminDb.collection('teamspaces').doc();
    const newTeamspaceId = newTeamspaceRef.id;

    await newTeamspaceRef.set({
        id: newTeamspaceId,
        name: input.name,
        description: input.description || '',
        ownerId: input.ownerId,
        memberIds: [input.ownerId], // The creator is the first member
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    
    // Revalidate paths to update the UI after creation
    revalidatePath('/admin/teamspaces');
    revalidatePath('/admin/users');

    return {
      teamspaceId: newTeamspaceId,
      name: input.name,
    };
  }
);
