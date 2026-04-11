import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import { useEffect } from 'react';
import { playPopSound } from '../utils/audio';

export default function InfoModal({ isOpen, onClose, title, content }) {
  
  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      playPopSound();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10005] flex items-end md:items-center justify-center">
          
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/40 backdrop-blur-md"
          />

          {/* Contenedor Modal / Drawer */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full md:max-w-4xl bg-white rounded-t-[35px] md:rounded-[30px] shadow-[0_-20px_40px_rgba(0,0,0,0.05),20px_20px_60px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden h-[85vh] md:h-auto md:max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0056B3]/10 flex items-center justify-center text-[#0056B3]">
                  <Info size={22} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#1A1A3A] tracking-tight">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-gray-500 hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido con Scroll Custom */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div 
                className="prose prose-slate max-w-none text-[#555577] font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Footer / Cierre Visual */}
            <div className="p-6 bg-gray-50/50 flex justify-center md:hidden">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
