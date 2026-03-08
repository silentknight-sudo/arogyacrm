import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Specifically engineered to handle Vercel's environment variable formats.
 * Detects literal \n strings, removes wrapping quotes, and aligns PEM headers.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  let cleaned = key.trim();

  // 1. Remove wrapping quotes if present (common dashboard artifact)
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // 2. Convert literal "\n" character sequences into actual newlines
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 3. Force proper PEM framing to prevent parser rejection
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  if (!cleaned.includes(header)) cleaned = `${header}\n${cleaned}`;
  if (!cleaned.includes(footer)) cleaned = `${cleaned}\n${footer}`;

  // 4. Ensure no double-headers/footers were created
  cleaned = cleaned.replace(new RegExp(`(${header}\\s*)+`, 'g'), `${header}\n`);
  cleaned = cleaned.replace(new RegExp(`(\\s*${footer})+`, 'g'), `\n${footer}`);

  return cleaned;
}

/**
 * INDUSTRIAL ON-DEMAND INITIALIZER
 * Prevents build-time crashes by deferring SDK setup until the first runtime call.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');
    throw new Error(`MISSING_ENVIRONMENT_VARIABLES: ${missing.join(', ')}. Check Vercel project settings.`);
  }

  try {
    const privateKey = formatPrivateKey(rawPrivateKey);
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } catch (error: any) {
    console.error('CRITICAL_ADMIN_INIT_FAILURE:', error.message);
    throw error;
  }
}

/**
 * LAZY PROXY SYSTEM
 * Explicitly blocks Promise-like lookups to prevent Next.js from stalling during build.
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

export function handleAdminSDKError(error: any): string {
  console.error('Admin SDK Operation Failed:', error);
  if (error.message?.includes('private key')) return 'Secure Key Error: Ensure FIREBASE_PRIVATE_KEY is correct in Vercel.';
  if (error.code === 'permission-denied') return 'Security Error: Insufficient service account permissions.';
  return error.message || 'A server-side error occurred.';
}
