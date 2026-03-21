import { Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Header from './Header';
import Footer from '../Footer';
import MobileNavBar from './MobileNavBar';
import DynamicLocalization from '../ui/DynamicLocalization';

export default function Layout() {
  const [showLocation, setShowLocation] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pana-bg font-sans selection:bg-pana-yellow selection:text-pana-blue overflow-x-clip">
      <Header ref={headerRef} onLocationClick={() => setShowLocation(true)} />
      
      <main 
        className="flex-grow pb-44 px-4 relative"
        style={{ paddingTop: (headerHeight || 180) + 'px' }}
      >
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
