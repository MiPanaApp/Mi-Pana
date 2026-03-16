import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return unsubscribe;
  }, [isBypassMode]);

  const loginWithGoogle = () => {
    if (isBypassMode) return Promise.resolve();
    return signInWithPopup(auth, googleProvider);
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
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
