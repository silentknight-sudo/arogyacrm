import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Hyper-resilient private key formatter.
 * Definitively handles literal \n, multi-line strings, and Vercel dashboard artifacts.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // 1. Remove any wrapping double quotes
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // 2. Convert literal "\n" strings into actual newline characters
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 3. Ensure the key has proper headers and structure
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}`;
  }
  if (!cleaned.includes('-----END PRIVATE KEY-----')) {
    cleaned = `${cleaned}\n-----END PRIVATE KEY-----`;
  }

  return cleaned;
}

/**
 * Robust Admin SDK Initializer.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('MISSING_FIREBASE_ENV_VARS: Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Vercel.');
  }

  const privateKey = formatPrivateKey(rawPrivateKey);

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK: Initialization Failed:', error);
    throw error;
  }
}

/**
 * Lazy Proxy for Firestore.
 * Prevents crashes during build/SSR by initializing ONLY when a method is called.
 * Explicitly blocks 'then' to prevent Next.js from mistaking it for a Promise.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
      return undefined;
    }
    const app = initializeAdmin();
    const db = getFirestore(app);
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

/**
 * Lazy Proxy for Auth.
 */
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
      return undefined;
    }
    const app = initializeAdmin();
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
