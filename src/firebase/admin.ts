import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let app: App;
if (!getApps().length) {
    try {
        app = initializeApp();
    } catch (e) {
        console.error('Firebase admin initialization error. This can happen in a local development environment if server credentials are not configured.', e);
    }
} else {
    app = getApps()[0];
}


export const adminDb = getFirestore(app!);
export const adminAuth = getAuth(app!);
export const serverTimestamp = FieldValue.serverTimestamp;
export { FieldValue };
