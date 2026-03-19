import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Header from './Header';
import Footer from '../Footer';
import MobileNavBar from './MobileNavBar';
import DynamicLocalization from '../ui/DynamicLocalization';

export default function Layout() {
  const [showLocation, setShowLocation] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-pana-bg font-sans selection:bg-pana-yellow selection:text-pana-blue">
      <Header onLocationClick={() => setShowLocation(true)} />
      
      {/* pt-36 for compact header, pb-20 for compact mobile navbar */}
      <main className="flex-grow pt-44 pb-44 px-4 relative">
        <Outlet />
      </main>

      {/* Footer solo en escritorio */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Navbar fijo solo en móvil */}
      <MobileNavBar />
      
      <DynamicLocalization isOpen={showLocation} onClose={() => setShowLocation(false)} />
    </div>
  );
}
