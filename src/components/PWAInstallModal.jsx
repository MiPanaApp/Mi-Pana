import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'mipana_pwa_install_shown';

function detectPlatform() {
  if (Capacitor.isNativePlatform()) return null;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function PWAInstallModal() {
  const [visible, setVisible] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    // No mostrar si: ya instalada, desktop, ya se mostró, cookies no decididas
    if (!platform) return;
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Esperar a que cookies estén decididas antes de mostrar
    const checkAndShow = () => {
      try {
        const cookieConsent = localStorage.getItem('mipana_cookie_consent');
        const parsed = cookieConsent ? JSON.parse(cookieConsent) : null;
        const cookiesDecided = parsed?.decided === true;
        if (!cookiesDecided) return false;
      } catch (e) { return false; }
      return true;
    };

    // Intentar mostrar cada 2s hasta que cookies estén decididas, máx 60s
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (checkAndShow()) {
        clearInterval(interval);
        // Delay de 4s adicionales tras cookies decididas
        setTimeout(() => setVisible(true), 4000);
      }
      if (attempts > 30) clearInterval(interval); // máx 60s
    }, 2000);

    return () => clearInterval(interval);
  }, [platform]);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!platform) return null;

  const imageSrc = platform === 'ios'
    ? '/Agregar_App_a_Inicio _IOS.jpg'
    : '/Agregar_App_a_Inicio _Android.jpg';

  const platformLabel = platform === 'ios' ? 'iPhone' : 'Android';

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-all"
            >
              <X size={16} className="text-white" />
            </button>

            {/* Imagen instrucciones */}
            <img
              src={imageSrc}
              alt={`Instalar Mi Pana en ${platformLabel}`}
              className="w-full object-cover"
              loading="lazy"
            />

            {/* Footer */}
            <div className="px-5 py-4 flex items-center justify-between gap-3 bg-[#FFB400]">
              <p className="text-[#1A1A3A] font-black text-sm leading-tight">
                ¡Instala Mi Pana en tu {platformLabel}!
              </p>
              <button
                onClick={handleClose}
                className="shrink-0 px-4 py-2 bg-[#1A1A3A] text-white font-black text-xs rounded-xl active:scale-95 transition-all"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
