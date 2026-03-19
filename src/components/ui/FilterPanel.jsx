import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check, Coffee, Package, Smile, Monitor, Wrench, ShoppingBag, Briefcase, Heart, Navigation, MapPin, Building, Home as HomeIcon } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { useStore } from '../../store/useStore';
import { LOCATION_DATA } from '../../data/locations';

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
  const { isFilterOpen, setIsFilterOpen, filters, setFilters, activeCategory, setActiveCategory, selectedCountry } = useStore();
  const [isLocating, setIsLocating] = useState(false);

  const countryData = LOCATION_DATA[selectedCountry] || LOCATION_DATA['ES'];
  
  // Opciones derivadas para los selectores
  const level1Options = Object.keys(countryData.data);
  const level2Options = filters.location.level1 ? Object.keys(countryData.data[filters.location.level1] || {}) : [];
  const level3Options = (filters.location.level1 && filters.location.level2) 
    ? (countryData.data[filters.location.level1]?.[filters.location.level2] || []) 
    : [];

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
      onlyVerified: false,
      location: { level1: '', level2: '', level3: '' }
    });
    setActiveCategory(null);
  };

  const handleGeolocation = async () => {
    try {
      setIsLocating(true);
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        alert("Permiso de ubicación denegado.");
        setIsLocating(false);
        return;
      }

      await Geolocation.getCurrentPosition();
      
      // Simulación de Geocodificación Inversa (Mock "Madrid")
      // En producción: fetch a API de OpenStreetMap o Google Maps con coords
      setFilters({
        location: {
          level1: selectedCountry === 'ES' ? 'Madrid' : 'Bogotá', // Mock Inteligente
          level2: selectedCountry === 'ES' ? 'Madrid' : 'Bogotá',
          level3: '',
        }
      });
    } catch (error) {
      console.error('Error getting location', error);
      alert("No se pudo obtener la ubicación.");
    } finally {
      setIsLocating(false);
    }
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
              {/* UBICACIÓN INTELIGENTE */}
              <section className="space-y-4">
                <button 
                  onClick={handleGeolocation}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 h-14 bg-[#1A1A3A] text-white rounded-2xl font-bold shadow-[0_8px_16px_rgba(26,26,58,0.2)] active:scale-95 transition-all disabled:opacity-70"
                >
                  <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
                  {isLocating ? 'Localizando...' : 'Usar mi ubicación actual'}
                </button>

                <div className="space-y-3 pt-2">
                  {/* Nivel 1: Provincia / Departamento */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 z-10">
                      <MapPin size={18} />
                    </div>
                    <select
                      value={filters.location.level1}
                      onChange={(e) => setFilters({ location: { level1: e.target.value, level2: '', level3: '' } })}
                      className="w-full h-14 pl-12 pr-10 bg-[#E0E5EC] rounded-2xl text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] outline-none border-none appearance-none focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all cursor-pointer"
                    >
                      <option value="">{countryData.labels.level1}</option>
                      {level1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  {/* Nivel 2: Municipio / Ciudad */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 z-10">
                      <Building size={18} />
                    </div>
                    <select
                      value={filters.location.level2}
                      onChange={(e) => setFilters({ location: { ...filters.location, level2: e.target.value, level3: '' } })}
                      disabled={!filters.location.level1}
                      className="w-full h-14 pl-12 pr-10 bg-[#E0E5EC] rounded-2xl text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] outline-none border-none appearance-none focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">{countryData.labels.level2}</option>
                      {level2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  {/* Nivel 3: Barrio / Comuna */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 z-10">
                      <HomeIcon size={18} />
                    </div>
                    <select
                      value={filters.location.level3}
                      onChange={(e) => setFilters({ location: { ...filters.location, level3: e.target.value } })}
                      disabled={!filters.location.level2}
                      className="w-full h-14 pl-12 pr-10 bg-[#E0E5EC] rounded-2xl text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] outline-none border-none appearance-none focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">{countryData.labels.level3} (Opcional)</option>
                      {level3Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </section>

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
