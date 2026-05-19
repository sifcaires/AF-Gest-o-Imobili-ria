import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration priority: Environment Variables (Vercel/Production)
const getEnvValue = (envKey: string) => {
  const value = import.meta.env[envKey];
  if (value && typeof value === 'string' && value.trim() !== '' && value !== 'undefined' && value !== 'null') {
    return value;
  }
  return '';
};

// We create the config object. In production, these MUST come from env vars.
const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvValue('VITE_FIREBASE_APP_ID'),
};

const isProduction = import.meta.env.PROD;

if (isProduction && !firebaseConfig.apiKey) {
  console.warn('[Firebase Init] MISSION ACTION REQUIRED: Firebase Environment Variables are not set. Go to Vercel Project Settings > Environment Variables and add VITE_FIREBASE_API_KEY, etc.');
}

// In development, if env vars are missing, we try to fetch the auto-generated config
// but we do it in a way that doesn't break the build if the file is missing.
if (!isProduction && !firebaseConfig.apiKey) {
  console.log('[Firebase Init] No env vars found, checking for local config...');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const getDatabaseId = () => {
  return import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)";
};

const getStorageBucket = () => {
  let bucket = getEnvValue('VITE_FIREBASE_STORAGE_BUCKET');
  
  if (!bucket) {
    const projectId = getEnvValue('VITE_FIREBASE_PROJECT_ID');
    if (projectId) {
      bucket = `${projectId}.firebasestorage.app`;
      console.log('[Firebase] Guessing storage bucket from project ID:', bucket);
    } else {
      return undefined;
    }
  }

  // Remove gs:// prefix if present
  bucket = bucket.replace(/^gs:\/\//, '');
  // Remove trailing slashes
  bucket = bucket.replace(/\/+$/, '');
  
  if (bucket) {
    console.log('[Firebase] Using storage bucket:', bucket);
  }
  
  return bucket;
};

const storageBucket = getStorageBucket();
export const db = getFirestore(app, getDatabaseId());
export const auth = getAuth(app);
export const storage = storageBucket ? getStorage(app, storageBucket) : getStorage(app);

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
    console.error('Firebase Error: ', serializedError);
  }
  
  // Show a user-friendly toast based on common errors
  const message = error instanceof Error ? error.message : String(error);
  const isStorageError = message.toLowerCase().includes('storage') || (error as any)?.code?.startsWith('storage/');

  if (message.includes('permission-denied') || message.includes('insufficient permissions') || (error as any)?.code === 'storage/unauthorized') {
    toast.error('Acesso negado. Verifique as permissões de acesso (Firestore/Storage).');
  } else if (message.includes('not-found') || (error as any)?.code === 'storage/object-not-found') {
    toast.error('Registro ou arquivo não encontrado.');
  } else if (message.includes('retry-limit-exceeded') || (isStorageError && message.includes('retry'))) {
    toast.error('Erro de conexão com o Firebase Storage. Possível bucket inexistente ou erro de CORS.');
    console.error('[Storage Error] Bucket used:', getStorageBucket());
  } else if (message.includes('project-not-found')) {
    toast.error('Projeto Firebase não encontrado. Verifique suas chaves de API.');
  } else {
    toast.error('Erro no servidor: ' + message);
  }

  throw new Error(serializedError);
}

export default app;
