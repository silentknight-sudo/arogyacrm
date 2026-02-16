import * as admin from 'firebase-admin';

export function getAdminInstances() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp();
        } catch (e) {
            console.error('Firebase admin initialization error', e);
        }
    }
    return {
        adminAuth: admin.auth(),
        adminDb: admin.firestore(),
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp,
    };
}
