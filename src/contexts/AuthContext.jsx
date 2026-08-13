import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  googleProvider,
  loginWithGoogle as firebaseLoginWithGoogle,
  loginWithEmail as firebaseLoginWithEmail,
  registerWithEmail as firebaseRegisterWithEmail,
  logout as firebaseLogout,
} from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import { trackUser } from '../lib/tracker';

const AuthContext = createContext(null);
const githubProvider = new GithubAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Catat user ke koleksi `users` (Firestore) untuk admin panel.
      // Best-effort: tidak mengganggu UX, semua error diserap di tracker.
      if (u && u.uid) {
        trackUser(u);
      }
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await firebaseLoginWithGoogle();
    return result.user;
  }, []);

  const loginWithGitHub = useCallback(async () => {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const result = await firebaseLoginWithEmail(email, password);
    return result.user;
  }, []);

  const registerWithEmail = useCallback(async (email, password) => {
    const result = await firebaseRegisterWithEmail(email, password);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
  }, []);

  const getIdToken = useCallback(async () => {
    // getIdToken(true) memaksa refresh token — mencegah token expired/stale
    // sehingga API (favorites/progress) tidak menolak user yang sudah login.
    return user ? user.getIdToken(true) : null;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      loginWithGitHub,
      loginWithEmail,
      registerWithEmail,
      logout,
      getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
