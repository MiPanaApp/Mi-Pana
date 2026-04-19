import { Outlet, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Header from './Header';
import Footer from '../Footer';
import MobileNavBar from './MobileNavBar';
import DynamicLocalization from '../ui/DynamicLocalization';
import ContactModal from '../ContactModal';
import InfoModal from '../InfoModal';
import { useLocationStore } from '../../store/useLocationStore';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { LegalData } from '../../data/LegalData';

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

    // Revisar los params URL para interactuar desde e-mails
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('contacto') === 'true') {
      setIsContactOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('privacidad') === 'true') {
      setInfoData({ title: LegalData.privacy.title, content: LegalData.privacy.content });
      setIsInfoOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    return () => {
      window.removeEventListener('open-contact', handleOpenContact);
      window.removeEventListener('open-info', handleOpenInfo);
    };
  }, []);

  // --- Lógica del Guardián de Ubicación ---
  const { selectedCountry, setHasChosenCountry } = useStore();
  const { countries, init: initLocations, loading: locationsLoading } = useLocationStore();

  useEffect(() => {
    const unsub = initLocations();
    return () => unsub();
  }, [initLocations]);

  const currentCountryInfo = countries.find(c => c.id === selectedCountry);
  const isSuspended = currentCountryInfo?.status === 'suspended';
  const isHidden = currentCountryInfo?.status === 'hidden' && !locationsLoading;

  // Si el país fue ocultado, mandamos al Onboarding
  useEffect(() => {
    if (isHidden) {
      setHasChosenCountry(false);
    }
  }, [isHidden, setHasChosenCountry]);

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

      {/* BLOQUEO POR PAÍS SUSPENDIDO (Guardián) */}
      <AnimatePresence>
        {isSuspended && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-[#1A1A3A]/90 backdrop-blur-xl"
          >
            <div className="max-w-sm w-full text-center space-y-8">
              <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-3 border-4 border-[#FFD700]">
                <span className="text-6xl">{currentCountryInfo?.flag}</span>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white leading-tight">
                  ¡Pausa en <span className="text-[#FFD700]">{currentCountryInfo?.name}</span>!
                </h2>
                <div className="bg-white/10 p-6 rounded-[2rem] border border-white/20">
                  <AlertCircle className="w-8 h-8 text-[#FFD700] mx-auto mb-3" />
                  <p className="text-white font-bold text-lg leading-snug italic opacity-90">
                    "{currentCountryInfo?.suspendedMessage}"
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setHasChosenCountry(false)}
                className="w-full h-16 bg-[#FFD700] text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
              >
                Cambiar de Ubicación <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
