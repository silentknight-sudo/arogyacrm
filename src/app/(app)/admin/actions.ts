'use server';

import { adminDb, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';

const COLLECTIONS_TO_DELETE = [
  'leads',
  'contacts',
  'accounts',
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

async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
  const query = collectionRef.limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: () => void) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid hitting stack size limits
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
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
        await deleteCollection(collectionRef, 50); // Using a batch size of 50
      }
    }
    
    // Also delete root products collection
    const productsRef = adminDb.collection('products');
    await deleteCollection(productsRef, 50);


    // Revalidate all paths to reflect the changes in the UI
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}
