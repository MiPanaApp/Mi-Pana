import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getCountryNameFromCode } from '../../data/locations';

const countryData = {
  ES: { name: 'España', active: true, quote: 'El arroz con pollo es mejor que la paella 😂🤣' },
  US: { name: 'Estados Unidos', active: false, quote: 'El “American Dream” está bien… pero el venezolano ya viene con survival mode activado 😂🤣' },
  CO: { name: 'Colombia', active: false, quote: 'La Arepa es Venezolana 😜' },
  EC: { name: 'Ecuador', active: false, quote: 'En Ecuador tienen volcanes… pero el Roraima es otra cosa 😍' },
  PA: { name: 'Panamá', active: false, quote: 'En Panamá hay plata… pero el venezolano tiene más calle 😜' },
  PE: { name: 'Perú', active: false, quote: 'Perú tiene historia milenaria… pero el venezolano hace historia donde llega 😉' },
  DO: { name: 'República Dominicana', active: false, quote: 'El Caribe es de todos… pero el venezolano tiene el combo completo 😃' },
  CL: { name: 'Chile', active: false, quote: 'En Chile todo funciona… pero el venezolano hace que pase algo 🤭' },
  AR: { name: 'Argentina', active: false, quote: 'Argentina tiene historia en el fútbol… pero el venezolano le pone ganas hasta sin historia 💪' }
};

const capitals = {
  ES: 'Madrid',
  CO: 'Bogotá',
  US: 'Washington D.C.',
  CL: 'Santiago',
  PA: 'Ciudad de Panamá',
  PE: 'Lima',
  EC: 'Quito',
  DO: 'Santo Domingo',
  AR: 'Buenos Aires'
};

export default function Onboarding() {
  const [step, setStep] = useState('selector'); // 'selector' | 'transition'
  const [localCountry, setLocalCountry] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  const navigate = useNavigate();
  const { setCountry, setFilters, setHasChosenCountry } = useStore();
  
  const handleConfirm = async () => {
    if (!localCountry) return;
    
    setCountry(localCountry);
    setHasChosenCountry(true); // Marcar que el usuario eligió país explícitamente
    
    // Guardar en Firestore si el usuario está logueado
    const user = useAuthStore.getState().user;
    if (user && user.uid && import.meta.env.VITE_AUTH_BYPASS !== 'true') {
      try {
        const capital = capitals[localCountry];
        await updateDoc(doc(db, 'users', user.uid), {
          lastViewedCountry: getCountryNameFromCode(localCountry),
          lastViewedRegion: capital || '',
          lastViewedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving location pref in onboarding:", err);
      }
    }
    
    // Establecer la Capital por defecto al entrar
    const capital = capitals[localCountry];
    if (capital) {
      setFilters({ location: { level1: '', level2: capital, level3: '' } });
    }
    
    setStep('transition');
  };

  useEffect(() => {
    if (step === 'transition') {
      // Cálculo dinámico del tiempo de lectura
      // Tiempo base: 2000ms. Por cada palabra extra sumamos 300ms.
      const quoteText = countryData[localCountry].quote;
      const wordCount = quoteText.split(/\s+/).length;
      const readingTimeMs = 2000 + (wordCount * 300);

      const timer = setTimeout(() => {
        navigate('/home');
      }, readingTimeMs);
      return () => clearTimeout(timer);
    }
  }, [step, navigate, localCountry]);

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
              {/* Custom Country Selector */}
              <div className="space-y-2 relative z-30">
                <label className="text-xs font-bold text-[#1A1A3A]/60 tracking-widest ml-4">País</label>
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsCountryOpen(!isCountryOpen);
                    }}
                    className="w-full min-h-[3.5rem] py-2 clay-card flex items-center justify-between px-5 text-[#1A1A3A] font-bold text-lg text-left"
                  >
                    {localCountry ? (
                      <span className="flex items-center gap-3 leading-tight">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-[0.5px] border-[#003366]/20 relative shadow-sm flex-shrink-0">
                          <img 
                            src={`https://flagcdn.com/w80/${localCountry.toLowerCase()}.png`} 
                            alt={localCountry}
                            className="w-full h-full object-cover absolute inset-0" 
                          />
                        </div>
                        <span>{countryData[localCountry].name}</span>
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
                        className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/95 backdrop-blur-xl rounded-[25px] shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto hide-scrollbar border border-white/20"
                      >
                        {Object.entries(countryData).map(([code, data]) => (
                          <button
                            key={code}
                            onClick={() => {
                              setLocalCountry(code);
                              setIsCountryOpen(false);
                            }}
                            className={`w-full min-h-[3rem] py-2 flex items-center gap-3 px-4 rounded-xl transition-all font-bold text-left ${localCountry === code ? 'bg-[#1A1A3A] text-white shadow-lg' : 'hover:bg-[#1A1A3A]/5 text-[#1A1A3A]'}`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden border-[0.5px] border-[#003366]/20 relative shadow-sm flex-shrink-0">
                              <img 
                                src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`} 
                                alt={code}
                                className="w-full h-full object-cover absolute inset-0" 
                              />
                            </div>
                            <span className="leading-tight">{data.name}</span>
                            {!data.active && <span className="text-[10px] ml-auto opacity-50 px-2 py-0.5 border border-current rounded-full flex-shrink-0">Próximamente</span>}
                          </button>
                        ))}
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
            <p className="text-2xl md:text-3xl font-black text-[#1A1A3A] text-center leading-tight">
              {countryData[localCountry].quote}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
