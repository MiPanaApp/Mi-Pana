import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder, icon: Icon, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={containerRef}>
      {/* Botón Principal Selector */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-16 pl-12 pr-10 bg-[#E0E5EC] rounded-2xl flex items-center justify-between text-[#1A1A3A] font-black shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.6)] transition-all cursor-pointer"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 z-10">
          <Icon size={20} />
        </div>
        
        <span className="truncate w-full text-left text-base">
          {value || placeholder}
        </span>
        
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 pointer-events-none">
          <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Menú Desplegable Glassmorphic */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl z-[1001] max-h-60 overflow-y-auto no-scrollbar"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleSelect('')}
                className={`w-full text-left px-5 py-4 rounded-xl transition-all font-black text-base ${!value ? 'bg-[#1A1A3A] text-white shadow-md' : 'text-[#1A1A3A]/60 hover:bg-black/5'}`}
              >
                {placeholder}
              </button>
              
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-5 py-4 rounded-xl transition-all font-bold text-base ${value === opt ? 'bg-[#1A1A3A] text-white shadow-md' : 'text-[#1A1A3A] hover:bg-black/5'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
