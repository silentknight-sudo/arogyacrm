import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Permanent fix for Vercel 500 errors and Dev Environment Auth prompts.
 * This logic avoids triggering Google Cloud credential lookups unless it's certain
 * that valid credentials or a supported environment exist.
 */
function getAdminApp(): App | null {
    if (getApps().length > 0) return getApps()[0];

    // 1. Check for Vercel / Manual Environment Variables (The Permanent Solution for Hosting)
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        try {
            return initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                projectId,
            });
        } catch (e) {
            console.error('Failed to initialize Admin SDK with service account:', e);
        }
    }

    // 2. Only attempt automatic initialization if we are in a known Google Cloud environment
    // (Google App Hosting, Cloud Run, etc.) to prevent the "Grant Access" prompt in other dev tools.
    if (process.env.K_SERVICE || process.env.FUNCTIONS_EMULATOR || process.env.GOOGLE_CLOUD_PROJECT) {
        try {
            return initializeApp();
        } catch (e) {
            // Silent fail to avoid crashing the server if ADC lookup fails
        }
    }

    return null;
}

const app = getAdminApp();

/**
 * We use proxies to prevent the server from crashing if credentials are missing.
 * This ensures that standard page loads don't 500, even if the Admin SDK isn't ready.
 */
const initializationError = (action: string) => new Error(
  `Firebase Admin SDK failed to initialize for ${action}. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment.`
);

export const adminDb: Firestore = app 
    ? getFirestore(app) 
    : new Proxy({} as Firestore, { get() { throw initializationError('Firestore'); } });

export const adminAuth: Auth = app 
    ? getAuth(app) 
    : new Proxy({} as Auth, { get() { throw initializationError('Auth'); } });

export { FieldValue };

/**
 * Safe server timestamp generator that doesn't rely on immediate SDK availability.
 */
export const serverTimestamp = () => {
    try {
        return FieldValue.serverTimestamp();
    } catch (e) {
        return new Date().toISOString(); 
    }
};

export function handleAdminSDKError(error: any): string {
    console.error('Admin SDK Action Error:', error);
    if (error.code === 'auth/email-already-exists') return 'This email address is already in use.';
    if (error.code === 'permission-denied') return 'The server does not have permission to perform this action.';
    return error.message || 'An unknown server error occurred.';
}
