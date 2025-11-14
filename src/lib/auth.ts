// Authentication utilities and context
import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && credential.user) {
      await updateProfile(credential.user, { displayName });
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user);
  };

  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user);
  };

  const createUserDocument = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        profilePicture: user.photoURL || '',
        phoneNumber: user.phoneNumber || '',
        role: 'user',
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
