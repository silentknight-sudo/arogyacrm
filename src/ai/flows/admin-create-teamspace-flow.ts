'use server';
/**
 * @fileOverview A server-side function for administrators to create new teamspaces.
 * This function uses the Firebase Admin SDK to securely create a new teamspace document in Firestore.
 * This is NOT a Genkit flow, but a regular server action helper.
 */

import { z } from 'zod';
import { adminDb, serverTimestamp } from '@/firebase/admin';

// Define the input schema for validation
const CreateTeamspaceInputSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string(), // The admin creating the teamspace
});
export type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceInputSchema>;

export type CreateTeamspaceOutput = {
  teamspaceId: string,
};

// The exported wrapper function that the server action will call
export async function adminCreateTeamspace(input: CreateTeamspaceInput): Promise<CreateTeamspaceOutput> {
  // Validate input against the schema
  const validatedInput = CreateTeamspaceInputSchema.parse(input);

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

  return {
    teamspaceId: newTeamspaceId,
  };
}
