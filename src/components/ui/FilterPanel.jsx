import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check, Coffee, Package, Smile, Monitor, Wrench, ShoppingBag, Briefcase, Heart } from 'lucide-react';
import { useStore } from '../../store/useStore';

const MODAL_CATEGORIES = [
  { id: 1, name: "Comida", icon: Coffee },
  { id: 2, name: "Envíos", icon: Package },
  { id: 3, name: "Belleza", icon: Smile },
  { id: 4, name: "Tecn", icon: Monitor },
  { id: 5, name: "Servicios", icon: Wrench },
  { id: 6, name: "Ropa", icon: ShoppingBag },
  { id: 7, name: "Legal", icon: Briefcase },
  { id: 8, name: "Salud", icon: Heart },
];

export default function FilterPanel() {
  const { isFilterOpen, setIsFilterOpen, filters, setFilters, activeCategory, setActiveCategory } = useStore();

  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterOpen]);

  const handleApply = () => {
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      price: { min: '', max: '' },
      onlyVerified: false
    });
    setActiveCategory(null);
  };

  return (
    <AnimatePresence>
      {isFilterOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 bg-[#E0E5EC] z-[1000] shadow-2xl h-[100dvh] flex flex-col"
          >
            {/* Header - Sticky */}
            <div className="flex justify-between items-center p-8 pb-6 bg-[#E0E5EC] z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#E0E5EC] rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)]">
                  <Sliders className="w-6 h-6 text-[#1A1A3A]" />
                </div>
                <h2 className="text-2xl font-black text-[#1A1A3A]">Filtros</h2>
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-3 bg-[#E0E5EC] rounded-full shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] text-[#1A1A3A]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-10 overscroll-contain pt-4">
              {/* Categorías */}
              <section>
                <h3 className="text-sm font-bold text-[#1A1A3A]/60 tracking-widest ml-1 mb-4">Categoría</h3>
                <div className="grid grid-cols-4 gap-3">
                  {MODAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                        activeCategory === cat.id 
                        ? 'bg-[#1A1A3A] text-white shadow-lg' 
                        : 'bg-[#E0E5EC] text-[#1A1A3A] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      <cat.icon size={18} />
                      <span className="text-[10px] font-bold mt-1">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Rango de Precio */}
              <section>
                <h3 className="text-sm font-bold text-[#1A1A3A]/60 tracking-widest ml-1 mb-4">Rango de precio (€)</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="number"
                      placeholder="Min"
                      value={filters.price.min}
                      onChange={(e) => setFilters({ price: { ...filters.price, min: e.target.value } })}
                      className="w-full h-14 bg-[#E0E5EC] rounded-2xl px-5 text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] outline-none border-none focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all"
                    />
                  </div>
                  <div className="w-4 h-0.5 bg-[#1A1A3A]/20"></div>
                  <div className="flex-1 relative">
                    <input 
                      type="number"
                      placeholder="Max"
                      value={filters.price.max}
                      onChange={(e) => setFilters({ price: { ...filters.price, max: e.target.value } })}
                      className="w-full h-14 bg-[#E0E5EC] rounded-2xl px-5 text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] outline-none border-none focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Toggle Solo Verificados */}
              <section>
                <button 
                  onClick={() => setFilters({ onlyVerified: !filters.onlyVerified })}
                  className="w-full flex items-center justify-between p-6 bg-[#E0E5EC] rounded-3xl shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5)] transition-all"
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <span className="font-black text-[#1A1A3A]">Solo Verificados</span>
                    <span className="text-[10px] font-bold text-[#1A1A3A]/40 uppercase tracking-widest">Panas con identidad validada</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${filters.onlyVerified ? 'bg-[#003366]' : 'bg-gray-300'}`}>
                    <motion.div 
                      layout
                      className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center"
                      animate={{ x: filters.onlyVerified ? 24 : 0 }}
                    >
                      {filters.onlyVerified && <Check size={10} className="text-[#003366]" />}
                    </motion.div>
                  </div>
                </button>
              </section>
            </div>

            {/* Footer Actions - Sticky */}
            <div className="p-8 pt-4 bg-[#E0E5EC] flex gap-4 border-t border-white/10">
              <button 
                onClick={resetFilters}
                className="flex-1 h-16 bg-[#E0E5EC] rounded-[2rem] font-bold text-[#1A1A3A] shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,0.8)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6)] transition-all"
              >
                Limpiar
              </button>
              <button 
                onClick={handleApply}
                className="flex-[2] h-16 bg-[#1A1A3A] rounded-[2rem] font-black text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 transition-all"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
