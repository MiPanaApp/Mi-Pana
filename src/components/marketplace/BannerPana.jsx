import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_BANNERS = [
  { id: 1, title: '¡Promo de Arepas!', subtitle: '2x1 en Arepera El Pana', bgColor: 'bg-pana-red' },
  { id: 2, title: 'Envíos a Vzla', subtitle: 'Con 20% de descuento hoy', bgColor: 'bg-pana-blue' },
];

export default function BannerPana() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCK_BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[160px] rounded-[18px] bg-[#1A1A3A] shadow-neumorphic-soft overflow-hidden mt-6 mb-8 group">
      {/* Label PRD */}
      <div className="absolute top-3 right-3 z-20 bg-pana-yellow text-[#1A1A3A] text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
        Banner Pana
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 flex flex-col justify-center px-6 ${MOCK_BANNERS[currentIndex].bgColor}`}
        >
          <h3 className="text-white text-2xl font-black drop-shadow-md">{MOCK_BANNERS[currentIndex].title}</h3>
          <p className="text-white/80 font-medium mt-1">{MOCK_BANNERS[currentIndex].subtitle}</p>
          <button className="mt-4 bg-white/20 backdrop-blur-md border border-white/30 text-white w-max px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            Ver más
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {MOCK_BANNERS.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
