import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Industrial-grade private key formatter for Vercel.
 * Handles escaped newlines, quotes, and whitespace.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // Replace literal \n strings with real newline characters
  let formatted = key.replace(/\\n/g, '\n');
  
  // Remove any wrapping double quotes added by environment editors
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.substring(1, formatted.length - 1);
  }
  
  return formatted.trim();
}

/**
 * Robust Admin SDK Initializer for Serverless/Vercel.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error(
      `Firebase Admin SDK: Configuration missing. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in Vercel.`
    );
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
 * Prevents crashes during build/SSR by initializing only when called.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    // Explicitly block properties that Next.js/React might check during build/hydration
    if (prop === 'then' || prop === 'constructor' || prop === 'toJSON' || prop === '$$typeof') {
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
  get(_, prop) {
    if (prop === 'then' || prop === 'constructor' || prop === 'toJSON' || prop === '$$typeof') {
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
