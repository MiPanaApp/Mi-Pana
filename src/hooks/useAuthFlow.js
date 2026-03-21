import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, TEST_USER } from "../services/firebase";

export default function useAuthFlow() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si la variable de entorno está en true, inyectamos el usuario de test
    if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
      setUser(TEST_USER);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isBypass: import.meta.env.VITE_AUTH_BYPASS === 'true' };
}
