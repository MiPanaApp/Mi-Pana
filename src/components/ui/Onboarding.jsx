import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

const countryData = {
  ES: { name: 'España', flag: '🇪🇸', active: true, quote: 'El arroz con pollo es mejor que la paella 😂🤣' },
  US: { name: 'Estados Unidos', flag: '🇺🇸', active: false, quote: 'El “American Dream” está bien… pero el venezolano ya viene con survival mode activado 😂🤣' },
  CO: { name: 'Colombia', flag: '🇨🇴', active: false, quote: 'La Arepa es Venezolana 😜' },
  EC: { name: 'Ecuador', flag: '🇪🇨', active: false, quote: 'En Ecuador tienen volcanes… pero el Roraima es otra cosa 😍' },
  PA: { name: 'Panamá', flag: '🇵🇦', active: false, quote: 'En Panamá hay plata… pero el venezolano tiene más calle 😜' },
  PE: { name: 'Perú', flag: '🇵🇪', active: false, quote: 'Perú tiene historia milenaria… pero el venezolano hace historia donde llega 😉' },
  DO: { name: 'República Dominicana', flag: '🇩🇴', active: false, quote: 'El Caribe es de todos… pero el venezolano tiene el combo completo 😃' },
  CL: { name: 'Chile', flag: '🇨🇱', active: false, quote: 'En Chile todo funciona… pero el venezolano hace que pase algo 🤭' },
  AR: { name: 'Argentina', flag: '🇦🇷', active: false, quote: 'Argentina tiene historia en el fútbol… pero el venezolano le pone ganas hasta sin historia 💪' }
};

export default function Onboarding() {
  const [step, setStep] = useState('selector'); // 'selector' | 'transition'
  const [localCountry, setLocalCountry] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  const navigate = useNavigate();
  const { setCountry } = useStore();

  const handleConfirm = () => {
    if (!localCountry) return;
    
    setCountry(localCountry);
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
                    className="w-full h-14 clay-card flex items-center justify-between px-5 text-[#1A1A3A] font-bold text-lg"
                  >
                    {localCountry ? (
                      <span className="flex items-center gap-3">
                        <span>{countryData[localCountry].flag}</span>
                        <span>{countryData[localCountry].name}</span>
                      </span>
                    ) : (
                      <span className="opacity-40">Selecciona tu país...</span>
                    )}
                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isCountryOpen ? 'rotate-180' : ''}`} />
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
                            className={`w-full h-12 flex items-center gap-3 px-4 rounded-xl transition-all font-bold ${localCountry === code ? 'bg-[#1A1A3A] text-white shadow-lg' : 'hover:bg-[#1A1A3A]/5 text-[#1A1A3A]'}`}
                          >
                            <span className="text-xl">{data.flag}</span>
                            <span>{data.name}</span>
                            {!data.active && <span className="text-[10px] ml-auto opacity-50 px-2 py-0.5 border border-current rounded-full">Próximamente</span>}
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
