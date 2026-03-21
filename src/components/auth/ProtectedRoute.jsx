import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Protege rutas que requieren autenticación.
 * - Si está cargando: muestra un spinner
 * - Si no hay usuario: redirige a /auth
 * - Si hay usuario: renderiza los hijos
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  const bypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

  if (loading && !bypass) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#1A1A3A]/20 border-t-[#1A1A3A] animate-spin" />
      </div>
    );
  }

  if (!user && !bypass) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
