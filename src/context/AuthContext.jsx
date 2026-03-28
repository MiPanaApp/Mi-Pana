import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../services/firebase';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useStore } from '../store/useStore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setCountry, setRegion, setFilters } = useStore();

  // Testing bypass mode per PRD
  const isBypassMode = import.meta.env.VITE_AUTH_BYPASS === 'true';

  useEffect(() => {
    if (isBypassMode) {
      setCurrentUser({
        uid: 'dev-user-123',
        email: 'pana@mipana.com',
        displayName: 'Pana Dev',
        role: 'admin', // For testing admin dashboard
        verified: true
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
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
          }
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

  const login = (email, password) => {
    if (isBypassMode) return Promise.resolve();
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    if (isBypassMode) return Promise.resolve();
    return signInWithRedirect(auth, googleProvider);
  };

  const logout = () => {
    if (isBypassMode) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    // Avatar dinámico: prioriza el guardado en Firestore, luego el de Google/Auth
    userAvatar: userData?.avatar || currentUser?.photoURL || null,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
