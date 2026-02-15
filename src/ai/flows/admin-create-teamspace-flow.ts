'use server';
/**
 * @fileOverview A Genkit flow for administrators to create new teamspaces.
 * This flow uses the Firebase Admin SDK to securely create a new teamspace document in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb, serverTimestamp } from '@/firebase/admin';

// Define the input schema for the flow
const CreateTeamspaceInputSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string(), // The admin creating the teamspace
});
export type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceInputSchema>;

const CreateTeamspaceOutputSchema = z.object({
  teamspaceId: z.string(),
});
export type CreateTeamspaceOutput = z.infer<typeof CreateTeamspaceOutputSchema>;

// The exported wrapper function that the server action will call
export async function adminCreateTeamspace(input: CreateTeamspaceInput): Promise<CreateTeamspaceOutput> {
  // In a production app, you might add further server-side validation here
  // to ensure the calling user has admin privileges, for example, by verifying a JWT.
  return adminCreateTeamspaceFlow(input);
}

// The Genkit flow definition
const adminCreateTeamspaceFlow = ai.defineFlow(
  {
    name: 'adminCreateTeamspaceFlow',
    inputSchema: CreateTeamspaceInputSchema,
    outputSchema: CreateTeamspaceOutputSchema,
  },
  async (input) => {
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

    return {
      teamspaceId: newTeamspaceId,
    };
  }
);
