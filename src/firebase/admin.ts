import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { ZodError } from 'zod';

let app: App | undefined;

/**
 * Robust Admin SDK initialization for Vercel and local environments.
 */
if (!getApps().length) {
    try {
        // 1. Attempt automatic initialization (works in Google App Hosting)
        app = initializeApp();
    } catch (e) {
        try {
            // 2. Fallback for Vercel: Check for individual environment variables
            const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

            if (projectId && clientEmail && privateKey) {
                app = initializeApp({
                    credential: cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                    projectId,
                });
            }
        } catch (innerError) {
            // Silent failure during module load to prevent 500 errors
        }
    }
} else {
    app = getApps()[0];
}

/**
 * We use proxies to prevent the server from crashing if credentials are missing.
 * Errors will only be thrown when a method is actually called.
 */
const initializationError = new Error(
  'Firebase Admin SDK failed to initialize. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
);

const createThrowingProxy = (name: string) => new Proxy({}, {
  get() {
    throw initializationError;
  }
});

export const adminDb: Firestore = app ? getFirestore(app) : (createThrowingProxy('Firestore') as Firestore);
export const adminAuth: Auth = app ? getAuth(app) : (createThrowingProxy('Auth') as Auth);

// Safely export FieldValue and serverTimestamp
export { FieldValue };
export const serverTimestamp = () => FieldValue.serverTimestamp();

export function handleAdminSDKError(error: any): string {
    console.error('Admin SDK Action Error:', error);

    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-exists':
                return 'This email address is already in use by another account.';
            case 'auth/weak-password':
                return 'The password is too weak. Please choose a stronger password.';
            case 'auth/user-not-found':
                return 'User not found.';
            case 'permission-denied':
                return 'The server does not have permission to perform this action.';
        }
    }

    if (error instanceof ZodError) {
        return `Validation Error: ${error.errors.map(e => e.message).join(', ')}`;
    }
    
    return error.message || 'An unknown server error occurred.';
}