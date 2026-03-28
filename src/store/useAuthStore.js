import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

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
    });
    return unsubscribe;
  },

  // Registro con Email y Contraseña
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      set({ user: result.user, loading: false });
      return { success: true, user: result.user };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  // Login con Email y Contraseña
  login: async (email, password) => {
    if (isBypass) {
      set({ user: BYPASS_USER, loading: false });
      return { success: true };
    }
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
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
      set({ user: result.user, loading: false });
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
    await signOut(auth);
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));
