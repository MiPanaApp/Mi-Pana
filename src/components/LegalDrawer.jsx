import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LegalDrawer({ isOpen, onClose, title, content }) {
  const contentRef = useRef(null);

  // Reset scroll when a new document opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, title]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/30"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed z-[1000] flex flex-col font-sans bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]
                       inset-y-0 right-0 w-[90vw] rounded-l-[40px]
                       md:inset-0 md:m-auto md:w-[65vw] md:max-w-4xl md:h-[85vh] md:rounded-[3rem]"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 4px 0 20px rgba(255,215,0,0.06)'
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 pt-8 pb-5 border-b border-gray-100 shrink-0">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F4F4F8] text-[#1A1A3A] shrink-0 transition-all active:scale-95"
                style={{
                  boxShadow: '4px 4px 10px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9)'
                }}
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-black text-[#1A1A3A] leading-tight truncate">{title}</h2>
                <p className="text-[11px] font-bold text-[#8888AA] mt-0.5">App Mi Pana · Documentación Legal</p>
              </div>

              {/* Decorative accent bar */}
              <div className="w-1 h-8 rounded-full bg-[#FFD700] shrink-0" />
            </div>

            {/* Content area with custom yellow scrollbar */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-6 py-6 legal-scrollbar"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[#2D2D4E] font-medium">
                {content}
              </div>
              {/* Bottom breathing room */}
              <div className="h-10" />
            </div>

            {/* Footer button */}
            <div className="px-6 pb-8 pt-4 shrink-0 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-[20px] bg-[#1A1A3A] text-white font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
                style={{ boxShadow: '0 10px 30px rgba(26,26,58,0.25)' }}
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
