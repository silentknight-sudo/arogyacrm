import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Robust, lazy initialization for the Firebase Admin SDK.
 * Optimized for Vercel and zero-prompt development.
 */
function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Robust parsing for Vercel multiline private keys
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
  }

  // STRATEGY 1: Explicit credentials (Vercel / Production)
  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } catch (e) {
      console.error('Firebase Admin SDK: Explicit Init Failed:', e);
    }
  }

  // STRATEGY 2: Emulator Discovery
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    try {
      return initializeApp({ projectId: projectId || 'demo-project' });
    } catch (e) {}
  }

  // PREVENT BUILD HANGS: If no credentials exist during build, return null
  // instead of triggering automatic GCP metadata discovery (which prompts IDX/Cloud Code).
  return null;
}

/**
 * Proxy-based lazy initialization.
 * Prevents module-level crashes during Next.js build phase.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    const app = getAdminApp();
    if (!app) {
      // Return a safe "null-safe" thrower for methods, prevents 500 errors on import
      return (...args: any[]) => {
        const error = new Error(`Firebase Admin SDK is not configured. Missing environment variables for method: ${String(prop)}`);
        console.error(error.message);
        throw error;
      };
    }
    const db = getFirestore(app);
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    const app = getAdminApp();
    if (!app) {
      return (...args: any[]) => {
        throw new Error(`Firebase Admin SDK is not configured. Missing environment variables for method: ${String(prop)}`);
      };
    }
    const auth = getAuth(app);
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

export { FieldValue };

/** Safe helper for server timestamps that works even during hydration. */
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
