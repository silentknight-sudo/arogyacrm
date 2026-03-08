import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Handles literal \n characters, accidental quotes, and multi-line strings 
 * commonly found in Vercel/CI environment variables.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // 1. Remove wrapping quotes often injected by dashboard copy-pasting
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // 2. Convert literal "\n" strings into true newline characters
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 3. Force presence of BEGIN/END headers to prevent PEM truncation errors
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}`;
  }
  if (!cleaned.includes('-----END PRIVATE KEY-----')) {
    cleaned = `${cleaned}\n-----END PRIVATE KEY-----`;
  }

  return cleaned;
}

/**
 * INDUSTRIAL ON-DEMAND INITIALIZER
 * Prevents build-time crashes by deferring initialization until the first method call.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('MISSING_FIREBASE_CREDENTIALS: Check Vercel Environment Variables.');
  }

  try {
    return initializeApp({
      credential: cert({ 
        projectId, 
        clientEmail, 
        privateKey: formatPrivateKey(rawPrivateKey) 
      }),
      projectId,
    });
  } catch (error: any) {
    console.error('Firebase Admin SDK Initialization Failed:', error);
    throw error;
  }
}

/**
 * LAZY PROXY SYSTEM
 * Explicitly blocks 'then' to prevent Next.js from mistaking the SDK for a Promise during builds.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') return undefined;
    const db = getFirestore(initializeAdmin());
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') return undefined;
    const auth = getAuth(initializeAdmin());
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
  console.error('Industrial Admin Error:', error);
  if (error.code === 'auth/email-already-exists') return 'Email address already registered.';
  if (error.code === 'permission-denied') return 'Security: Insufficient permissions.';
  return error.message || 'A secure server-side error occurred.';
}
