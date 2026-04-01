import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useCategoryStore } from './store/useCategoryStore';
import { useLocationStore } from './store/useLocationStore';

import ScrollToTop from './components/ScrollToTop';
import SplashScreen from './components/ui/SplashScreen';
import Onboarding from './components/ui/Onboarding';
import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';
import CompleteProfile from './pages/auth/CompleteProfile';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

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
    const unsubAuth = init();
    const unsubCats = useCategoryStore.getState().init();
    const unsubLocations = useLocationStore.getState().init();
    
    return () => {
      unsubAuth();
      unsubCats();
      unsubLocations();
    };
  }, [init]);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Main Auth Flow */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/register/complete-profile" element={<CompleteProfile />} />
        
        {/* Onboarding Flow */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Main Application with Header and Footer */}
        <Route element={<Layout />}>
          {/* Rutas públicas */}
          <Route path="/home" element={<Home />} />
          <Route path="/category/:categoryId" element={<Home />} />
          <Route path="/perfil-producto" element={<ProductDetail />} />

          {/* Rutas protegidas (requieren login) */}
          <Route path="/favoritos" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/anunciar" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/mensajes" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ofertar" element={<ProtectedRoute><OfferForm /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />

          <Route path="/selector-pais" element={<div className="p-8">Selector de País (Coming Soon)</div>} />
        </Route>
        
        {/* Fullscreen Chat Route (No Layout Wrapper) */}
        <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        
        {/* Admin Flow */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
