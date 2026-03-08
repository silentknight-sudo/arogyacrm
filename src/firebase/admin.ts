import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Robust, lazy initialization for the Firebase Admin SDK.
 * Optimized for Vercel, GCP, and local development.
 */
function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // STRATEGY 1: Explicit credentials (Vercel / Production)
  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } catch (e) {
      console.error('Explicit Admin SDK Init Failed:', e);
    }
  }

  // STRATEGY 2: Environment Discovery (GCP / App Hosting)
  // We only attempt this in specific environments to avoid trust prompts in local dev
  const isServerless = !!(process.env.K_SERVICE || process.env.VERCEL || process.env.FUNCTIONS_EMULATOR);
  if (isServerless) {
    try {
      return initializeApp();
    } catch (e) {
      // Fail silently during build/discovery phases
    }
  }

  return null;
}

/**
 * Proxy-based lazy initialization. 
 * Prevents build-time crashes and unnecessary trust prompts.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (prop === 'then') return undefined;
    const app = getAdminApp();
    if (!app) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Admin SDK Firestore requested but app not initialized. Verify environment variables.');
        }
        return undefined;
    }
    const db = getFirestore(app);
    return (db as any)[prop];
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (prop === 'then') return undefined;
    const app = getAdminApp();
    if (!app) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Admin SDK Auth requested but app not initialized. Verify environment variables.');
        }
        return undefined;
    }
    const auth = getAuth(app);
    return (auth as any)[prop];
  }
});

export { FieldValue };

/** Safe helper for server timestamps */
export const serverTimestamp = () => {
  try {
    return FieldValue.serverTimestamp();
  } catch (e) {
    return new Date().toISOString(); 
  }
};

export function handleAdminSDKError(error: any): string {
  console.error('Admin SDK Error:', error);
  if (error.code === 'auth/email-already-exists') return 'This email address is already in use.';
  if (error.code === 'permission-denied') return 'Insufficient permissions to perform this action.';
  return error.message || 'A server-side error occurred.';
}