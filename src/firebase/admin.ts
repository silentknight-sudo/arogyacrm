import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Specifically engineered to handle service account keys from various environment formats.
 * Corrects literal \n strings, double-escaped backslashes, and malformed boundaries.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // 1. Remove wrapping quotes and excessive whitespace
  let cleaned = key.trim().replace(/^['"]+|['"]+$/g, '');

  // 2. Resolve literal "\n" character sequences (from dashboards or JSON pasting)
  // We use a global regex to catch all instances.
  cleaned = cleaned.replace(/\\n/g, '\n');

  // 3. Ensure the PEM headers/footers are present and correctly separated
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  // If the key was pasted without headers, wrap it.
  if (!cleaned.includes(header)) cleaned = `${header}\n${cleaned}`;
  if (!cleaned.includes(footer)) cleaned = `${cleaned}\n${footer}`;

  // 4. Final normalization of newlines
  cleaned = cleaned.replace(/\n\n+/g, '\n');

  return cleaned;
}

/**
 * INDUSTRIAL ON-DEMAND INITIALIZER
 * Prevents build-time crashes and "Error 500" loops by deferring setup.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Diagnostics for troubleshooting
  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');
    
    throw new Error(`CRITICAL_ENVIRONMENT_ERROR: Missing variables [${missing.join(', ')}].`);
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
 * LAZY PROXY SYSTEM
 * Explicitly blocks Promise-like lookups (then, toJSON) to prevent Next.js from
 * mistaking the SDK for a Promise during the build process.
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

export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  const msg = error.message || '';
  if (msg.includes('private key') || msg.includes('PEM')) {
    return 'Secure Key Error: The Firebase Private Key formatting is invalid. Check your environment variables.';
  }
  return msg || 'A secure server-side operation failed.';
}
