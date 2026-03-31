import { Outlet, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Header from './Header';
import Footer from '../Footer';
import MobileNavBar from './MobileNavBar';
import DynamicLocalization from '../ui/DynamicLocalization';
import ContactModal from '../ContactModal';
import InfoModal from '../InfoModal';

export default function Layout() {
  const [showLocation, setShowLocation] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoData, setInfoData] = useState({ title: '', content: '' });
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const location = useLocation();

  // Rutas que tienen su propio header interno y no necesitan el buscador global
  const NO_HEADER_ROUTES = ['/anunciar', '/perfil-producto', '/chats', '/ofertar', '/chat'];
  const showMainHeader = !NO_HEADER_ROUTES.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    if (!headerRef.current || !showMainHeader) {
      if (!showMainHeader) setHeaderHeight(0);
      return;
    }
    const observer = new ResizeObserver(() => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [showMainHeader]);

  useEffect(() => {
    const handleOpenContact = () => setIsContactOpen(true);
    const handleOpenInfo = (e) => {
      setInfoData({ title: e.detail.title, content: e.detail.content });
      setIsInfoOpen(true);
    };
    
    window.addEventListener('open-contact', handleOpenContact);
    window.addEventListener('open-info', handleOpenInfo);
    
    return () => {
      window.removeEventListener('open-contact', handleOpenContact);
      window.removeEventListener('open-info', handleOpenInfo);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pana-bg font-sans selection:bg-pana-yellow selection:text-pana-blue overflow-x-clip">
      {showMainHeader && (
        <Header ref={headerRef} onLocationClick={() => setShowLocation(true)} />
      )}
      
      <main 
        className="flex-grow pb-44 md:pb-0 px-4 relative"
        style={{ paddingTop: showMainHeader ? (headerHeight ? `${headerHeight + 24}px` : '180px') : '0px' }}
      >
        <Outlet />
      </main>

      {/* Footer solo en escritorio */}
      <div className="hidden md:block">
        <Footer onContactClick={() => setIsContactOpen(true)} />
      </div>

      {/* Navbar fijo solo en móvil */}
      <MobileNavBar />
      
      <DynamicLocalization isOpen={showLocation} onClose={() => setShowLocation(false)} />
      
      {/* Modal de Contacto Global */}
      {/* Modal de Contacto Global */}
      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
      />

      {/* Modal de Información Global (Híbrido Drawer/Popup) */}
      <InfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        title={infoData.title} 
        content={infoData.content} 
      />
    </div>
  );
}
