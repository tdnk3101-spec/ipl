import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { auth, hasFirebaseAuthConfig } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  signOut,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

import PageLoader from '../components/PageLoader';

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => { },
  loginAsGuest: async () => { },
  logout: async () => { }
});

const googleProvider = new GoogleAuthProvider();

function createLocalGuest(displayName) {
  const storedUser = window.localStorage.getItem('ipl_local_guest');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      window.localStorage.removeItem('ipl_local_guest');
    }
  }

  const uid = globalThis.crypto?.randomUUID?.() ||
    `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const localUser = {
    uid,
    displayName,
    isAnonymous: true,
    isLocalGuest: true,
  };
  window.localStorage.setItem('ipl_local_guest', JSON.stringify(localUser));
  return localUser;
}

function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/unauthorized-domain':
      return `This domain is not authorized in Firebase. Add ${window.location.hostname} in Firebase Console > Authentication > Settings > Authorized domains.`;
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before it completed.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled. Enable Google under Firebase Console > Authentication > Sign-in method.';
    case 'auth/invalid-api-key':
      return 'The Firebase API key is invalid. Check the VITE_FIREBASE_* variables.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // AuthProvider check failed
  }
  return context || {};
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('ipl_has_seen_loader');
      if (hasSeen) return false;
    }
    return true;
  });

  const markLoaderSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ipl_has_seen_loader', 'true');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!auth) {
      markLoaderSeen();
      return undefined;
    }

    getRedirectResult(auth).catch((error) => {
      console.error('[auth] Google redirect sign-in failed', error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      const isLandingPage = typeof window !== 'undefined' && window.location.pathname === '/';
      if (!isLandingPage) {
        setTimeout(markLoaderSeen, 1500);
      }
    });

    return unsubscribe;
  }, [markLoaderSeen]);

  // Listen to manual skip/continue event from PageLoader
  useEffect(() => {
    const handleSkip = () => {
      markLoaderSeen();
    };
    document.addEventListener('skipIntro', handleSkip);
    return () => document.removeEventListener('skipIntro', handleSkip);
  }, [markLoaderSeen]);


  const loginWithGoogle = async () => {
    if (!auth || !hasFirebaseAuthConfig) {
      throw new Error('Google sign-in is unavailable until Firebase Authentication is configured.');
    }

    if (window.matchMedia('(max-width: 640px)').matches) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      if (error?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw new Error(authErrorMessage(error), { cause: error });
    }
  };

  const loginAsGuest = async (displayName) => {
    if (!auth) {
      const localUser = createLocalGuest(displayName);
      setUser(localUser);
      return localUser;
    }

    try {
      const result = await signInAnonymously(auth);
      await updateProfile(result.user, { displayName });
      return result.user;
    } catch (error) {
      throw new Error(authErrorMessage(error), { cause: error });
    }
  };

  const logout = () => {
    window.localStorage.removeItem('ipl_local_guest');
    return auth ? signOut(auth) : setUser(null);
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            className="fixed inset-0 z-[9999]"
          >
            <PageLoader />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};
