import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { ZodError } from 'zod';

let app: App | undefined;
if (!getApps().length) {
    try {
        app = initializeApp();
    } catch (e) {
        console.error('Firebase admin initialization error. This can happen in a local development environment if server credentials are not configured.', e);
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
    const initializationError = new Error(
      'Firebase Admin SDK failed to initialize. This is likely due to missing server credentials. ' +
      'In a local environment, set the GOOGLE_APPLICATION_CREDENTIALS environment variable. ' +
      'In a managed environment (like App Hosting), ensure the service account has the correct permissions.'
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

    // Specific Firebase Auth error codes
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

    // Zod validation errors
    if (error instanceof ZodError) {
        return `Validation Error: ${error.errors.map(e => e.message).join(', ')}`;
    }
    
    const errorMessage = error.message || 'An unknown server error occurred.';
    const lowerCaseError = errorMessage.toLowerCase();
    
    // Generic credential/permission errors
    const credentialErrorKeywords = [
        'could not access refresh token',
        'could not load the default credentials',
        'missing credentials',
        'service account',
        'permission denied',
        'creds'
    ];

    if (credentialErrorKeywords.some(keyword => lowerCaseError.includes(keyword))) {
        return 'Server Authentication Failed: The server could not authenticate with Firebase using Admin credentials. This is an environment configuration issue, not a bug in the application code. Please ensure your hosting environment has the necessary service account credentials and permissions.';
    }

    // Fallback to the original error message
    return errorMessage;
}
