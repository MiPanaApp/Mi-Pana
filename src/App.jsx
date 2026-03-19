import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

import SplashScreen from './components/ui/SplashScreen';
import Onboarding from './components/ui/Onboarding';
import Auth from './pages/Auth';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Core App Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import OfferForm from './pages/OfferForm';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import AdminDashboard from './pages/admin/AdminDashboard';
// New Pages
import Favorites from './pages/Favorites';
import CreateListing from './pages/CreateListing';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

function App() {
  const { init } = useAuthStore();

  // Inicializar el listener de Firebase Auth al arrancar la app
  useEffect(() => {
    const unsubscribe = init();
    return () => unsubscribe(); // Limpiar al desmontar
  }, [init]);

  return (
    <Router>
      <Routes>
        {/* Onboarding Flow */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Main Application with Header and Footer */}
        <Route element={<Layout />}>
          {/* Rutas públicas */}
          <Route path="/home" element={<Home />} />
          <Route path="/perfil-producto" element={<ProductDetail />} />

          {/* Rutas protegidas (requieren login) */}
          <Route path="/favoritos" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/anunciar" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/mensajes" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ofertar" element={<ProtectedRoute><OfferForm /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />

          <Route path="/selector-pais" element={<div className="p-8">Selector de País (Coming Soon)</div>} />
        </Route>
        
        {/* Fullscreen Chat Route (No Layout Wrapper) */}
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        
        {/* Admin Flow */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
