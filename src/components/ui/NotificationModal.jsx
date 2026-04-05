import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, Clock, ExternalLink, Mail, MessageCircle, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export default function NotificationModal({ isOpen, onClose }) {
  const { userData, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Consultamos las notificaciones globales (adminNotifications)
        // que coincidan con el país del usuario o sean para 'all'
        const userCountry = userData?.country || 'all';
        const q = query(
          collection(db, 'adminNotifications'),
          where('targetCountry', 'in', ['all', userCountry]),
          orderBy('sentAt', 'desc'),
          limit(20)
        );
        
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(list);
      } catch (err) {
        console.error('Error fetch notifs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, userData?.country]);

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
                  <h3 className="font-black text-lg leading-tight">Centro de Notificaciones</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#FFD700]/80">Tus novedades Pana</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[450px] p-5 space-y-4 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-[#0056B3] rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest">Buscando novedades...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    className="bg-white p-4 rounded-2xl shadow-[4px_4px_10px_rgba(180,180,210,0.4)] border border-white flex flex-col gap-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Comunicado Oficial</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 flex items-center gap-1 uppercase">
                        <Clock size={10} /> {notif.sentAt?.toDate ? new Date(notif.sentAt.toDate()).toLocaleDateString() : 'Recientemente'}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-black text-[#1A1A3A]">{notif.title}</h4>
                    <p className="text-[11px] font-medium text-gray-500 leading-relaxed">{notif.body}</p>
                    
                    {notif.actionUrl && (
                      <a 
                        href={notif.actionUrl}
                        className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-[#0056B3] hover:underline"
                      >
                        Ver más detalles <ExternalLink size={10} />
                      </a>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-white/40 border-t border-white/60 flex flex-col items-center gap-3">
              <p className="text-[10px] font-bold text-gray-400 text-center px-6 leading-tight">
                Recuerda habilitar los permisos en tu navegador para recibir alertas en tiempo real.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Cerrar Bandeja
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
