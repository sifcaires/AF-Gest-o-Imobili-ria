import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Configuration priority: Environment Variables (Vercel/Production) > local config file (AI Studio)
const getEnvValue = (envKey: string, localValue: any) => {
  const value = import.meta.env[envKey];
  // Check for empty strings, 'undefined' string, or null
  if (value && typeof value === 'string' && value.trim() !== '' && value !== 'undefined' && value !== 'null') {
    return value;
  }
  return localValue;
};

const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY', firebaseConfigLocal.apiKey),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN', firebaseConfigLocal.authDomain),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID', firebaseConfigLocal.projectId),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET', firebaseConfigLocal.storageBucket),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfigLocal.messagingSenderId),
  appId: getEnvValue('VITE_FIREBASE_APP_ID', firebaseConfigLocal.appId),
};

// Diagnostic logging - helpful for debugging configuration mismatches
const isProduction = import.meta.env.PROD;
const isMismatch = firebaseConfig.projectId !== firebaseConfigLocal.projectId;

console.log(`[Firebase Init] Project ID: ${firebaseConfig.projectId} (${isMismatch ? 'Custom Environment Variable' : 'Default AI Studio Config'})`);

if (!firebaseConfig.apiKey) {
  console.error('[Firebase Init] CRITICAL: API Key is missing! Auth will fail.');
}

if (isMismatch) {
  console.warn(`[Firebase Init] Warning: You are using a custom project (${firebaseConfig.projectId}) instead of the auto-provisioned one (${firebaseConfigLocal.projectId}). Ensure ALL VITE_FIREBASE_* environment variables are set correctly for your project.`);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

// Help system diagnose and fix security rules issues
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const serializedError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serializedError);
  throw new Error(serializedError);
}

export default app;
