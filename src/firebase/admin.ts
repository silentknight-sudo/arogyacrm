import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Optimized for handling multi-line keys, escaped characters, and literal \n sequences.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  let cleaned = key.trim();
  
  // Multi-pass sanitation for escaped newline characters
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\\\n/g, '\n');
  
  // Remove accidental wrapping quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  // Ensure headers are present but not duplicated
  if (!cleaned.includes(header)) cleaned = `${header}\n${cleaned}`;
  if (!cleaned.includes(footer)) cleaned = `${cleaned}\n${footer}`;

  return cleaned;
}

function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('CRITICAL_ENVIRONMENT_ERROR: Admin credentials missing.');
  }

  try {
    const privateKey = formatPrivateKey(rawPrivateKey);
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } catch (error: any) {
    console.error('FIREBASE_ADMIN_INIT_FAILURE:', error.message);
    throw new Error(`FIREBASE_ADMIN_INIT_ERROR: ${error.message}`);
  }
}

/**
 * LAZY PROXY SINGLETON
 * Prevents build-time execution and ensures stable singleton access.
 */
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
      return undefined;
    }
    const db = getFirestore(initializeAdmin());
    const value = (db as any)[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
      return undefined;
    }
    const auth = getAuth(initializeAdmin());
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

export { FieldValue };
export const serverTimestamp = () => FieldValue.serverTimestamp();

export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  const msg = error.message || '';
  if (msg.includes('private key') || msg.includes('PEM')) {
    return 'Secure Key Parsing Error: Private Key formatting is invalid.';
  }
  return msg || 'A secure server-side operation failed.';
}
