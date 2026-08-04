'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CreateTeamspaceSchema = z.object({
  name: z.string().min(2, 'Teamspace name must be at least 2 characters.'),
  description: z.string().optional(),
  ownerId: z.string().min(1, 'Owner ID is required.'),
});

type CreateTeamspaceInput = z.infer<typeof CreateTeamspaceSchema>;
type CreateTeamspaceResult = { success: boolean; error?: string; teamspaceId?: string; name?: string };
type DeleteTeamspaceResult = { success: boolean; error?: string; detachedUsers?: number };

const DeleteTeamspaceSchema = z.object({
  teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
  adminId: z.string().min(1, 'Admin ID is required.'),
});

const TEAMSPACE_COLLECTIONS_TO_DELETE = [
  'leads',
  'contacts',
  'deals',
  'tasks',
  'meetings',
  'calls',
  'documents',
  'campaigns',
  'quotes',
  'salesOrders',
  'purchaseOrders',
  'invoices',
  'tickets',
  'refunds',
  'complaints',
  'activityLogs',
];

export async function createTeamspace(values: CreateTeamspaceInput): Promise<CreateTeamspaceResult> {
  try {
    const validatedInput = CreateTeamspaceSchema.parse(values);
    const { name, description, ownerId } = validatedInput;

    const userDocRef = adminDb.collection('users').doc(ownerId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${ownerId} does not exist.`);
    }

    const newTeamspaceRef = adminDb.collection('teamspaces').doc();
    
    // Use a write batch to perform an atomic operation
    const batch = adminDb.batch();
    
    // 1. Create the new teamspace
    batch.set(newTeamspaceRef, {
      id: newTeamspaceRef.id,
      name,
      description: description || '',
      ownerId,
      memberIds: [ownerId], // The creator is the first member
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Add the new teamspace ID to the user's list of teamspaces
    batch.update(userDocRef, {
      teamspaceIds: FieldValue.arrayUnion(newTeamspaceRef.id)
    });

    // Commit the atomic batch
    await batch.commit();

    // Revalidate paths to update the UI
    revalidatePath('/admin/teamspaces');
    revalidatePath('/(app)', 'layout'); // Revalidate layout to update teamspace switcher

    return { success: true, teamspaceId: newTeamspaceRef.id, name: name };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: `Failed to create teamspace: ${errorMessage}` };
  }
}

async function deleteCollectionRecursive(collectionRef: FirebaseFirestore.CollectionReference, batchSize = 25) {
  const snapshot = await collectionRef.limit(batchSize).get();
  if (snapshot.empty) return;

  for (const doc of snapshot.docs) {
    await deleteDocumentRecursive(doc.ref);
  }

  await deleteCollectionRecursive(collectionRef, batchSize);
}

async function deleteDocumentRecursive(docRef: FirebaseFirestore.DocumentReference) {
  const nestedCollections = await docRef.listCollections();
  for (const nestedCollection of nestedCollections) {
    await deleteCollectionRecursive(nestedCollection);
  }
  await docRef.delete();
}

export async function deleteTeamspace(values: z.infer<typeof DeleteTeamspaceSchema>): Promise<DeleteTeamspaceResult> {
  try {
    const { teamspaceId, adminId } = DeleteTeamspaceSchema.parse(values);

    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new Error('Unauthorized: only admins can delete teamspaces.');
    }

    const [teamspacesSnapshot, teamspaceDoc, linkedUsersSnapshot] = await Promise.all([
      adminDb.collection('teamspaces').get(),
      adminDb.collection('teamspaces').doc(teamspaceId).get(),
      adminDb.collection('users').where('teamspaceIds', 'array-contains', teamspaceId).get(),
    ]);

    if (!teamspaceDoc.exists) {
      throw new Error('Teamspace not found.');
    }

    if (teamspacesSnapshot.size <= 1) {
      throw new Error('You must keep at least one teamspace in the CRM.');
    }

    const batch = adminDb.batch();

    linkedUsersSnapshot.docs.forEach((userDoc) => {
      batch.update(userDoc.ref, {
        teamspaceIds: FieldValue.arrayRemove(teamspaceId),
      });
    });

    const leadSyncConfigRef = adminDb.collection('leadSyncConfigs').doc(teamspaceId);
    batch.delete(leadSyncConfigRef);

    await batch.commit();

    const teamspaceRef = adminDb.collection('teamspaces').doc(teamspaceId);
    for (const collectionName of TEAMSPACE_COLLECTIONS_TO_DELETE) {
      await deleteCollectionRecursive(teamspaceRef.collection(collectionName));
    }

    await teamspaceRef.delete();

    revalidatePath('/admin/teamspaces');
    revalidatePath('/admin/users');
    revalidatePath('/(app)', 'layout');

    return { success: true, detachedUsers: linkedUsersSnapshot.size };
  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: `Failed to delete teamspace: ${errorMessage}` };
  }
}
