import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { logEvent } from "./analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    logEvent("login_success", { method: "google", email: result.user?.email || null });
    return result;
  } catch (err) {
    logEvent("login_failed", { method: "google", error: err && err.code ? err.code : String(err && err.message) });
    throw translateError(err);
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    logEvent("login_success", { method: "email", email: email || null });
    return result;
  } catch (err) {
    logEvent("login_failed", { method: "email", email: email || null, error: err && err.code ? err.code : String(err && err.message) });
    throw translateError(err);
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    logEvent("login_success", { method: "register", email: email || null });
    return result;
  } catch (err) {
    logEvent("login_failed", { method: "register", email: email || null, error: err && err.code ? err.code : String(err && err.message) });
    throw translateError(err);
  }
};

export const logout = async () => {
  return signOut(auth);
};

function translateError(err) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in window was closed.",
    "auth/cancelled-popup-request": null, // silent
    "auth/popup-blocked": "Pop-up blocked by browser. Please allow pop-ups.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Check Firebase Console.",
  };
  const msg = map[err.code];
  if (msg === null) return err; // silent
  if (msg) {
    const e = new Error(msg);
    e.code = err.code;
    return e;
  }
  return err;
}
