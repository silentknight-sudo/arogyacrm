import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Engineered to handle service account keys from various environment formats (Vercel, Local, JSON).
 * Detects literal \n strings, handles double-escaped backslashes, and aligns PEM headers.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  let cleaned = key.trim();

  // 1. Remove wrapping quotes if present (common in dashboard pastes)
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // 2. Convert literal "\n" sequences into true newline characters
  // We do this twice to handle potential double-escaping
  cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');

  // 3. Force proper PEM framing to prevent "Invalid PEM" errors
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  // Ensure headers are present exactly once and properly formatted
  if (!cleaned.includes(header)) cleaned = `${header}\n${cleaned}`;
  if (!cleaned.includes(footer)) cleaned = `${cleaned}\n${footer}`;

  // Cleanup any accidental double-headers or noise introduced by concat
  cleaned = cleaned.replace(new RegExp(`(${header}\\s*)+`, 'g'), `${header}\n`);
  cleaned = cleaned.replace(new RegExp(`(\\s*${footer})+`, 'g'), `\n${footer}`);

  return cleaned;
}

/**
 * INDUSTRIAL ON-DEMAND INITIALIZER
 * Prevents build-time crashes by deferring SDK setup until the first runtime call.
 * Bypasses credential checks during the Next.js build phase.
 */
function initializeAdmin(): App {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Critical health check for the environment
  if (!projectId || !clientEmail || !rawPrivateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missing.push('FIREBASE_PRIVATE_KEY');
    throw new Error(`CRITICAL_ENVIRONMENT_ERROR: Missing variables (${missing.join(', ')}). Initialization aborted.`);
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
    // BLOCK BUILD-PHASE PROBING
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
    // BLOCK BUILD-PHASE PROBING
    if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
      return undefined;
    }
    const auth = getAuth(initializeAdmin());
    const value = (auth as any)[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  }
});

export { FieldValue };

/**
 * Robust error handler for server-side CRM operations.
 */
export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  const msg = error.message || '';
  
  if (msg.includes('private key') || msg.includes('PEM')) {
    return 'Secure Key Error: The Firebase Private Key formatting is invalid. Check PEM headers and escaped newlines.';
  }
  
  if (error.code === 'permission-denied') {
    return 'Authorization Error: The service account has insufficient permissions for this action.';
  }
  
  return msg || 'A secure server-side operation failed.';
}
