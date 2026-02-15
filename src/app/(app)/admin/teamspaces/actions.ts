'use server';

import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
     if (error.code !== 'app/duplicate-app') {
      console.error('Firebase admin initialization error', error);
    }
  }
}
const db = admin.firestore();

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
        const newTeamspaceRef = db.collection('teamspaces').doc();
        const newTeamspaceId = newTeamspaceRef.id;

        await newTeamspaceRef.set({
            id: newTeamspaceId,
            name: values.name,
            description: values.description,
            ownerId: values.ownerId,
            memberIds: [values.ownerId], // Owner is the first member
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        revalidatePath('/admin/teamspaces');
        revalidatePath('/admin/users');

        return { success: true, teamspaceId: newTeamspaceId };
    } catch(error: any) {
        console.error('Error creating teamspace:', error);
        return { success: false, error: 'Failed to create teamspace.' };
    }
}
