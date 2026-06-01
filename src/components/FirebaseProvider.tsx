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
  sendPasswordResetEmail,
  deleteUser
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

let isSigningUpUser = false;

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        if (isSigningUpUser) {
          // Skip expensive firestore writes and validations during the signup/approval flow itself.
          setUser(user);
          setLoading(false);
          return;
        }
        // Persist user data to Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data()?.active === false) {
            await auth.signOut();
            setAuthError('Sua conta está desativada. Entre em contato com seu administrador.');
            setUser(null);
            setLoading(false);
            return;
          }
          
          let photoURL = user.photoURL;
          let firestorePhotoURL = null;
          
          if (userDoc.exists()) {
            firestorePhotoURL = userDoc.data()?.photoURL || null;
            if (firestorePhotoURL && (firestorePhotoURL.startsWith('data:') || photoURL === 'firestore:photo' || !photoURL)) {
              photoURL = firestorePhotoURL;
            }
          }
          
          const userEmail = user.email?.toLowerCase().trim();
          const isDirector = userEmail === 'admin@email.com' || userEmail === 'sifcaires@gmail.com';
          
          let role: 'director' | 'landlord' | 'landlord_pleno' | 'broker' = isDirector ? 'director' : 'landlord';
          let ownerId: string | null = null;
          let isPreRegisteredActive = true;
          
          if (!isDirector && user.email) {
            try {
              if (userDoc.exists()) {
                const docData = userDoc.data();
                if (docData?.role) {
                  const existingRole = docData.role;
                  if (existingRole === 'landlord_pleno' || existingRole === 'landlord' || existingRole === 'director' || existingRole === 'broker') {
                    role = existingRole as any;
                  }
                }
                ownerId = docData?.ownerId || null;
              }
              
              if (!ownerId) {
                const landlordsRef = collection(db, 'landlords');
                const q = query(landlordsRef, where('email', '==', user.email.toLowerCase().trim()));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  const data = querySnapshot.docs[0].data();
                  ownerId = data?.ownerId || null;
                  role = 'landlord_pleno'; // default
                  if (ownerId) {
                    try {
                      const creatorDoc = await getDoc(doc(db, 'users', ownerId));
                      if (creatorDoc.exists()) {
                        const cData = creatorDoc.data();
                        const isCreatorDirector = cData?.role === 'director' || cData?.email === 'admin@email.com' || cData?.email === 'sifcaires@gmail.com';
                        if (isCreatorDirector) {
                          role = 'landlord';
                        }
                      }
                    } catch (creatorDocErr) {
                      console.warn('[FirebaseProvider] Failed to fetch creator document, falling back:', creatorDocErr);
                    }
                  } else {
                    role = 'landlord';
                  }
                  if (data?.active === false) {
                    isPreRegisteredActive = false;
                  }
                } else {
                  // Check if pre-registered as broker
                  const brokersRef = collection(db, 'brokers');
                  const qBroker = query(brokersRef, where('email', '==', user.email.toLowerCase().trim()));
                  const brokerSnapshot = await getDocs(qBroker);
                  if (!brokerSnapshot.empty) {
                    role = 'broker';
                    const data = brokerSnapshot.docs[0].data();
                    ownerId = data?.ownerId || null;
                    if (data?.active === false) {
                      isPreRegisteredActive = false;
                    }
                  }
                }
              }
            } catch (err) {
              console.error('[FirebaseProvider] Error checking landlord registration:', err);
              if (userDoc.exists()) {
                role = userDoc.data()?.role || role;
                ownerId = userDoc.data()?.ownerId || null;
              }
            }
          }
          
          const isActive = userDoc.exists() ? (userDoc.data()?.active !== false) : isPreRegisteredActive;
          
          if (!isActive) {
            await auth.signOut();
            setAuthError('Sua conta está desativada. Entre em contato com seu administrador.');
            setUser(null);
            setLoading(false);
            return;
          }
          
          const userData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: photoURL,
            lastLogin: new Date().toISOString(),
            role: role,
            ownerId: ownerId,
            active: isActive
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
            // Prevent overwriting the server-side role on login!
            // We omit the 'role' field from the merge payload so we never revert a manually edited role in Firestore.
            const { role: omittedRole, ...updatePayload } = firestoreWriteData;
            await setDoc(userDocRef, updatePayload, { merge: true });
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

          // Listen in real-time to this user's document for any role or details changes!
          unsubscribeUserDoc = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const liveData = snapshot.data();
              const liveRole = liveData?.role || role;
              const livePhoto = liveData?.photoURL || photoURL;
              const liveName = liveData?.displayName || user.displayName;

              const updatedCustomUser = Object.create(user);
              Object.defineProperty(updatedCustomUser, 'photoURL', {
                value: livePhoto,
                writable: true,
                configurable: true,
                enumerable: true
              });
              Object.defineProperty(updatedCustomUser, 'role', {
                value: liveRole,
                writable: true,
                configurable: true,
                enumerable: true
              });
              Object.defineProperty(updatedCustomUser, 'displayName', {
                value: liveName,
                writable: true,
                configurable: true,
                enumerable: true
              });
              setUser(updatedCustomUser);
            }
          });
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
      if (unsubscribeUserDoc) unsubscribeUserDoc();
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
    let createdUser: User | null = null;
    isSigningUpUser = true;
    try {
      const emailLower = email.toLowerCase().trim();
      const isDirector = emailLower === 'admin@email.com' || emailLower === 'sifcaires@gmail.com';
      
      // 1. Create the user authentication record first! This signs in the user locally.
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      createdUser = userCredential.user;
      await updateProfile(createdUser, { displayName: name });
      
      let isApproved = isDirector;
      let role: 'director' | 'landlord' | 'landlord_pleno' | 'broker' = 'landlord';
      let ownerId: string | null = null;
      
      let isPreRegisteredActive = true;
      if (isDirector) {
        role = 'director';
      } else {
        // Checking if the email is registered in Broker (corretor) or Landlord (locador)
        try {
          const brokersRef = collection(db, 'brokers');
          const qBroker = query(brokersRef, where('email', '==', emailLower));
          const brokerSnapshot = await getDocs(qBroker);
          
          const landlordsRef = collection(db, 'landlords');
          const qLandlord = query(landlordsRef, where('email', '==', emailLower));
          const landlordSnapshot = await getDocs(qLandlord);
          
          const hasBroker = !brokerSnapshot.empty;
          const hasLandlord = !landlordSnapshot.empty;
          
          if (hasLandlord) {
            isApproved = true;
            const data = landlordSnapshot.docs[0].data();
            ownerId = data?.ownerId || null;
            role = 'landlord_pleno'; // default
            if (ownerId) {
              try {
                const creatorDoc = await getDoc(doc(db, 'users', ownerId));
                if (creatorDoc.exists()) {
                  const cData = creatorDoc.data();
                  const isCreatorDirector = cData?.role === 'director' || cData?.email === 'admin@email.com' || cData?.email === 'sifcaires@gmail.com';
                  if (isCreatorDirector) {
                    role = 'landlord';
                  }
                }
              } catch (creatorDocErr) {
                console.warn('[signUpWithEmail] Failed to fetch creator document, falling back:', creatorDocErr);
              }
            } else {
              role = 'landlord';
            }
            if (data?.active === false) {
              isPreRegisteredActive = false;
            }
          } else if (hasBroker) {
            // Se tiver cadastro como Corretor, efetive o acesso como Corretor
            isApproved = true;
            role = 'broker';
            const data = brokerSnapshot.docs[0].data();
            ownerId = data?.ownerId || null;
            if (data?.active === false) {
              isPreRegisteredActive = false;
            }
          } else {
            // Se não tiver cadastro nenhum (nem de Locador nem de Corretor), desaprova para dar a mensagem
            isApproved = false;
          }
        } catch (err) {
          console.error('[signUpWithEmail] Error checking email registration:', err);
          // Delete created auth user if database check fails with an unexpected error
          if (createdUser) {
            try {
              await deleteUser(createdUser);
            } catch (delErr) {
              console.error('[signUpWithEmail] Error deleting auth user on check fail:', delErr);
            }
          }
          throw err;
        }
      }
      
      if (!isApproved) {
        // Delete the created authentication user before throwing the error!
        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch (delErr) {
            console.error('[signUpWithEmail] Error deleting unauthorized auth user:', delErr);
          }
        }
        throw new Error('Seu cadastro ainda não foi concluído, aguarde por 24 horas e tente novamente. Obrigado!');
      }

      if (!isPreRegisteredActive) {
        // Delete the created authentication user before throwing the error!
        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch (delErr) {
            console.error('[signUpWithEmail] Error deleting unauthorized auth user:', delErr);
          }
        }
        throw new Error('Sua conta está desativada. Entre em contato com seu administrador.');
      }
      
      // 3. Persist the user document with the resolved role to Firestore immediately!
      const userDocRef = doc(db, 'users', createdUser.uid);
      await setDoc(userDocRef, {
        uid: createdUser.uid,
        displayName: name,
        email: emailLower,
        role: role,
        ownerId: ownerId,
        active: isPreRegisteredActive,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Reload user record to update local profile displayName
      await createdUser.reload();

      // Configure user with roles as expected in the state
      const customUser = Object.create(createdUser);
      Object.defineProperty(customUser, 'photoURL', {
        value: createdUser.photoURL,
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
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      isSigningUpUser = false;
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
      const currentRole = userDoc.exists() ? (userDoc.data()?.role || 'landlord') : 'landlord';
      
      const customUser = Object.create(currentUser);
      Object.defineProperty(customUser, 'photoURL', {
        value: photoURL,
        writable: true,
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(customUser, 'role', {
        value: currentRole,
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
      const userDocRef = doc(db, 'users', reloadedUser.uid);
      const userDoc = await getDoc(userDocRef);
      const currentRole = userDoc.exists() ? (userDoc.data()?.role || 'landlord') : 'landlord';

      const customUser = Object.create(reloadedUser);
      Object.defineProperty(customUser, 'photoURL', {
        value: downloadURL,
        writable: true,
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(customUser, 'role', {
        value: currentRole,
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
    
    let resolvedError = '';
    if (errorCode === 'auth/configuration-not-found') {
      resolvedError = 'O login não está ativado no Console do Firebase.';
    } else if (errorCode === 'auth/unauthorized-domain') {
      resolvedError = 'Domínio não autorizado no Console do Firebase.';
    } else if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
      resolvedError = 'Este e-mail já está em uso.';
    } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
      resolvedError = 'A senha é muito fraca (mínimo 6 caracteres).';
    } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials' || errorMessage.includes('auth/invalid-credential')) {
      resolvedError = 'Email ou senha inválidos.';
    } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('auth/invalid-email')) {
      resolvedError = 'O formato do e-mail é inválido.';
    } else if (errorCode === 'auth/operation-not-allowed') {
      resolvedError = 'Este método de login não está habilitado.';
    } else if (errorCode === 'auth/too-many-requests') {
      resolvedError = 'Muitas tentativas falhas. Tente novamente mais tarde.';
    } else if (errorCode === 'auth/popup-closed-by-user') {
      // Don't show error if user just closed the popup
      return;
    } else {
      // If it's a Firebase error but not specifically handled, try to clean the message
      const cleanMessage = errorMessage.replace('Firebase: ', '').replace('Error (', '').replace(').', '');
      resolvedError = cleanMessage || `Erro inesperado: ${errorCode || 'desconhecido'}`;
    }
    
    setAuthError(resolvedError);
    toast.error(resolvedError, { duration: 6000 });
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
