// ====================================================
// CONFIGURACIÓN DE FIREBASE - Mi Pana
// ====================================================
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// --- VALIDACIÓN DE VARIABLES (Debug) ---
if (!firebaseConfig.appId || !firebaseConfig.projectId) {
  console.warn("⚠️ Firebase: Faltan variables de entorno. Verifica tu archivo .env");
  console.log("Config actual:", firebaseConfig);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Inicializar Analytics solo si es soportado y hay appId
let analytics = null;
import { isSupported } from 'firebase/analytics';

if (typeof window !== 'undefined' && firebaseConfig.appId) {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.group("🔥 Firebase Analytics Warning");
    console.warn("Analytics no disponible en este entorno o configuración.");
    console.error(err);
    console.groupEnd();
  });
}

export { analytics };
export default app;
