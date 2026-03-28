import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protege rutas que requieren privilegios de administrador.
 * Asume que el AuthContext ya manejó el estado de carga y retuvo el renderizado
 * hasta tener `userData` o saber que el usuario no está logueado.
 */
export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const bypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

  if (!currentUser && !bypass) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && !bypass) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
