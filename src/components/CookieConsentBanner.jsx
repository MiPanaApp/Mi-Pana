import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BarChart2, Lock, TrendingUp, SlidersHorizontal, Check, ExternalLink, Save } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useCookieConsent } from '../hooks/useCookieConsent';

export default function CookieConsentBanner() {
  const { consent, hasDecided, updateConsent } = useCookieConsent();
  const [showDetailed, setShowDetailed] = useState(false);
  const [prefs, setPrefs] = useState({
    necessary: true,
    analytics: consent?.analytics ?? false,
    googleAnalytics: consent?.googleAnalytics ?? false
  });

  const [notificationDecided, setNotificationDecided] = useState(
    localStorage.getItem('mipana_notifications_decided') === 'true'
  );

  useEffect(() => {
    const handler = () => setNotificationDecided(true);
    window.addEventListener('notificationDecided', handler);
    return () => window.removeEventListener('notificationDecided', handler);
  }, []);

  // Update prefs when consent changes if not decided (e.g. initial load)
  useEffect(() => {
    if (consent) {
      setPrefs({
        necessary: true,
        analytics: consent.analytics || false,
        googleAnalytics: consent.googleAnalytics || false
      });
    }
  }, [consent]);

  if (Capacitor.isNativePlatform()) return null;
  if (hasDecided || !notificationDecided) return null;

  const handleAcceptAll = () => {
    updateConsent({ necessary: true, analytics: true, googleAnalytics: true });
  };

  const handleRejectAll = () => {
    updateConsent({ necessary: true, analytics: false, googleAnalytics: false });
  };

  const handleSavePrefs = () => {
    updateConsent(prefs);
  };

  return (
    <motion.div
      initial={{ y: 200 }}
      animate={{ y: 0 }}
      exit={{ y: 200 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-[9998] w-full md:max-w-lg mx-auto md:mb-4 bg-[#E8E8F0] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] rounded-t-[2rem] md:rounded-[2rem] p-6 pb-8 md:pb-6"
    >
      <div className="flex items-start gap-3 mb-6">
        <Shield size={20} className="text-[#1A1A3A]/60 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#1A1A3A]/70 font-medium leading-relaxed">
          Usamos cookies necesarias y analíticas (Firebase + Google Analytics) para mejorar tu experiencia.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {showDetailed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 flex flex-col gap-3"
          >
            {/* Card 1 */}
            <div className="bg-white/60 rounded-2xl p-4 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <Lock size={18} className="text-[#1A1A3A]" />
                   <span className="font-black text-sm text-[#1A1A3A]">Cookies Necesarias</span>
                 </div>
                 <div className="w-10 h-6 rounded-full bg-green-500 relative cursor-not-allowed opacity-70">
                   <div className="absolute top-1 left-5 w-4 h-4 bg-white rounded-full" />
                 </div>
               </div>
               <p className="text-xs text-[#1A1A3A]/60 mb-2">
                 Autenticación y sesión de usuario. Imprescindibles para el funcionamiento.
               </p>
               <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                 Siempre activas
               </span>
            </div>

            {/* Card 2 */}
            <div className="bg-white/60 rounded-2xl p-4 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-2">
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
               <p className="text-xs text-[#1A1A3A]/60 mb-2">
                 Mide el uso de la app para mejorar la experiencia. No se comparte con terceros.
               </p>
               <span className="text-[10px] text-[#1A1A3A]/40 uppercase tracking-wide font-bold">
                 Firebase (Google) · 2 años · ID: G-DR5ZDRW90N
               </span>
            </div>

            {/* Card 3 */}
            <div className="bg-white/60 rounded-2xl p-4 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)]">
               <div className="flex items-center justify-between mb-2">
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
               <p className="text-xs text-[#1A1A3A]/60 mb-2">
                 Analítica web para optimizar el rendimiento de mipana.net.
               </p>
               <div className="flex items-center justify-between mt-3">
                 <span className="text-[10px] text-[#1A1A3A]/40 uppercase tracking-wide font-bold">
                   Google LLC · _ga 2 años / _gid 24h
                 </span>
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

            <button
              onClick={handleSavePrefs}
              className="w-full h-12 bg-[#1A1A3A] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 mt-2 shadow-sm focus:outline-none active:scale-95 transition-transform"
            >
              <Save size={16} /> Guardar preferencias
            </button>
            
            {/* Legal Footer */}
            <div className="text-[10px] text-[#1A1A3A]/40 text-center mt-3 leading-relaxed">
              Responsable: Mi Pana (mipana.net) · RGPD (UE) 2016/679 · LSSI-CE · Puedes retirar tu consentimiento en cualquier momento desde el botón de ajuste en la esquina inferior izquierda. Transferencias internacionales bajo Cláusulas Contractuales Tipo UE.<br />
              <a href="#" className="underline hover:text-[#1A1A3A]/60">Política de Privacidad</a> y <a href="#" className="underline hover:text-[#1A1A3A]/60">Política de Cookies</a>.
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
  );
}
