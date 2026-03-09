'use server';

import { adminDb, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import type { CollectionReference, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const COLLECTIONS_TO_DELETE = [
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

async function deleteCollection(collectionRef: CollectionReference, batchSize: number) {
  const query = collectionRef.limit(batchSize);

  let snapshot = await query.get();

  while (snapshot.size > 0) {
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // After deleting, get the next batch
    snapshot = await query.get();
  }
}

export async function resetAllData(adminUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, verify the user is an admin
    const userDoc = await adminDb.collection('users').doc(adminUserId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('You do not have permission to perform this action.');
    }

    const teamspacesSnapshot = await adminDb.collection('teamspaces').get();

    for (const teamspaceDoc of teamspacesSnapshot.docs) {
      for (const collectionName of COLLECTIONS_TO_DELETE) {
        const collectionRef = teamspaceDoc.ref.collection(collectionName);
        await deleteCollection(collectionRef as CollectionReference, 50);
      }
    }
    
    // Also delete root products collection
    const productsRef = adminDb.collection('products');
    await deleteCollection(productsRef as CollectionReference, 50);

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}
