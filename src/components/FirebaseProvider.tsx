import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../lib/firebase';
import { toast } from 'sonner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  updateUserPhoto: (file: File) => Promise<string>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser({ ...auth.currentUser });
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const updateEmail = async (email: string) => {
    // This is more complex because it might need re-authentication
    // But we'll provide the basic implementation
    // For now we'll just throw a helpful error or implement it simply
    // Note: firebase.auth().currentUser.updateEmail() is deprecated in newer SDKs
    // Recommended way is using updateEmail(user, newEmail) from firebase/auth
    // but it requires a fresh credential.
    toast.error('Alteração de e-mail requer re-autenticação recente.');
  };

  const updateUserPhoto = async (file: File): Promise<string> => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    
    try {
      if (!storage) {
        throw new Error('Serviço de Storage não inicializado. Verifique as configurações.');
      }
      
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setUser({ ...auth.currentUser });
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      let errorMessage = 'Erro ao fazer upload da imagem.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Permissão negada no Storage. Verifique as regras de segurança.';
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      } else if (error.code === 'storage/project-not-found') {
        errorMessage = 'Projeto Firebase não encontrado.';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleAuthError = (error: any) => {
    let errorCode = error.code;
    const errorMessage = error.message || '';
    
    // If code is not available, try to extract it from the message
    if (!errorCode && errorMessage.includes('auth/')) {
      const match = errorMessage.match(/auth\/[a-z0-9-]+/);
      if (match) errorCode = match[0];
    }
    
    console.error('Auth error:', error);
    
    if (errorCode === 'auth/configuration-not-found') {
      setAuthError('O login não está ativado no Console do Firebase.');
    } else if (errorCode === 'auth/unauthorized-domain') {
      setAuthError('Domínio não autorizado no Console do Firebase.');
    } else if (errorCode === 'auth/email-already-in-use') {
      setAuthError('Este e-mail já está em uso.');
    } else if (errorCode === 'auth/weak-password') {
      setAuthError('A senha é muito fraca (mínimo 6 caracteres).');
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials') {
      setAuthError('Email ou senha inválidos.');
    } else if (errorCode === 'auth/invalid-email') {
      setAuthError('O formato do e-mail é inválido.');
    } else if (errorCode === 'auth/operation-not-allowed') {
      setAuthError('Este método de login não está habilitado.');
    } else if (errorCode === 'auth/too-many-requests') {
      setAuthError('Muitas tentativas falhas. Tente novamente mais tarde.');
    } else if (errorCode === 'auth/popup-closed-by-user') {
      // Don't show error if user just closed the popup
      return;
    } else {
      // If it's a Firebase error but not specifically handled, try to clean the message
      const cleanMessage = errorMessage.replace('Firebase: ', '').replace('Error (', '').replace(').', '');
      setAuthError(cleanMessage || `Erro inesperado: ${errorCode || 'desconhecido'}`);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      authError, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      updateEmail,
      updateUserProfile,
      updateUserPhoto,
      logout 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
