import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, GoogleAuthProvider, FacebookAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, persistentSingleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const isNative = import.meta.env.VITE_CAPACITOR === 'true';

// Initialize services
export const auth = isNative
  ? initializeAuth(app, { persistence: [indexedDBLocalPersistence] })
  : getAuth(app);
// Initialize Firestore con caché local persistente (IndexedDB)
// Reduce lecturas facturables y habilita uso offline en PWA/Android/iOS
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: isNative
      ? persistentSingleTabManager()
      : persistentMultipleTabManager()
  })
});
export const storage = getStorage(app);
export const googleProvider = isNative ? null : new GoogleAuthProvider();
if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export const facebookProvider = isNative ? null : new FacebookAuthProvider();
if (facebookProvider) {
  facebookProvider.addScope('email');
  facebookProvider.addScope('public_profile');
}

// Inicializar Analytics solo si es soportado y hay appId
let analytics = null;
export const analyticsReady = (async () => {
  try {
    if (typeof window !== 'undefined' && firebaseConfig.appId) {
      const yes = await isSupported();
      if (yes) {
        analytics = getAnalytics(app);
      }
    }
  } catch (err) {
    console.warn("Firebase Analytics no disponible:", err);
  }
  return analytics;
})();

export { analytics };

// Bypass para testing (VITE_AUTH_BYPASS=true en .env)
export const TEST_USER = {
  uid: "test-001",
  displayName: "Pana Test",
  email: "test@mipana.app",
  role: "admin"
};
