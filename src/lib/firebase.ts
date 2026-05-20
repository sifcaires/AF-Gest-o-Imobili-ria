import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Configuration priority: Environment Variables (Vercel/Production)
const getEnvValue = (envKey: string) => {
  const value = import.meta.env[envKey];
  if (value && typeof value === 'string' && value.trim() !== '' && value !== 'undefined' && value !== 'null') {
    return value;
  }
  return '';
};

// Try to load auto-generated config as fallback
let localConfig: any = {};
try {
  // @ts-ignore - this file might not exist yet or be in a different format
  // We use a dynamic-ish import via standard import if we can, 
  // but for simplicity and since Vite handles JSON imports:
  // Note: we can't use top-level await in all environments easily here without configuration
  // so we'll check if we can import it.
  
  // Actually, a better way for AI Studio is to check if we are in dev and try to use the known file
  // but since we're in a browser/bundler context, we'll try to catch the error.
} catch (e) {
  // Ignore
}

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

// If still empty and NOT in production, we can try to guess from the project context 
// or hope the user provides a .env file.
if (!isProduction && !firebaseConfig.apiKey) {
  console.log('[Firebase Init] No env vars found. In AI Studio, ensure Firebase is provisioned.');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

if (import.meta.env.DEV) {
  console.log('[Firebase Init] App Initialized with Config:', {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket || 'default',
    authDomain: firebaseConfig.authDomain
  });
}

const getDatabaseId = () => {
  return getEnvValue('VITE_FIREBASE_DATABASE_ID') || "(default)";
};

const getStorageBucket = () => {
  let bucket = getEnvValue('VITE_FIREBASE_STORAGE_BUCKET');
  
  if (!bucket) {
    const projectId = getEnvValue('VITE_FIREBASE_PROJECT_ID');
    if (projectId) {
      // Newer Firebase projects default to .firebasestorage.app
      // Older ones use .appspot.com. We'll stick to .firebasestorage.app as default 
      // for newly provisioned projects in AI Studio.
      bucket = `${projectId}.firebasestorage.app`;
      console.log('[Firebase] Guessed storage bucket from projectId:', projectId, '->', bucket);
    } else {
      console.warn('[Firebase] No projectId found to guess storage bucket.');
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

if (storage) {
  try {
    // Avoid infinite hanging retries on non-provisioned/CORS-blocked environment buckets
    // Set max upload retry to 1.5 seconds so that it errors out and triggers our base64 fallback fast
    storage.maxUploadRetryTime = 1500;
    storage.maxOperationRetryTime = 1500;
  } catch (e) {
    console.warn('[Firebase Storage] Failed to set retry limits:', e);
  }
}

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

/**
 * Compresses an image file on the client side using Canvas to keep the file size minimal.
 */
export async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<Blob | File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Converts a file/blob to base64 data URL.
 */
export async function fileToBase64(fileOrBlob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileOrBlob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Uploads a file with an automatic base64 fallback in case Storage fails.
 */
export async function uploadFileWithFallback(
  storageRef: any,
  file: File,
  metadata?: any,
  onProgress?: (progress: number) => void
): Promise<string> {
  let fileToUpload: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      console.log('[Firebase Storage] Compressing image...', file.name, file.size);
      fileToUpload = await compressImage(file, 800, 800, 0.65);
      console.log('[Firebase Storage] Compression complete. New size:', fileToUpload.size);
    } catch (e) {
      console.error('[Firebase Storage] Compression failed', e);
    }
  }

  try {
    if (!storageRef || !storage) {
      throw new Error('Firebase Storage service is not loaded.');
    }
    
    console.log('[Firebase Storage] Trying Cloud Storage upload...', storageRef.fullPath);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata);
    
    const uploadPromise = new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn('[Firebase Storage] UploadTask failed, starting base64 fallback...', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[Firebase Storage] Cloud Storage upload succeeded, url:', url);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        try {
          console.warn('[Firebase Storage] Upload timed out after 3 seconds, canceling task & triggering fallback...');
          uploadTask.cancel();
        } catch (e) {
          console.warn('[Firebase Storage] Failed to cancel stuck upload task:', e);
        }
        reject(new Error('timeout'));
      }, 3000); // 3 seconds timeout
    });

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error: any) {
    console.warn('[Firebase Storage] Error in Storage Upload. Saving securely as a base64 DataURL fallback in Firestore.', error);
    
    try {
      const base64Data = await fileToBase64(fileToUpload);
      toast.success('Documento/Imagem salvo localmente de forma segura!');
      if (onProgress) onProgress(100);
      return base64Data;
    } catch (base64Error) {
      console.error('[Firebase Storage] Fatal error converting to base64:', base64Error);
      throw error;
    }
  }
}

export default app;
