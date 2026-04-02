import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, ChevronDown, X, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useLocationStore } from '../../store/useLocationStore';

export default function DynamicLocalization({ isOpen, onClose }) {
  const { selectedCountry, setCountry, setRegion, setFilters, setHasChosenCountry } = useStore();
  const { countries, init } = useLocationStore();
  const [pickedCountry, setPickedCountry] = useState('');
  const [suspendedCountry, setSuspendedCountry] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsub = init();
    return () => unsub();
  }, [init]);

  // Pre-select current country each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setPickedCountry(selectedCountry || '');
      setSuspendedCountry(null);
      setIsDropdownOpen(false);
    }
  }, [isOpen, selectedCountry]);

  if (!isOpen) return null;

  // Only show active and suspended countries (not hidden)
  const visibleCountries = countries.filter(c => c.status !== 'hidden');
  const activeCountryInfo = countries.find(c => c.id === pickedCountry);

  const handleSelectCountry = (country) => {
    if (country.status === 'suspended') {
      setSuspendedCountry(country);
      return;
    }
    setPickedCountry(country.id);
    setIsDropdownOpen(false);
  };

  const handleSave = () => {
    if (!pickedCountry) return;
    setCountry(pickedCountry);
    setHasChosenCountry(true);
    setRegion('');
    setFilters({ location: { level1: '', level2: '', level3: '' } });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#E0E5EC] w-full max-w-sm rounded-[2.5rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative"
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-[#E0E5EC] rounded-full shadow-[8px_8px_16px_rgba(163,177,198,0.6),-8px_-8px_16px_rgba(255,255,255,1)] flex items-center justify-center text-[#0056B3] mb-4">
              <MapPin className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#1A1A3A]">Cambiar Ubicación</h2>
            <p className="text-gray-500 text-xs font-bold mt-1 text-center">Selecciona el país donde quieres explorar.</p>
          </div>

          {/* Country Dropdown */}
          <div className="relative z-20 mb-6">
            <label className="text-[10px] font-black text-[#1A1A3A]/50 uppercase tracking-widest ml-2 mb-1 block">País</label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] flex items-center justify-between font-bold text-[#1A1A3A]"
            >
              {activeCountryInfo ? (
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{activeCountryInfo.flag}</span>
                  <span>{activeCountryInfo.name}</span>
                </span>
              ) : (
                <span className="text-[#1A1A3A]/40">Selecciona tu país...</span>
              )}
              <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 max-h-56 overflow-y-auto"
                >
                  {visibleCountries.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400 font-bold">No hay países disponibles</div>
                  ) : (
                    visibleCountries.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCountry(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors font-bold text-sm ${
                          pickedCountry === c.id ? 'bg-blue-50 text-[#0056B3]' : 'text-[#1A1A3A]'
                        } ${c.status === 'suspended' ? 'opacity-60' : ''}`}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span className="flex-1 text-left">{c.name}</span>
                        {c.status === 'suspended' && (
                          <span className="text-[9px] px-2 py-0.5 border border-orange-400/50 text-orange-500 rounded-full font-black uppercase">Pronto</span>
                        )}
                        {pickedCountry === c.id && <Check size={14} className="text-[#0056B3]" />}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleSave}
            disabled={!pickedCountry}
            className="w-full mt-2 bg-[#1A1A3A] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_8px_20px_rgba(26,26,58,0.2)] disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Confirmar País
          </button>
        </motion.div>
      </div>

      {/* Modal Suspendido */}
      {suspendedCountry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSuspendedCountry(null)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center"
          >
            <span className="text-5xl block mb-4">{suspendedCountry.flag}</span>
            <h3 className="text-xl font-black text-[#1A1A3A] mb-3">{suspendedCountry.name}</h3>
            <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-2xl mb-6 border border-orange-100">
              <AlertCircle className="text-orange-500 shrink-0" size={20} />
              <p className="text-sm font-bold text-orange-700 text-left">{suspendedCountry.suspendedMessage}</p>
            </div>
            <button
              onClick={() => setSuspendedCountry(null)}
              className="w-full bg-[#1A1A3A] text-white py-3 rounded-2xl font-black text-sm uppercase tracking-widest"
            >
              Entendido Pana
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
