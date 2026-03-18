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
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\\\n/g, '\n');
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';

  if (!cleaned.includes(header)) {
    cleaned = `${header}\n${cleaned}`;
  }
  if (!cleaned.includes(footer)) {
    cleaned = `${cleaned}\n${footer}`;
  }

  return cleaned;
}

let adminApp: App | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  try {
    if (projectId && clientEmail && rawPrivateKey) {
      const privateKey = formatPrivateKey(rawPrivateKey);
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
      return adminApp;
    }

    // Fallback to ADC (Application Default Credentials) for native Firebase environments
    adminApp = initializeApp();
    return adminApp;
  } catch (error: any) {
    console.warn('ADMIN_INIT_DEFERRED: Credentials missing or invalid. Deployment builds should defer init.');
    return null;
  }
}

/**
 * LAZY PROXY FACTORY
 * Prevents Next.js from evaluating the SDK during the build phase.
 */
function createLazyProxy<T extends object>(initializer: () => T | null, name: string): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(target, prop, receiver) {
      if (prop === 'then' || prop === 'toJSON' || prop === 'constructor' || prop === '$$typeof') {
        return undefined;
      }
      
      if (!instance) {
        instance = initializer();
      }

      if (!instance) {
        return (...args: any[]) => {
          throw new Error(`CRITICAL_ENVIRONMENT_ERROR: ${name} credentials missing. Ensure you have set FIREBASE_PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY.`);
        };
      }

      return Reflect.get(instance, prop, receiver);
    }
  });
}

export const adminDb = createLazyProxy(() => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}, 'adminDb');

export const adminAuth = createLazyProxy(() => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}, 'adminAuth');

export { FieldValue };
export const serverTimestamp = () => FieldValue.serverTimestamp();

export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  return error.message || 'A secure server-side operation failed.';
}
