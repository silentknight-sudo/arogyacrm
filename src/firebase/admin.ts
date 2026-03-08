import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Robust, lazy initialization for the Firebase Admin SDK.
 * This prevents module-level crashes on Vercel and recurring "Grant Access" prompts in dev.
 */
function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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

  // Only auto-discover in true GCP environments, avoiding IDE prompts in local dev
  const isCloudEnvironment = !!(process.env.K_SERVICE || process.env.FUNCTIONS_EMULATOR || process.env.GOOGLE_CLOUD_PROJECT);
  if (isCloudEnvironment) {
    try {
      return initializeApp();
    } catch (e) {}
  }

  return null;
}

const initializationError = (service: string) => 
  new Error(`Admin SDK ${service} not ready. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Vercel settings.`);

/**
 * We use Proxies to ensure the server doesn't crash during build or if variables are missing.
 * The error is only thrown when the service is actually called in a Server Action.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    const app = getAdminApp();
    if (!app) throw initializationError('Firestore');
    const db = getFirestore(app);
    return (db as any)[prop];
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    const app = getAdminApp();
    if (!app) throw initializationError('Auth');
    const auth = getAuth(app);
    return (auth as any)[prop];
  }
});

export { FieldValue };

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
  return error.message || 'A server-side error occurred.';
}
