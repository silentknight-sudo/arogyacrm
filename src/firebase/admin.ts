import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp();
    } catch (e: any) {
        if (e.code !== 'app/duplicate-app') {
            console.error('Firebase admin initialization error', e);
        }
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
