import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setCountry, setRegion, setFilters } = useStore();

  // Escuchamos el usuario desde useAuthStore (la fuente de verdad)
  const storeUser = useAuthStore((s) => s.user);

  const isBypassMode = import.meta.env.VITE_AUTH_BYPASS === 'true';

  useEffect(() => {
    if (isBypassMode) {
      // En modo bypass, userData simulado
      setUserData({
        name: 'Pana Dev',
        lastName: 'Test',
        email: 'pana@mipana.com',
        avatar: null,
        role: 'admin',
        verificationLevel: 3,
      });
      setLoading(false);
      return;
    }

    // Escuchar cambios de auth reales para sincronizar userData de Firestore
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Real-time listener for user profile
        const userDocRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            
            // Intelligent Country Initialization
            if (data.country && !sessionStorage.getItem('country_initialized')) {
              let code = 'ES';
              if (data.country.includes('Colombia')) code = 'CO';
              else if (data.country.includes('Estados Unidos')) code = 'US';
              else if (data.country.includes('Chile')) code = 'CL';
              else if (data.country.includes('Panamá')) code = 'PA';
              else if (data.country.includes('República Dominicana')) code = 'DO';
              else if (data.country.includes('Argentina')) code = 'AR';
              
              setCountry(code);
              if (data.region) {
                setRegion(data.region);
                setFilters({ location: { level1: data.region, level2: data.region, level3: '' } });
              }
              sessionStorage.setItem('country_initialized', 'true');
            }

            // Sync Favorites from Firestore to Zustand Store
            if (data.favorites) {
              const { favorites: localFavs, setFavorites } = useStore.getState();
              // Only sync if they are actually different to avoid cycles or unnecessary renders
              if (JSON.stringify(data.favorites) !== JSON.stringify(localFavs)) {
                setFavorites(data.favorites);
              }
            } else {
              // If user has no favorites in Firestore, clear them locally too
              useStore.getState().setFavorites([]);
            }
          } else {
            setUserData(null);
          }
        }, (err) => {
          console.error(`[AuthProvider] Error en onSnapshot for UID ${user.uid}:`, err);
          // Opcional: Si el error es de permisos, podemos limpiar userData
          if (err.code === 'permission-denied') setUserData(null);
        });
        setLoading(false);
        return () => { unsubProfile(); };
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [isBypassMode]);

  // Funciones delegadas al store Zustand (fuente de verdad única)
  const { login, loginWithGoogle, logout } = useAuthStore.getState();

  const value = {
    // Usuario: leemos del store Zustand (fuente de verdad)
    currentUser: storeUser,
    userData,
    isAdmin: userData?.role === 'admin' || isBypassMode, // En bypass asumimos admin si está cargado
    // Avatar dinámico: prioriza el guardado en Firestore, luego el de Google/Auth
    userAvatar: userData?.avatar || storeUser?.photoURL || null,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
