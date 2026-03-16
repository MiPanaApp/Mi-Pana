import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MessageCircle } from 'lucide-react';
import logoFull from '../../assets/Logo_Mi_pana.png';
import logoTexto from '../../assets/Logo_Mi_pana_solo_texto_.png';

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      id: 0,
      content: (
        <div className="flex flex-col items-center h-full justify-center">
          <img src={logoFull} alt="miPana" style={{ width: '220px', marginBottom: '2rem' }} />
          <h2 className="text-3xl font-black text-pana-blue text-center drop-shadow-sm">Encuentra tu Pana</h2>
          <p className="text-gray-600 text-center mt-4 max-w-xs leading-relaxed font-medium">
            Descubre servicios y productos de venezolanos cerca de ti.
          </p>
        </div>
      )
    },
    {
      id: 1,
      content: (
        <div className="flex flex-col items-center h-full justify-center">
          <img src={logoTexto} alt="miPana" style={{ width: '160px', mixBlendMode: 'multiply', marginBottom: '2rem' }} />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-clay-card mb-8">
             <Store className="w-10 h-10 text-pana-blue" />
          </div>
          <h2 className="text-3xl font-black text-pana-blue text-center drop-shadow-sm">Ofrece tu talento</h2>
          <p className="text-gray-600 text-center mt-4 max-w-xs leading-relaxed font-medium">
            Muestra tus habilidades a la comunidad y haz crecer tu negocio.
          </p>
        </div>
      )
    },
    {
      id: 2,
      content: (
        <div className="flex flex-col items-center h-full justify-center">
          <img src={logoTexto} alt="miPana" style={{ width: '160px', mixBlendMode: 'multiply', marginBottom: '2rem' }} />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-clay-card mb-8">
             <MessageCircle className="w-10 h-10 text-pana-blue" />
          </div>
          <h2 className="text-3xl font-black text-pana-blue text-center drop-shadow-sm">Conéctate directo</h2>
          <p className="text-gray-600 text-center mt-4 max-w-xs leading-relaxed font-medium">
            Chat en tiempo real y conexión directa por WhatsApp.
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-pana-bg">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 px-8"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-12 pt-6 px-8 flex flex-col items-center">
        {/* Pagination Dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-pana-blue' : 'w-2.5 bg-gray-300'}`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          className="w-full py-4 text-white font-bold text-lg rounded-[20px] shadow-neumorphic-soft active:scale-95 transition-transform"
          style={{ backgroundColor: '#1A1A3A' }}
        >
          {currentSlide === slides.length - 1 ? '¡Comenzar!' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
