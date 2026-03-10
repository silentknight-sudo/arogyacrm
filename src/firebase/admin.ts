import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Firestore as AdminFirestore } from 'firebase-admin/firestore';

/**
 * HYPER-RESILIENT PEM PARSER
 * Handles multi-line keys, escaped characters, and literal \n sequences.
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  let cleaned = key.trim();
  
  // Handle literal \n strings and double-escaped sequences
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\\\n/g, '\n');
  
  // Remove accidental wrapping quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  // Ensure headers are present and properly formatted
  if (!cleaned.includes(header)) {
    cleaned = `${header}\n${cleaned}`;
  }
  if (!cleaned.includes(footer)) {
    cleaned = `${cleaned}\n${footer}`;
  }

  return cleaned;
}

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error('CRITICAL_ENVIRONMENT_ERROR: Admin credentials missing from environment. Verify FIREBASE_PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY.');
  }

  try {
    const privateKey = formatPrivateKey(rawPrivateKey);
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    return adminApp;
  } catch (error: any) {
    console.error('FIREBASE_ADMIN_INIT_FAILURE:', error.message);
    throw new Error(`FIREBASE_ADMIN_INIT_ERROR: ${error.message}`);
  }
}

/**
 * LAZY PROXY FACTORY
 * Prevents Next.js from evaluating the SDK during the build phase.
 * Blocks promise-like properties to prevent "Grant Access" loops.
 */
function createLazyProxy<T extends object>(initializer: () => T): T {
  return new Proxy({} as T, {
    get(target, prop, receiver) {
      if (prop === 'then' || prop === 'toJSON' || prop === 'constructor') {
        return undefined;
      }
      return Reflect.get(initializer(), prop, receiver);
    }
  });
}

/**
 * SINGLETON ACCESSORS (LAZY)
 * These objects are now Proxies that only initialize Firebase when a property is accessed.
 */
export const adminDb = createLazyProxy(() => getFirestore(getAdminApp()));
export const adminAuth = createLazyProxy(() => getAuth(getAdminApp()));

export { FieldValue };
export const serverTimestamp = () => FieldValue.serverTimestamp();

export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  const msg = error.message || '';
  if (msg.includes('private key') || msg.includes('PEM') || msg.includes('digest')) {
    return 'Secure Authentication Error: Private Key formatting is invalid or SDK failed to initialize.';
  }
  return msg || 'A secure server-side operation failed.';
}
