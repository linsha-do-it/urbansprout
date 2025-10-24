// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyyL7LDD2DeZmfetNvzdY8QZ5-eUJqHwU",
  authDomain: "urbansprout-bc137.firebaseapp.com",
  projectId: "urbansprout-bc137",
  storageBucket: "urbansprout-bc137.firebasestorage.app",
  messagingSenderId: "793698516798",
  appId: "1:793698516798:web:e87815785ae0b3575d766f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with explicit persistence and popup/redirect resolver
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In helper with fallback
export const signInWithGoogle = async () => {
  try {
    // Try popup first
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.log('Popup failed, trying redirect method:', error.message);
    
    // If popup fails due to COOP or other issues, use redirect
    if (error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/network-request-failed' ||
        error.message.includes('Cross-Origin-Opener-Policy')) {
      
      // Use redirect method instead
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect, so this won't return
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Helper to get redirect result
export const getGoogleRedirectResult = () => getRedirectResult(auth);

// Sign Out helper
export const signOutUser = () => signOut(auth);

export default app;