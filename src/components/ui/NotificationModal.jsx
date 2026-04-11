import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, ExternalLink, Trash2, Lightbulb } from 'lucide-react';
import { useEffect } from 'react';
import { playPopSound } from '../../utils/audio';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  loading = false, 
  onDismissOne, 
  onDismissAll 
}) {

  useEffect(() => {
    if (isOpen) {
      playPopSound();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1A3A]/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-[#EDEDF5] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/60"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Bell size={20} className="text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Tus notificaciones</h3>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Acciones Globales (si hay notificaciones) */}
            {!loading && notifications.length > 0 && (
              <div className="px-5 pt-4 pb-1 flex justify-end">
                <button 
                  onClick={onDismissAll}
                  className="flex items-center gap-1 text-[10px] uppercase font-black text-gray-500 hover:text-red-500 transition-colors tracking-wider"
                >
                  <Trash2 size={12} /> Borrar todo
                </button>
              </div>
            )}

            {/* List */}
            {/* max-h-[300px] para mostrar aprox los ultimos 3 items antes del scroll */}
            <div className={`flex-1 overflow-y-auto max-h-[300px] p-5 space-y-4 custom-scrollbar ${loading || notifications.length === 0 ? 'pt-12 pb-12' : 'pt-2'}`}>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-[#0056B3] rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#1A1A3A]">Buscando novedades...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-[24px] bg-white shadow-inner flex items-center justify-center mb-4">
                    <Bell size={32} className="text-gray-200" />
                  </div>
                  <p className="text-[#1A1A3A] font-black text-sm uppercase">Sin notificaciones</p>
                  <p className="text-[12px] text-gray-400 font-bold mt-1 px-8">Te mantendremos al tanto cuando tengamos noticias para ti.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white p-3.5 rounded-2xl shadow-[4px_4px_10px_rgba(180,180,210,0.4)] border border-white flex flex-col gap-1 relative group"
                  >
                    <div className="flex justify-between items-center pr-6 mb-0.5">
                      <span className="text-[9px] font-black text-gray-400 flex items-center gap-1 uppercase bg-gray-50 px-2 py-0.5 rounded-full">
                        <Clock size={10} /> {notif.sentAt?.toDate ? new Date(notif.sentAt.toDate()).toLocaleDateString() : 'Recientemente'}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-black text-[#1A1A3A] pr-6 leading-tight">{notif.title}</h4>
                    <p className="text-[11px] font-medium text-gray-500 leading-tight pr-6">{notif.body}</p>

                    {/* Botón borrar individual */}
                    <button 
                      onClick={() => onDismissOne(notif.id)}
                      className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Quitar"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Tip */}
            <div className="p-4 bg-white/40 border-t border-white/60 flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={16} className="text-yellow-600" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold text-gray-500 leading-tight pr-2">
                Recuerda habilitar los permisos en tu navegador para recibir alertas en tiempo real.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
