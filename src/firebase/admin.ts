import * as admin from 'firebase-admin';

// This pattern ensures the app is initialized only once.
if (!admin.apps.length) {
    admin.initializeApp();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
