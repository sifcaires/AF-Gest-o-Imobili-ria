import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Configuration priority: Environment Variables (Vercel/Production) > local config file (AI Studio - Dev Only)
const getEnvValue = (envKey: string, localKey: keyof typeof firebaseConfigLocal) => {
  const value = import.meta.env[envKey];
  if (value && typeof value === 'string' && value.trim() !== '' && value !== 'undefined' && value !== 'null') {
    return value;
  }
  // Only fallback to JSON in development
  return import.meta.env.DEV ? firebaseConfigLocal[localKey] : '';
};

const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY', 'apiKey'),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID', 'projectId'),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'),
  appId: getEnvValue('VITE_FIREBASE_APP_ID', 'appId'),
};

// Diagnostic logging - only in development
const isProduction = import.meta.env.PROD;
const isMismatch = firebaseConfig.projectId !== firebaseConfigLocal.projectId;

if (!isProduction) {
  console.log(`[Firebase Init] Project ID: ${firebaseConfig.projectId} (${isMismatch ? 'Custom Environment Variable' : 'Default AI Studio Config'})`);
  console.log(`[Firebase Init] Auth Domain: ${firebaseConfig.authDomain}`);
}

if (!firebaseConfig.apiKey) {
  console.error('[Firebase Init] CRITICAL: API Key is missing! Auth will fail.');
}

if (!isProduction && isMismatch) {
  console.warn(`[Firebase Init] Warning: You are using a custom project (${firebaseConfig.projectId}) instead of the auto-provisioned one (${firebaseConfigLocal.projectId}).`);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const getDatabaseId = () => {
  const envId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
  if (envId) return envId;
  return import.meta.env.DEV ? firebaseConfigLocal.firestoreDatabaseId || "(default)" : "(default)";
};

export const db = getFirestore(app, getDatabaseId());
export const auth = getAuth(app);
export const storage = getStorage(app, firebaseConfig.storageBucket || undefined);

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

import { toast } from 'sonner';

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
  if (import.meta.env.DEV) {
    console.error('Firestore Error: ', serializedError);
  }
  
  // Show a user-friendly toast based on common errors
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('permission-denied') || message.includes('insufficient permissions')) {
    toast.error('Acesso negado. Você não tem permissão para esta operação.');
  } else if (message.includes('not-found')) {
    toast.error('Registro não encontrado.');
  } else {
    toast.error('Erro no servidor: ' + message);
  }

  throw new Error(serializedError);
}

export default app;
