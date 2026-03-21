import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, ChevronDown, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

const REGIONS = {
  España: ["Madrid", "Barcelona", "Valencia", "Andalucía", "Canarias"],
  USA: ["Florida", "Texas", "New York", "California"],
  Chile: ["Santiago", "Valparaíso", "Biobío"],
  Colombia: ["Antioquia", "Bogotá", "Valle del Cauca"]
};

export default function DynamicLocalization({ isOpen, onClose }) {
  const { setCountry, setRegion, setFilters } = useStore();
  const [selectedCountry, setSelectedCountry] = useState('España');
  const [selectedRegion, setSelectedRegion] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const countryCode = selectedCountry === 'España' ? 'ES' : 'USA'; // Simple mapping for now
    setCountry(countryCode);
    setRegion(selectedRegion);
    setFilters({ location: { level1: selectedRegion, level2: selectedRegion, level3: '' } });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-pana-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-pana-blue">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full shadow-clay-card flex items-center justify-center text-pana-blue mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-pana-blue">Tu Ubicación</h2>
            <p className="text-gray-500 text-sm mt-1 text-center">Selecciona dónde quieres encontrar a tus panas.</p>
          </div>

          <div className="space-y-4">
            {/* Country Selector */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">País</label>
              <div className="relative">
                <select 
                  className="w-full h-12 px-4 bg-white rounded-xl shadow-[inset_2px_2px_5px_#e5e5eb,inset_-2px_-2px_5px_#ffffff] appearance-none focus:outline-none focus:ring-2 focus:ring-pana-yellow text-pana-blue font-bold tracking-wide"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedRegion(''); // Reset region
                  }}
                >
                  {Object.keys(REGIONS).map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-pana-blue w-5 h-5 pointer-events-none" />
              </div>
            </div>

            {/* Region Selector */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Región / Estado / Comunidad</label>
              <div className="relative">
                <select 
                  className="w-full h-12 px-4 bg-white rounded-xl shadow-[inset_2px_2px_5px_#e5e5eb,inset_-2px_-2px_5px_#ffffff] appearance-none focus:outline-none focus:ring-2 focus:ring-pana-yellow text-gray-700 font-medium disabled:opacity-50"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  disabled={!selectedCountry}
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  {REGIONS[selectedCountry]?.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!selectedRegion}
            className="w-full mt-8 bg-pana-blue text-white h-14 rounded-2xl font-bold text-lg shadow-[0_5px_15px_rgba(26,26,58,0.3)] disabled:opacity-50 hover:bg-[#2D2D5E] transition-colors relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Confirmar Ubicación
            </span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
