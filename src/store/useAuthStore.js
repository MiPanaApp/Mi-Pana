import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { useStore } from './useStore';
import { getCountryCodeFromName } from '../data/locations';

const isBypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

const BYPASS_USER = {
  uid: 'dev-user-123',
  email: 'pana@mipana.com',
  displayName: 'Pana Dev',
  role: 'admin',
  verified: true,
};

export const useAuthStore = create((set, get) => ({
  user: isBypass ? BYPASS_USER : null,
  loading: !isBypass, // Si es bypass, no hay loading
  error: null,

  // Inicializa el listener de Firebase Auth (llamar una sola vez en App.jsx)
  init: () => {
    if (isBypass) {
      set({ user: BYPASS_USER, loading: false });
      return () => {}; // noop unsubscribe
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });

      if (user) {
        // Tracker de usuario activo para notificaciones automáticas
        // throttle de 24h usando localStorage
        const todayStr = new Date().toDateString();
        const lastSeenKey = `lastSeen_${user.uid}`;
        if (localStorage.getItem(lastSeenKey) !== todayStr) {
          updateDoc(doc(db, 'users', user.uid), {
            lastSeenAt: serverTimestamp()
          }).then(() => {
            localStorage.setItem(lastSeenKey, todayStr);
          }).catch(e => console.warn('No se pudo registrar lastSeenAt', e));
        }
      }
    });
    return unsubscribe;
  },

  // Registro con Email y Contraseña
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Asegurar documento en Firestore con provider
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: name,
        provider: 'email',
        notificationsEnabled: false,
        profileComplete: false,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      set({ user: result.user, loading: false });
      return { success: true, user: result.user };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  // Login con Email y Contraseña
  login: async (email, password, rememberMe = false) => {
    if (isBypass) {
      if (rememberMe) {
        localStorage.setItem('remember_me_email', email);
      } else {
        localStorage.removeItem('remember_me_email');
      }
      set({ user: BYPASS_USER, loading: false });
      return { success: true };
    }

    set({ loading: true, error: null });
    try {
      // 1. Configurar persistencia según el switch 'Recuérdame'
      // browserLocalPersistence = siempre conectado hasta logout
      // browserSessionPersistence = expira al cerrar la pestaña/ventana
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      // 2. Ejecutar login
      const result = await signInWithEmailAndPassword(auth, email, password);

      // 3. Manejar localStorage para el email recordado
      if (rememberMe) {
        localStorage.setItem('remember_me_email', email);
      } else {
        localStorage.removeItem('remember_me_email');
      }

      // 4. Actualizar provider en Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        provider: 'email',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      set({ user: result.user, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err; // Re-throw para que LoginScreen pueda capturar el error code
    }
  },

  // Login con Google (usando Popup, más fiable en localhost y web)
  loginWithGoogle: async () => {
    if (isBypass) {
      set({ user: BYPASS_USER, loading: false });
      return { success: true, isNewUser: false };
    }
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'google',
          notificationsEnabled: false,
          profileComplete: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      set({ user, loading: false });
      return { success: true, result };
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loginWithFacebook: async () => {
    set({ loading: true, error: null });
    try {
      const { facebookProvider } = await import('../services/firebase');
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'facebook',
          notificationsEnabled: false,
          profileComplete: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      set({ user, loading: false });
      return { success: true, result };
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Cerrar Sesión
  logout: async () => {
    if (isBypass) {
      set({ user: null });
      return;
    }

    // Limpiar el token FCM del dispositivo actual antes de cerrar sesión
    try {
      const currentUser = auth.currentUser
      if (currentUser && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration?.pushManager) {
          const { getMessaging, getToken } = await import('firebase/messaging')
          const messaging = getMessaging()
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
          }).catch(() => null)
          if (token) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              fcmTokens: arrayRemove(token)
            }).catch(() => {})
            console.log('[Logout] Token FCM eliminado de Firestore.')
          }
        }
      }
    } catch (e) {
      // No bloquear el logout si falla la limpieza del token
      console.warn('[Logout] No se pudo limpiar el token FCM:', e.message)
    }

    await signOut(auth);
    set({ user: null });
    // Reset global store (favorites, etc.)
    const store = useStore.getState();
    store.clearFavorites();
    store.clearRecentSearches();
  },

  clearError: () => set({ error: null }),

  // Fetch user location preferences from Firestore
  fetchUserPreferences: async (uid) => {
    if (isBypass) return { hasPrefs: true };
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Fallback: If lastViewed is missing, use registered country/region
        const countryName = data.lastViewedCountry || data.country;
        const regionName = data.lastViewedRegion || data.region;

        if (countryName) {
          const { setSelectedCountry, setSelectedRegion, setHasChosenCountry, setFilters } = useStore.getState();
          const countryCode = getCountryCodeFromName(countryName);
          setSelectedCountry(countryCode);
          setSelectedRegion(regionName || '');
          setHasChosenCountry(true);
          
          // Also update filters to match exactly what is being selected
          setFilters({ 
            location: { 
              level1: regionName || '', 
              level2: '', 
              level3: '' 
            } 
          });
          
          return { hasPrefs: true };
        }
      }
      return { hasPrefs: false };
    } catch (err) {
      console.error("Error fetching user preferences:", err);
      return { hasPrefs: false }; // Fallback to onboarding
    }
  },
}));
