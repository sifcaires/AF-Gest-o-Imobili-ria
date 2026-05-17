import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Validate connection as per critical directive in SKILL.md
        try {
          await getDocFromServer(doc(db, '_connection_test', 'check'));
        } catch (e) {
          console.warn('Firebase connection test (expected failure if doc missing):', e);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    try {
      console.log('Attempting sign in from domain:', window.location.hostname);
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorCode = error.code;
      const projectId = auth.app.options.projectId;
      
      if (errorCode === 'auth/configuration-not-found') {
        const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
        setAuthError('O login via Google não está ativado no Console do Firebase.');
        console.error(`ERROR: Google Sign-in is disabled. Enable it here: ${consoleUrl}`);
      } else if (errorCode === 'auth/unauthorized-domain') {
        const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
        setAuthError(`Este domínio (${window.location.hostname}) não está autorizado no Firebase.`);
        console.error(`ERROR: Unauthorized Domain. Add ${window.location.hostname} here: ${consoleUrl}`);
      } else {
        setAuthError('Erro ao entrar com Google. Verifique sua conexão ou configurações.');
      }
      console.error('Sign in error details:', error);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, authError, signIn, logout }}>
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
