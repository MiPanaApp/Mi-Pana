import { Search } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { FiCoffee, FiPackage, FiSmile, FiMonitor, FiTool, FiShoppingBag, FiBriefcase, FiHeart } from 'react-icons/fi';
import { IconPana } from '../ui/IconPana';
import logoTexto from '../../assets/solotexto.png';

const CATEGORIES = [
  { id: 1, name: "Comida", icon: FiCoffee },
  { id: 2, name: "Envíos", icon: FiPackage },
  { id: 3, name: "Belleza", icon: FiSmile },
  { id: 4, name: "Tecn", icon: FiMonitor },
  { id: 5, name: "Servicios", icon: FiTool },
  { id: 6, name: "Ropa", icon: FiShoppingBag },
  { id: 7, name: "Legal", icon: FiBriefcase },
  { id: 8, name: "Salud", icon: FiHeart },
];

export default function Header() {
  const [activeCat, setActiveCat] = useState(1);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 50) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* 1. TOP HEADER FIJO (Logo + Buscador) - Neumorphism */}
      <div className="bg-[#E0E5EC] pt-safe safe-area-pt shadow-[0_5px_15px_rgba(163,177,198,0.3)] border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-4">
            
            {/* Logo y Ubicación */}
            <div className="flex flex-col items-center flex-shrink-0">
              <img 
                src={logoTexto} 
                alt="miPana" 
                style={{ height: '40px', objectFit: 'contain' }} 
                className="header-logo"
              />
              <div className="flex items-center gap-1 mt-1 cursor-pointer active:scale-95 transition-transform opacity-90">
                <span className="text-[10px] font-black text-[#003366] tracking-widest uppercase">Madrid</span>
                {/* Bandera España */}
                <div className="w-3.5 h-3.5 rounded-full overflow-hidden flex flex-col border-[0.5px] border-[#003366]/20 shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.8)]">
                  <div className="h-[30%] bg-[#AD1519]"></div>
                  <div className="h-[40%] bg-[#FABD00]"></div>
                  <div className="h-[30%] bg-[#AD1519]"></div>
                </div>
              </div>
            </div>

            {/* Buscador Claymorphism Amarillo (Efecto Hundido/Carved) */}
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="¿Qué necesitas, pana?" 
                className="w-full h-11 pl-11 pr-4 bg-[#FFCC00] rounded-xl text-sm text-[#003366] font-bold placeholder:text-[#003366]/60 shadow-[inset_4px_4px_8px_rgba(204,163,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003366]/70 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIAS - Píldoras Goma (Claymorphism) que se ocultan al scroll */}
      <AnimatePresence>
        {!hidden && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden bg-[#E0E5EC]/95 backdrop-blur-md"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-3 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.map((cat, index) => {
                  const isActive = activeCat === cat.id;
                  
                  // Brand Color Pattern: Blue, Yellow, Red
                  let iconColor;
                  if (index % 3 === 0) iconColor = '#0056B3';      // Blue
                  else if (index % 3 === 1) iconColor = '#FFB400'; // Yellow
                  else iconColor = '#D90429';                      // Red

                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => setActiveCat(cat.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 transition-all duration-300
                        ${isActive 
                          ? 'bg-[#E0E5EC] text-[#1A1A3A] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]' 
                          : 'bg-[#E0E5EC] text-gray-500 shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)]'
                        }
                      `}
                    >
                      <cat.icon size={16} style={{ color: iconColor }} />
                      <span className="text-xs font-black uppercase tracking-tight">{cat.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Línea tricolor VZLA */}
      <div className="flex w-full h-[3px]">
        <div className="flex-1 bg-[#FFCC00]"></div>
        <div className="flex-1 bg-[#003366]"></div>
        <div className="flex-1 bg-[#D90429]"></div>
      </div>
    </header>
  );
}
