import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LegalDrawer({ isOpen, onClose, title, content }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, title]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30"
            style={{ zIndex: 9998, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />

          {/* Mobile: side drawer */}
          <motion.div
            key="drawer-mobile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-y-0 right-0 w-[90vw] rounded-l-[40px] flex flex-col font-sans bg-white"
            style={{ zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <DrawerContent contentRef={contentRef} title={title} content={content} onClose={onClose} />
          </motion.div>

          {/* Desktop: centered modal */}
          <div
            className="hidden md:flex fixed flex-col font-sans bg-white rounded-[2rem]"
            style={{
              zIndex: 9999,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60vw',
              maxWidth: '860px',
              height: '80vh',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <DrawerContent contentRef={contentRef} title={title} content={content} onClose={onClose} />
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DrawerContent({ contentRef, title, content, onClose }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-8 pb-5 border-b border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F4F4F8] text-[#1A1A3A] shrink-0 transition-all active:scale-95"
          style={{ boxShadow: '4px 4px 10px rgba(163,177,198,0.5), -4px -4px 10px rgba(255,255,255,0.9)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-black text-[#1A1A3A] leading-tight truncate">{title}</h2>
          <p className="text-[11px] font-bold text-[#8888AA] mt-0.5">App Mi Pana · Documentación Legal</p>
        </div>
        <div className="w-1 h-8 rounded-full bg-[#FFD700] shrink-0" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[#2D2D4E] font-medium">
          {content}
        </div>
        <div className="h-10" />
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4 shrink-0 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-[20px] bg-[#1A1A3A] text-white font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
          style={{ boxShadow: '0 10px 30px rgba(26,26,58,0.25)' }}
        >
          Cerrar
        </button>
      </div>
    </>
  );
}
