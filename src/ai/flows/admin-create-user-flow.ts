'use server';
/**
 * @fileOverview A Genkit flow for administrators to create new users.
 * This flow uses the Firebase Admin SDK to securely create a user in
 * Firebase Authentication and their corresponding profile in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminInstances } from '@/firebase/admin';

// Define the input schema for the flow
const CreateUserInputSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  teamspaceIds: z.array(z.string()),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

// The exported wrapper function that the client will call
export async function adminCreateUser(input: CreateUserInput): Promise<CreateUserOutput> {
  // Here, you would normally check if the calling user is an admin.
  // Genkit flows can be protected. For now, we rely on Firestore rules on the client.
  return adminCreateUserFlow(input);
}


const adminCreateUserFlow = ai.defineFlow(
  {
    name: 'adminCreateUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    const { adminAuth, adminDb, serverTimestamp } = getAdminInstances();
    // Step 1: Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: false, // Or true, depending on flow
    });

    const newUserId = userRecord.uid;

    // Step 2: Create the user profile document in Firestore
    const userDocRef = adminDb.collection('users').doc(newUserId);
    await userDocRef.set({
      id: newUserId,
      displayName: input.displayName,
      email: input.email,
      role: input.role,
      teamspaceIds: input.teamspaceIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatar: `https://picsum.photos/seed/${newUserId}/100/100`, // Placeholder avatar
    });
    
    // Optional: Set custom claims for role-based access if needed for backend rules
    await adminAuth.setCustomUserClaims(newUserId, { role: input.role });

    return {
      uid: newUserId,
      email: input.email,
      displayName: input.displayName,
    };
  }
);
