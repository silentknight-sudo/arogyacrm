import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Robust, lazy initialization for the Firebase Admin SDK.
 * Optimized for Vercel and CI/CD environments.
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
      console.error('Lazy Admin Init Failed:', e);
    }
  }

  // STRATEGY 2: Auto-discovery (GCP / App Hosting)
  // We only do this in true serverless environments to avoid IDE trust prompts
  const isServerless = !!(process.env.K_SERVICE || process.env.VERCEL || process.env.FUNCTIONS_EMULATOR);
  if (isServerless) {
    try {
      return initializeApp();
    } catch (e) {
      // Quiet fail if ADC is missing
    }
  }

  return null;
}

/**
 * Proxy-based lazy initialization. 
 * Prevents 500 errors during build time and avoids unnecessary IDE "Trust" prompts.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (prop === 'then') return undefined; // Next.js internal check skip
    const app = getAdminApp();
    if (!app) {
        // Return a dummy object if initialization fails during build/SSR to prevent hard crashes
        console.warn('Admin SDK Firestore requested but app not initialized.');
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
        console.warn('Admin SDK Auth requested but app not initialized.');
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
    return new Date(); // Fallback to standard Date for offline/mock scenarios
  }
};

export function handleAdminSDKError(error: any): string {
  console.error('Admin SDK Error:', error);
  if (error.code === 'auth/email-already-exists') return 'This email address is already in use.';
  return error.message || 'A server-side error occurred.';
}
