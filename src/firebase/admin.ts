import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { ZodError } from 'zod';

let app: App | undefined;

/**
 * Robust Admin SDK initialization.
 * On Vercel or local environments without service account keys, 
 * this will fail gracefully instead of crashing the process.
 */
if (!getApps().length) {
    try {
        // Attempt automatic initialization (works in App Hosting/Cloud Functions)
        app = initializeApp();
    } catch (e) {
        console.warn('Firebase Admin SDK: Automatic initialization failed. Server actions requiring Admin privileges may fail if service account credentials are not provided via environment variables.');
    }
} else {
    app = getApps()[0];
}

let adminDb: Firestore;
let adminAuth: Auth;

if (app) {
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
} else {
    // If initialization failed, provide a throwing proxy that explains the 500 error
    const initializationError = new Error(
      'Firebase Admin SDK failed to initialize. This is likely because GOOGLE_APPLICATION_CREDENTIALS is not set in your environment (common on Vercel). ' +
      'Please ensure you have configured your service account credentials if you are using Server Actions that require Admin access.'
    );
  
    const createThrowingProxy = (name: string) => new Proxy({}, {
      get() {
        throw initializationError;
      }
    });
  
    adminDb = createThrowingProxy('Firestore') as Firestore;
    adminAuth = createThrowingProxy('Auth') as Auth;
}

export { adminDb, adminAuth };
export const serverTimestamp = FieldValue.serverTimestamp;
export { FieldValue };

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
        }
    }

    if (error instanceof ZodError) {
        return `Validation Error: ${error.errors.map(e => e.message).join(', ')}`;
    }
    
    return error.message || 'An unknown server error occurred.';
}