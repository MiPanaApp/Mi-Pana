import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useLocationStore } from '../../store/useLocationStore';

export default function Onboarding() {
  const [step, setStep] = useState('selector'); // 'selector' | 'transition'
  const [localCountry, setLocalCountry] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [suspendedCountry, setSuspendedCountry] = useState(null);
  
  const navigate = useNavigate();
  const { setCountry, setFilters, setHasChosenCountry } = useStore();
  const { countries, init, loading } = useLocationStore();
  
  useEffect(() => {
    const unsub = init();
    return () => unsub();
  }, [init]);

  const handleSelectCountry = (country) => {
    if (country.status === 'suspended') {
      setSuspendedCountry(country);
      setIsCountryOpen(false);
      return;
    }
    setLocalCountry(country.id);
    setIsCountryOpen(false);
  };

  const handleConfirm = async () => {
    if (!localCountry) return;
    
    // Buscar info del país para la transición
    const countryInfo = countries.find(c => c.id === localCountry);
    
    setCountry(localCountry);
    setHasChosenCountry(true);
    
    const user = useAuthStore.getState().user;
    if (user && user.uid && import.meta.env.VITE_AUTH_BYPASS !== 'true') {
      try {
        // Obtenemos una capital por defecto si existe o la primera región (no implementado dinámicamente aquí para no romper locations.js)
        await updateDoc(doc(db, 'users', user.uid), {
          lastViewedCountry: countryInfo?.name || localCountry,
          lastViewedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving location pref:", err);
      }
    }
    
    setStep('transition');
  };

  useEffect(() => {
    if (step === 'transition') {
      const countryInfo = countries.find(c => c.id === localCountry);
      const quoteText = countryInfo?.quote || '¡Bienvenido Pana!';
      const wordCount = quoteText.split(/\s+/).length;
      const readingTimeMs = Math.max(2500, 2000 + (wordCount * 300));

      const timer = setTimeout(() => {
        navigate('/home');
      }, readingTimeMs);
      return () => clearTimeout(timer);
    }
  }, [step, navigate, localCountry, countries]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FFC200]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1A1A3A] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-[#1A1A3A] animate-pulse">Cargando países...</p>
        </div>
      </div>
    );
  }

  const activeCountryInfo = countries.find(c => c.id === localCountry);
  const visibleCountries = countries.filter(c => c.status !== 'hidden');

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #FFC200 0%, #F8E22A 60%)' }}
    >
      <AnimatePresence mode="wait">
        {step === 'selector' ? (
          <motion.div 
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            <h1 className="text-4xl text-[#1A1A3A] mb-12 drop-shadow-sm text-center leading-[0.9]">
              <span className="font-semibold block">Encuentra</span> <span className="font-black">tu Pana</span>
            </h1>

            <div className="w-full space-y-6">
              <div className="space-y-2 relative z-30">
                <label className="text-xs font-bold text-[#1A1A3A]/60 tracking-widest ml-4">País</label>
                <div className="relative">
                  <button 
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className="w-full min-h-[4rem] py-2 clay-card flex items-center justify-between px-6 text-[#1A1A3A] font-bold text-lg text-left"
                  >
                    {localCountry ? (
                      <span className="flex items-center gap-4 leading-tight">
                        <span className="text-3xl">{activeCountryInfo?.flag}</span>
                        <span>{activeCountryInfo?.name}</span>
                      </span>
                    ) : (
                      <span className="opacity-40">Selecciona tu país...</span>
                    )}
                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 flex-shrink-0 ${isCountryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isCountryOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 p-3 bg-white/95 backdrop-blur-2xl rounded-[30px] shadow-2xl overflow-hidden z-50 max-h-[350px] overflow-y-auto hide-scrollbar border border-white/40"
                      >
                        {visibleCountries.length === 0 ? (
                          <div className="p-4 text-center text-sm font-bold text-gray-400">No hay países disponibles</div>
                        ) : (
                          visibleCountries.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectCountry(c)}
                              className={`w-full min-h-[3.5rem] py-2 flex items-center gap-4 px-5 rounded-2xl transition-all font-bold text-left mb-1 last:mb-0 ${localCountry === c.id ? 'bg-[#1A1A3A] text-white shadow-lg scale-[1.02]' : 'hover:bg-[#1A1A3A]/5 text-[#1A1A3A]'} ${c.status === 'suspended' ? 'opacity-50 grayscale-[0.5]' : ''}`}
                            >
                              <span className="text-2xl">{c.flag}</span>
                              <span className="leading-tight flex-1">{c.name}</span>
                              {c.status === 'suspended' && (
                                <span className="text-[9px] px-2 py-0.5 border border-orange-500/50 text-orange-600 rounded-full font-black uppercase">Pronto</span>
                              )}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <button 
              onClick={handleConfirm}
              disabled={!localCountry}
              className="w-full mt-12 bg-[#1A1A3A] text-white h-16 rounded-[25px] font-black text-xl shadow-2xl active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 relative z-10"
            >
              ¡Comenzar!
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm px-4"
          >
            <p className="text-3xl md:text-4xl font-black text-[#1A1A3A] text-center leading-tight drop-shadow-sm">
              {activeCountryInfo?.quote || '¡Bienvenido Pana!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Glassmorphism para Países Suspendidos */}
      <AnimatePresence>
        {suspendedCountry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuspendedCountry(null)}
              className="absolute inset-0 bg-[#1A1A3A]/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white/20 backdrop-blur-2xl p-8 rounded-[40px] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-center overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFC200]/20 rounded-full blur-3xl"></div>
              <div className="w-20 h-20 bg-white/90 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-12 border border-white">
                <span className="text-5xl">{suspendedCountry.flag}</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-4 drop-shadow-md">{suspendedCountry.name}</h3>
              <div className="bg-[#1A1A3A]/80 p-6 rounded-3xl mb-8 border border-white/10">
                <AlertCircle className="w-10 h-10 text-[#FFC200] mx-auto mb-4" />
                <p className="text-lg font-black text-white leading-tight italic">
                  "{suspendedCountry.suspendedMessage}"
                </p>
              </div>
              <button 
                onClick={() => setSuspendedCountry(null)}
                className="w-full h-14 bg-white text-[#1A1A3A] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Entendido Pana
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
