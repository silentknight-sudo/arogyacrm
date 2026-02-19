import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp();
    } catch (e) {
        console.error('Firebase admin initialization error. Ensure server environment is set up correctly.', e);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
