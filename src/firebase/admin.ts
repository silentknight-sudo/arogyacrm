import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } catch (e) {
      console.error('Firebase Admin SDK: Initialization Failed:', e);
    }
  }

  return null;
}

/**
 * Robust Lazy Proxy for Admin Firestore.
 * Throws a clear error if credentials are missing to prevent "undefined reading doc" crashes.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(target, prop) {
    if (prop === 'then' || prop === 'constructor') return undefined;
    const app = getAdminApp();
    if (!app) {
      throw new Error('Firebase Admin SDK is not initialized. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment variables.');
    }
    const db = getFirestore(app);
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (prop === 'then' || prop === 'constructor') return undefined;
    const app = getAdminApp();
    if (!app) {
      throw new Error('Firebase Admin Auth is not initialized. Ensure environment variables are set.');
    }
    const auth = getAuth(app);
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
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
  if (error.code === 'permission-denied') return 'Insufficient permissions.';
  return error.message || 'A secure server-side error occurred.';
}
