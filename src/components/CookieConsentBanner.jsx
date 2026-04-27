import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart2, Lock, TrendingUp, SlidersHorizontal, Check, ExternalLink, Save } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { LegalData } from '../data/LegalData';
import LegalDrawer from './LegalDrawer';

export default function CookieConsentBanner() {
  const { consent, hasDecided, updateConsent } = useCookieConsent();
  const [showDetailed, setShowDetailed] = useState(false);
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: consent?.analytics ?? false,
    googleAnalytics: consent?.googleAnalytics ?? false,
    metaPixel: consent?.metaPixel ?? false
  });
  const [legalDocs, setLegalDocs] = useState({ isOpen: false, title: '', content: '' });

  const [notificationDecided, setNotificationDecided] = useState(
    localStorage.getItem('mipana_notifications_decided') === 'true'
  );

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = () => setNotificationDecided(true);
    window.addEventListener('notificationDecided', handler);
    return () => window.removeEventListener('notificationDecided', handler);
  }, []);

  // Update prefs when consent changes if not decided (e.g. initial load)
  useEffect(() => {
    if (isMobile) { // logic separator
    }
    if (consent) {
      setPrefs({
        necessary: true,
        analytics: consent.analytics || false,
        googleAnalytics: consent.googleAnalytics || false
      });
    }
  }, [consent, isMobile]);

  if (Capacitor.isNativePlatform()) return null;
  if (hasDecided || !notificationDecided) return null;

  const handleAcceptAll = () => {
    updateConsent({ necessary: true, analytics: true, googleAnalytics: true, metaPixel: true });
  };

  const handleRejectAll = () => {
    updateConsent({ necessary: true, analytics: false, googleAnalytics: false, metaPixel: false });
  };

  const handleSavePrefs = () => {
    updateConsent(prefs);
  };

  const openLegal = (e, key) => {
    e.preventDefault();
    const doc = LegalData[key];
    if (doc) {
      setLegalDocs({ isOpen: true, title: doc.title, content: doc.content });
    }
  };

  return (
    <>
    <AnimatePresence>
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1A1A3A]/30 backdrop-blur-[2px] z-[9997]"
        />
      )}
    </AnimatePresence>

    <motion.div
      initial={isMobile ? { y: '100%', opacity: 0 } : { y: '-45%', x: '-50%', opacity: 0, scale: 0.95 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { y: '-50%', x: '-50%', opacity: 1, scale: 1 }}
      exit={isMobile ? { y: '100%', opacity: 0 } : { y: '-45%', x: '-50%', opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:max-w-lg md:w-full bg-[#E8E8F0] z-[9998] p-6 rounded-t-[2rem] md:rounded-[2rem] shadow-[20px_20px_60px_rgba(0,0,0,0.15)]"
    >
      <div className="flex items-start gap-2 mb-4">
        <Shield size={26} className="text-[#1A1A3A]/60 flex-shrink-0" />
        <p className="text-sm text-[#1A1A3A]/70 font-medium leading-relaxed">
          Usamos cookies necesarias, analíticas y publicitarias (Meta Pixel) para mejorar tu experiencia y medir el rendimiento de campañas.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {showDetailed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4 flex flex-col gap-2"
          >
            {/* Card 1 */}
            <div className="bg-white/60 rounded-2xl p-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-1.5">
                 <div className="flex items-center gap-2">
                   <Lock size={18} className="text-[#1A1A3A]" />
                   <span className="font-black text-sm text-[#1A1A3A]">Cookies Necesarias</span>
                 </div>
                 <div className="w-10 h-6 rounded-full bg-green-500 relative cursor-not-allowed opacity-70">
                   <div className="absolute top-1 left-5 w-4 h-4 bg-white rounded-full" />
                 </div>
               </div>
               <p className="text-xs text-[#1A1A3A]/60 mb-1.5">
                 Autenticación y sesión de usuario. Imprescindibles para el funcionamiento.
               </p>
               <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                 Siempre activas
               </span>
            </div>

            {/* Card 2 */}
            <div className="bg-white/60 rounded-2xl p-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-1.5">
                 <div className="flex items-center gap-2">
                   <BarChart2 size={18} className="text-[#1A1A3A]" />
                   <span className="font-black text-sm text-[#1A1A3A]">Firebase Analytics</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => setPrefs(prev => ({ ...prev, analytics: !prev.analytics }))}
                   className={`w-10 h-6 rounded-full transition-colors relative outline-none ${prefs.analytics ? 'bg-green-500' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${prefs.analytics ? 'left-5' : 'left-1'}`} />
                 </button>
               </div>
               <p className="text-xs text-[#1A1A3A]/60">
                 Mide el uso de la app para mejorar la experiencia. No se comparte con terceros.
               </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/60 rounded-2xl p-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-1.5">
                 <div className="flex items-center gap-2">
                   <TrendingUp size={18} className="text-[#1A1A3A]" />
                   <span className="font-black text-sm text-[#1A1A3A]">Google Analytics</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => setPrefs(prev => ({ ...prev, googleAnalytics: !prev.googleAnalytics }))}
                   className={`w-10 h-6 rounded-full transition-colors relative outline-none ${prefs.googleAnalytics ? 'bg-green-500' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${prefs.googleAnalytics ? 'left-5' : 'left-1'}`} />
                 </button>
               </div>
               <p className="text-xs text-[#1A1A3A]/60 mb-1.5">
                 Analítica web para optimizar el rendimiento de mipana.net.
               </p>
               <div className="flex justify-end">
                 <a 
                   href="https://policies.google.com/privacy" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                 >
                   <ExternalLink size={10} />
                   Ver política de Google
                 </a>
               </div>
            </div>

            {/* Card 4 — Meta Pixel */}
            <div className="bg-white/60 rounded-2xl p-3 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-1.5">
                 <div className="flex items-center gap-2">
                   <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="#1877F2">
                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                   </svg>
                   <span className="font-black text-sm text-[#1A1A3A]">Meta Pixel</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => setPrefs(prev => ({ ...prev, metaPixel: !prev.metaPixel }))}
                   className={`w-10 h-6 rounded-full transition-colors relative outline-none ${prefs.metaPixel ? 'bg-green-500' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${prefs.metaPixel ? 'left-5' : 'left-1'}`} />
                 </button>
               </div>
               <p className="text-xs text-[#1A1A3A]/60 mb-1.5">
                 Permite medir conversiones y mostrar anuncios relevantes en Facebook e Instagram.
               </p>
               <div className="flex justify-end">
                 <a
                   href="https://www.facebook.com/privacy/policy/"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                 >
                   <ExternalLink size={10} />
                   Ver política de Meta
                 </a>
               </div>
            </div>

            <button
              onClick={handleSavePrefs}
              className="w-full h-12 bg-[#1A1A3A] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 mt-2 shadow-sm focus:outline-none active:scale-95 transition-transform"
            >
              <Save size={16} /> Guardar preferencias
            </button>
            
            {/* Legal Footer */}
            <div className="text-[10px] text-[#1A1A3A]/40 text-center mt-3 leading-relaxed">
              Responsable: Mi Pana (mipana.net) · RGPD (UE) 2016/679 · LSSI-CE · Puedes retirar tu consentimiento en cualquier momento desde el botón de ajuste en la esquina inferior izquierda. Transferencias internacionales bajo Cláusulas Contractuales Tipo UE.<br />
              <button type="button" onClick={(e) => openLegal(e, 'privacy')} className="underline hover:text-[#1A1A3A]/60">Política de Privacidad</button> y <button type="button" onClick={(e) => openLegal(e, 'cookies')} className="underline hover:text-[#1A1A3A]/60">Política de Cookies</button>.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showDetailed && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={handleRejectAll}
            className="w-full sm:w-auto flex-1 py-2.5 text-sm font-bold text-[#1A1A3A]/40 hover:text-[#1A1A3A]/70 transition-colors order-3 sm:order-1"
          >
            Rechazar
          </button>
          
          <button
            onClick={() => setShowDetailed(true)}
            className="w-full sm:w-auto flex-1 h-11 flex items-center justify-center gap-2 border border-[#1A1A3A]/20 rounded-xl text-sm font-bold text-[#1A1A3A] hover:bg-[#1A1A3A]/5 transition-colors order-2"
          >
            <SlidersHorizontal size={14} /> Personalizar
          </button>
          
          <button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto flex-1 h-11 flex items-center justify-center gap-2 bg-[#FFB400] text-[#1A1A3A] font-black rounded-xl hover:bg-[#FF9000] shadow-[0_4px_14px_rgba(255,180,0,0.3)] transition-colors order-1 sm:order-3"
          >
            <Check size={16} strokeWidth={3} /> Aceptar todo
          </button>
        </div>
      )}
    </motion.div>

    <LegalDrawer 
      isOpen={legalDocs.isOpen} 
      onClose={() => setLegalDocs({ ...legalDocs, isOpen: false })} 
      title={legalDocs.title} 
      content={legalDocs.content} 
    />
    </>
  );
}
