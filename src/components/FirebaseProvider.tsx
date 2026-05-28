import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref } from 'firebase/storage';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, storage, db, handleFirestoreError, OperationType, uploadFileWithFallback } from '../lib/firebase';
import { toast } from 'sonner';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  appLogo: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  updateUserPhoto: (file: File) => Promise<string>;
  updateAppLogo: (file: File) => Promise<string>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Persist user data to Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let photoURL = user.photoURL;
          let firestorePhotoURL = null;
          
          if (userDoc.exists()) {
            firestorePhotoURL = userDoc.data()?.photoURL || null;
            if (firestorePhotoURL && (firestorePhotoURL.startsWith('data:') || photoURL === 'firestore:photo' || !photoURL)) {
              photoURL = firestorePhotoURL;
            }
          }
          
          const isDirector = user.email === 'admin@email.com' || user.email === 'sifcaires@gmail.com';
          
          let role: 'director' | 'landlord' | 'landlord_pleno' = isDirector ? 'director' : 'landlord';
          
          if (!isDirector && user.email) {
            try {
              const landlordsRef = collection(db, 'landlords');
              const q = query(landlordsRef, where('email', '==', user.email.toLowerCase().trim()));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                role = 'landlord_pleno';
              } else if (userDoc.exists()) {
                const existingRole = userDoc.data()?.role;
                if (existingRole === 'landlord_pleno' || existingRole === 'landlord' || existingRole === 'director') {
                  role = existingRole;
                }
              }
            } catch (err) {
              console.error('[FirebaseProvider] Error checking landlord registration:', err);
              if (userDoc.exists()) {
                role = userDoc.data()?.role || role;
              }
            }
          }
          
          const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: photoURL,
            lastLogin: new Date().toISOString(),
            role: role
          };

          const firestoreWriteData = { ...userData };
          if (user.photoURL === 'firestore:photo' && firestorePhotoURL) {
            firestoreWriteData.photoURL = firestorePhotoURL;
          }

          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              ...firestoreWriteData,
              createdAt: new Date().toISOString(),
            });
          } else {
            await setDoc(userDocRef, firestoreWriteData, { merge: true });
          }

          const customUser = Object.create(user);
          Object.defineProperty(customUser, 'photoURL', {
            value: photoURL,
            writable: true,
            configurable: true,
            enumerable: true
          });
          Object.defineProperty(customUser, 'role', {
            value: role,
            writable: true,
            configurable: true,
            enumerable: true
          });
          setUser(customUser);
        } catch (error) {
          console.error('[FirebaseProvider] Error persisting user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Subscrição para o logo do app
    const unsubscribeLogo = onSnapshot(doc(db, 'settings', 'app'), (doc) => {
      if (doc.exists()) {
        const logoUrl = doc.data().logoUrl || null;
        console.log('[FirebaseProvider] Logo URL updated:', logoUrl);
        setAppLogo(logoUrl);
      }
    }, (error) => {
      // Don't show error toast for public settings if not authenticated yet or if it's the first load
      // The rules allow public read, so this should not happen now.
      console.warn('Settings snapshot error:', error);
      handleFirestoreError(error, OperationType.GET, 'settings/app');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeLogo();
    };
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

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      // Force user object refresh
      await auth.currentUser.reload();
      
      const currentUser = auth.currentUser;
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const photoURL = userDoc.exists() ? (userDoc.data()?.photoURL || currentUser.photoURL) : currentUser.photoURL;
      
      const customUser = Object.create(currentUser);
      Object.defineProperty(customUser, 'photoURL', {
        value: photoURL,
        writable: true,
        configurable: true,
        enumerable: true
      });
      setUser(customUser);
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
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const metadata = { contentType: file.type };
      
      const downloadURL = await uploadFileWithFallback(storageRef, file, metadata);
      const isBase64 = downloadURL.startsWith('data:');
      
      if (isBase64) {
        console.log('[FirebaseProvider] Profile photo is base64, storing directly in Firestore.');
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });
        
        await updateProfile(auth.currentUser, { photoURL: 'firestore:photo' });
      } else {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });
      }
      
      // Force user object refresh
      await auth.currentUser.reload();
      
      const reloadedUser = auth.currentUser;
      const customUser = Object.create(reloadedUser);
      Object.defineProperty(customUser, 'photoURL', {
        value: downloadURL,
        writable: true,
        configurable: true,
        enumerable: true
      });
      setUser(customUser);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      handleFirestoreError(error, OperationType.WRITE, 'profiles/photo');
      throw error;
    }
  };

  const updateAppLogo = async (file: File): Promise<string> => {
    try {
      const storageRef = ref(storage, `brand/logo_${Date.now()}_${file.name}`);
      const metadata = { contentType: file.type };
      
      const downloadURL = await uploadFileWithFallback(storageRef, file, metadata);
      
      await setDoc(doc(db, 'settings', 'app'), { 
        logoUrl: downloadURL,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid || 'system'
      }, { merge: true });
      
      setAppLogo(downloadURL);
      return downloadURL;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app');
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
    
    console.error('[Auth Error Debug]', { errorCode, errorMessage, fullError: error });
    
    if (errorCode === 'auth/configuration-not-found') {
      setAuthError('O login não está ativado no Console do Firebase.');
    } else if (errorCode === 'auth/unauthorized-domain') {
      setAuthError('Domínio não autorizado no Console do Firebase.');
    } else if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
      setAuthError('Este e-mail já está em uso.');
    } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
      setAuthError('A senha é muito fraca (mínimo 6 caracteres).');
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials' || errorMessage.includes('auth/invalid-credential')) {
      setAuthError('Email ou senha inválidos.');
    } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('auth/invalid-email')) {
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
      appLogo,
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      sendPasswordReset,
      updateEmail,
      updateUserProfile,
      updateUserPhoto,
      updateAppLogo,
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
