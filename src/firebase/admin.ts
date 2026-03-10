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
    // Return null to allow the Lazy Proxy to handle the missing state gracefully during build
    return null as any;
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
    return null as any;
  }
}

/**
 * LAZY PROXY FACTORY
 * Prevents Next.js from evaluating the SDK during the build phase.
 * Blocks promise-like properties to prevent "Grant Access" loops.
 */
function createLazyProxy<T extends object>(initializer: () => T, name: string): T {
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
          const missing = [];
          if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
          if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
          if (!process.env.FIREBASE_PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');
          
          throw new Error(`CRITICAL_ENVIRONMENT_ERROR: ${name} credentials missing [${missing.join(', ')}]. Verify your environment variables in the hosting dashboard.`);
        };
      }

      return Reflect.get(instance, prop, receiver);
    }
  });
}

export const adminDb = createLazyProxy(() => {
  const app = getAdminApp();
  return app ? getFirestore(app) : null as any;
}, 'adminDb');

export const adminAuth = createLazyProxy(() => {
  const app = getAdminApp();
  return app ? getAuth(app) : null as any;
}, 'adminAuth');

export { FieldValue };
export const serverTimestamp = () => FieldValue.serverTimestamp();

export function handleAdminSDKError(error: any): string {
  console.error('CRM_ADMIN_SDK_ERROR:', error);
  const msg = error.message || '';
  if (msg.includes('ENVIRONMENT_ERROR')) {
    return msg; // Pass through the specific missing variables message
  }
  if (msg.includes('private key') || msg.includes('PEM')) {
    return 'Configuration Error: Invalid private key format. Ensure the entire block is pasted correctly.';
  }
  return msg || 'A secure server-side operation failed.';
}
