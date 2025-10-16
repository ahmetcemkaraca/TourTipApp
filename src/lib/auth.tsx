'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from './firebase';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { userService } from './firestore-service';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendEmailVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google and Facebook providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure providers
googleProvider.addScope('email');
googleProvider.addScope('profile');
facebookProvider.addScope('email');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Create or update user profile in Firestore
      if (currentUser) {
        try {
          const existingUser = await userService.read(currentUser.uid);
          
          if (!existingUser) {
            // Create new user profile
            await userService.create({
              email: currentUser.email!,
              fullName: currentUser.displayName || '',
              profilePicture: currentUser.photoURL || '',
              phoneNumber: currentUser.phoneNumber || '',
              emailVerified: currentUser.emailVerified,
              preferences: {
                language: 'tr',
                currency: 'TRY',
                notifications: {
                  email: true,
                  sms: false,
                  push: true,
                },
              },
              membershipStatus: 'free',
              loyaltyPoints: 0,
            }, currentUser.uid);
          } else {
            // Update existing user with fresh data
            await userService.update(currentUser.uid, {
              email: currentUser.email!,
              fullName: currentUser.displayName || existingUser.fullName,
              profilePicture: currentUser.photoURL || existingUser.profilePicture,
              emailVerified: currentUser.emailVerified,
              lastLoginAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Error creating/updating user profile:', error);
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(newUser, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(newUser);
      
      toast.success('Kayıt başarılı! E-postanızı kontrol edin.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Başarıyla çıkış yapıldı.');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Çıkış yapılırken hata oluştu.');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get additional user info
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential) {
        toast.success('Google ile giriş başarılı!');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google giriş penceresi kapatıldı.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Multiple popups - ignore
      } else {
        toast.error('Google ile giriş yapılırken hata oluştu.');
      }
      
      throw error;
    }
  };

  // Sign in with Facebook
  const signInWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      
      // Get additional user info
      const credential = FacebookAuthProvider.credentialFromResult(result);
      
      if (credential) {
        toast.success('Facebook ile giriş başarılı!');
      }
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Facebook giriş penceresi kapatıldı.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Multiple popups - ignore
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Bu e-posta adresi farklı bir yöntemle kayıtlı.');
      } else {
        toast.error('Facebook ile giriş yapılırken hata oluştu.');
      }
      
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Şifre sıfırlama e-postası gönderildi!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Resend email verification
  const resendEmailVerification = async () => {
    if (!user) {
      throw new Error('Kullanıcı oturumu bulunamadı.');
    }
    
    try {
      await sendEmailVerification(user);
      toast.success('Doğrulama e-postası tekrar gönderildi!');
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
    resendEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
