import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserCircle2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function IncompleteProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative z-10 w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-7 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] flex flex-col items-center text-center"
          >
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A]/50 hover:text-[#D90429] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
            >
              <X size={18} />
            </button>

            {/* Ícono */}
            <div className="w-16 h-16 rounded-2xl bg-[#E0E5EC] shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)] flex items-center justify-center mb-5">
              <UserCircle2 size={32} className="text-[#FFB400]" />
            </div>

            {/* Texto */}
            <h2 className="text-[19px] font-black text-[#1A1A3A] mb-2 leading-tight">
              ¡Epa! Antes de continuar...
            </h2>
            <p className="text-[13px] font-medium text-[#1A1A3A]/60 mb-6 leading-relaxed">
              Para hacer esto, necesitamos terminar de configurar tu perfil. Solo te tomará un momento.
            </p>

            {/* Botón principal */}
            <button
              onClick={() => { onClose(); navigate('/perfil'); }}
              className="w-full py-4 rounded-2xl bg-[#1A1A3A] text-white font-black text-sm uppercase tracking-wide shadow-[0_10px_20px_rgba(26,26,58,0.3)] active:scale-95 transition-all mb-3"
            >
              Completar perfil
            </button>

            {/* Botón secundario */}
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A]/50 font-bold text-sm shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
            >
              Ahora no
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
