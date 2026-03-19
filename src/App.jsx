import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './components/ui/SplashScreen';
import Onboarding from './components/ui/Onboarding';
import Layout from './components/layout/Layout';
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
  return (
    <Router>
      <Routes>
        {/* Onboarding Flow */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Main Application with Header and Footer */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/ofertar" element={<OfferForm />} />
          <Route path="/selector-pais" element={<div className="p-8">Selector de País (Coming Soon)</div>} />
          <Route path="/perfil-producto" element={<ProductDetail />} />
          <Route path="/chats" element={<ChatList />} />
          {/* New Routes */}
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/anunciar" element={<CreateListing />} />
          <Route path="/mensajes" element={<Messages />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>
        
        {/* Fullscreen Chat Route (No Layout Wrapper) */}
        <Route path="/chat/:id" element={<Chat />} />
        
        {/* Admin Flow */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
