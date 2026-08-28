import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json'; // Adjust path if needed depending on where this file is

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e: any) {
  console.warn('Firebase init error:', e.message);
}

export const auth = app ? getAuth(app) : ({} as any);
const provider = new GoogleAuthProvider();

provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/tasks');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!app) return () => {};
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const persistedToken = cachedAccessToken || localStorage.getItem('googleToken');
      if (persistedToken) {
        cachedAccessToken = persistedToken;
        if (onAuthSuccess) onAuthSuccess(user, persistedToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!app) throw new Error("Firebase not properly connected");
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    // Notify the entire app that the token is now available
    localStorage.setItem('googleToken', cachedAccessToken); 
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('googleToken');
};

export const logout = async () => {
  if (app) await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('googleToken');
};
