import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check, Coffee, Package, Smile, Monitor, Wrench, ShoppingBag, Briefcase, Heart, Navigation, MapPin, Building, Home as HomeIcon } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import CustomSelect from './CustomSelect';
import { useStore } from '../../store/useStore';
import { LOCATION_DATA } from '../../data/locations';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { CATEGORIES as DEFAULT_CATEGORIES, getCategoryIcon, sortCategories } from '../../data/categories';

// Las categorías se cargan dinámicamente desde Firestore

export default function FilterPanel() {
  const navigate = useNavigate();
  const { 
    isFilterOpen, 
    setIsFilterOpen, 
    filters, 
    setFilters, 
    activeCategory, 
    setActiveCategory, 
    selectedCountry,
    setCountry,
    setRegion 
  } = useStore();
  const [isLocating, setIsLocating] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        if (!snap.empty) {
          const cats = snap.docs.map(d => ({
            id: d.data().name,
            name: d.data().name,
            icon: getCategoryIcon(d.data().name)
          }));
          setCategories(sortCategories(cats));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetch();
  }, []);

  const locationOptions = filters?.location || { level1: '', level2: '', level3: '' };

  const countryData = LOCATION_DATA[selectedCountry] || LOCATION_DATA['ES'];
  
  // Opciones derivadas para los selectores
  const level1Options = Object.keys(countryData.data);
  const level2Options = locationOptions.level1 ? Object.keys(countryData.data[locationOptions.level1] || {}) : [];
  const level3Options = (locationOptions.location?.level1 && locationOptions.location?.level2) 
    ? (countryData.data[locationOptions.location.level1]?.[locationOptions.location.level2] || []) 
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
    if (activeCategory && activeCategory !== 'Todas') {
      navigate(`/category/${encodeURIComponent(activeCategory)}`);
    } else {
      navigate('/home');
    }
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
      
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
           await Geolocation.requestPermissions();
        } else if (permission.location === 'denied') {
           alert("Permiso de ubicación denegado. Por favor actívalo en tu navegador/dispositivo.");
           setIsLocating(false);
           return;
        }
      } catch (e) {
        console.warn('Chequeo de permisos omitido en web:', e);
      }

      const pos = await Geolocation.getCurrentPosition();
      
      // Geocodificación Inversa Real usando API Nominatim (OpenStreetMap)
      let detectedCountry = selectedCountry;
      let detectedRegion = '';

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=es`);
        const data = await res.json();
        
        if (data && data.address) {
          detectedCountry = data.address.country_code ? data.address.country_code.toUpperCase() : selectedCountry;
          detectedRegion = data.address.state || data.address.region || data.address.province || data.address.city || '';
        }
      } catch (err) {
        console.warn("Aviso: No se pudo geocodificar, se usa aproximado.", err);
      }

      // Fallback a simulación si falla o el usuario bloquea el fetch pero sí dio GPS
      if (!detectedRegion) {
        detectedCountry = selectedCountry;
        detectedRegion = detectedCountry === 'ES' ? 'Madrid' : 'Bogotá';
      }

      // 1. Actualizar el País en el Store
      setCountry(detectedCountry);
      
      // 2. Actualizar la Región en el Store
      setRegion(detectedRegion);

      // 3. Aplicar Filtros de Ubicación
      setFilters({
        location: {
          level1: detectedRegion, 
          level2: detectedRegion,
          level3: '',
        }
      });

      // 4. Cerrar el panel y navegar al Home
      setIsFilterOpen(false);
      navigate('/home');

    } catch (error) {
      console.error('Error getting location', error);
      alert("No se pudo obtener la ubicación. Asegúrate de tener el GPS activado y dar permisos al navegador.");
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
          
          {/* Panel Wrapper */}
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center pointer-events-none">
            {/* Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-[#E0E5EC] shadow-2xl w-full md:w-[500px] h-[95dvh] md:h-auto md:max-h-[85vh] rounded-t-[3rem] md:rounded-[3rem] flex flex-col pointer-events-auto overflow-hidden"
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
                  <CustomSelect
                    icon={MapPin}
                    placeholder={countryData.labels.level1}
                    value={locationOptions.level1}
                    onChange={(val) => setFilters({ location: { level1: val, level2: '', level3: '' } })}
                    options={level1Options}
                  />

                  {/* Nivel 2: Municipio / Ciudad */}
                  <CustomSelect
                    icon={Building}
                    placeholder={countryData.labels.level2}
                    value={locationOptions.level2}
                    onChange={(val) => setFilters({ location: { ...locationOptions, level2: val, level3: '' } })}
                    options={level2Options}
                    disabled={!locationOptions.level1}
                  />
                </div>
              </section>

              {/* Categorías */}
              <section>
                <h3 className="text-sm font-bold text-[#1A1A3A]/60 tracking-widest ml-1 mb-4">Categoría</h3>
                <div className="grid grid-cols-4 gap-3">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.name;
                    return (
                      <button
                        key={cat.name || cat.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveCategory(isSelected ? 'Todas' : cat.name);
                        }}
                        className={`group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 w-full border ${
                          isSelected 
                          ? 'bg-[#D90429] text-white shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] scale-95 border-transparent' 
                          : 'bg-[#E0E5EC] text-[#1A1A3A] hover:bg-[#D90429] hover:text-white shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] border-white/50'
                        }`}
                      >
                        <cat.icon size={18} className={`mb-0.5 transition-colors ${isSelected ? 'text-white' : 'text-[#1A1A3A] group-hover:text-white'}`} />
                        <span className={`text-[10px] font-bold mt-1 text-center truncate w-full transition-colors ${isSelected ? 'text-white' : 'text-[#1A1A3A] group-hover:text-white'}`}>{cat.name}</span>
                      </button>
                    );
                  })}
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
                  <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${filters.onlyVerified ? 'bg-[#FFCC00] shadow-[inset_1px_1px_3px_rgba(204,163,0,0.6)]' : 'bg-gray-300 shadow-inner'}`}>
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
        </div>
      </>
    )}
    </AnimatePresence>
  );
}
