import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, MessageSquare, X } from 'lucide-react';
import { useDialogStore } from '../../store/useDialogStore';

// Genera un sutil y rápido sonido pop
const playPopSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch(e) {
    // Si el navegador bloquea AudioContext por no tener interacción previa, ignoramos suavemente
    console.debug('No se pudo reproducir el sonido de la alerta:', e);
  }
};

export default function CustomDialog() {
  const { 
    isOpen, 
    type, 
    title, 
    message, 
    inputValue: defaultInputValue,
    confirmText,
    cancelText, 
    onConfirm 
  } = useDialogStore();

  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      playPopSound();
      setInputVal(defaultInputValue || '');
      if (type === 'prompt') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, defaultInputValue, type]);

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputVal);
    } else {
      onConfirm(true);
    }
  };

  const handleCancel = () => {
    if (type === 'prompt') {
      onConfirm(null);
    } else {
      onConfirm(false);
    }
  };

  const getIcon = () => {
    if (type === 'alert') return <AlertCircle size={28} className="text-[#D90429]" />;
    if (type === 'confirm') return <HelpCircle size={28} className="text-[#FFB400]" />;
    if (type === 'prompt') return <MessageSquare size={28} className="text-[#0056B3]" />;
    return <AlertCircle size={28} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop con Blur Opcional (No se cierra al tocarlo según solicitud) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#1A1A3A]/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[#EDEDF5] rounded-[32px] overflow-hidden shadow-[20px_20px_60px_rgba(0,0,0,0.15),-10px_-10px_30px_rgba(255,255,255,0.8)] border border-white/60 p-6 flex flex-col items-center text-center"
          >
            {/* Header / Icono */}
            <div className="w-16 h-16 rounded-[24px] bg-[#E8E8F0] shadow-[inset_4px_4px_8px_rgba(180,180,210,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.9),4px_4px_10px_rgba(180,180,210,0.3)] flex items-center justify-center mb-4">
              {getIcon()}
            </div>

            {/* Texto */}
            <h3 className="text-xl font-black text-[#1A1A3A] mb-2 leading-tight">
              {title}
            </h3>
            <p className="text-[13px] font-bold text-[#666688] mb-6 px-2 leading-relaxed">
              {message}
            </p>

            {/* Prompt Input */}
            {type === 'prompt' && (
              <div className="w-full mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                  }}
                  className="w-full px-5 py-[14px] bg-[#E8E8F0] rounded-[18px] outline-none border-none shadow-[inset_4px_4px_8px_rgba(180,180,210,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A] focus:shadow-[inset_4px_4px_8px_rgba(180,180,210,0.7),inset_-4px_-4px_8px_rgba(255,255,255,1),0_0_0_2px_#FFB400_inset] transition-all"
                />
              </div>
            )}

            {/* Acciones */}
            <div className="w-full flex gap-3 mt-auto">
              {(type === 'confirm' || type === 'prompt') && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-[14px] rounded-[18px] bg-[#E8E8F0] text-[#1A1A3A] font-black text-[13px] shadow-[4px_4px_10px_rgba(180,180,210,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:shadow-[inset_2px_2px_5px_rgba(180,180,210,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] active:scale-95 transition-all text-center"
                >
                  {cancelText}
                </button>
              )}
              
              <button
                onClick={handleConfirm}
                className="flex-1 py-[14px] rounded-[18px] bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] text-white font-black text-[13px] shadow-[4px_6px_14px_rgba(26,26,58,0.3),-2px_-2px_6px_rgba(255,255,255,0.5)] active:scale-95 transition-all text-center"
              >
                {confirmText}
              </button>
            </div>
            
            {/* Close visual x in the corner */}
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#EDEDF5] text-gray-400 hover:text-[#D90429] hover:bg-white shadow-[2px_2px_5px_rgba(180,180,210,0.4),-2px_-2px_5px_rgba(255,255,255,0.9)] active:scale-95 transition-all outline-none"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
