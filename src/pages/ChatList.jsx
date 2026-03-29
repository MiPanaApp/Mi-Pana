import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToConversations, deleteConversation, deleteAllConversations } from '../lib/chat';
import { getCategoryIcon } from '../data/categories';
import { FiPlus } from 'react-icons/fi';
import panaSelfie from '../assets/pana_selfie.png';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'ayer';
  return `${days}d`;
}

// Componente para cada item con Swipe-to-delete
const SwipeableChat = ({ chat, user, onDelete, onNavigate }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Fondo rojo aparece al deslizar izquierda
  const background = useTransform(
    x,
    [-150, -50, 0],
    ["rgba(220,38,38,1)", "rgba(220,38,38,0.8)", "rgba(220,38,38,0)"]
  );
  
  // Opacidad y escala del icono papelera
  const trashOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const trashScale = useTransform(x, [-100, -40, 0], [1.2, 0.8, 0.5]);

  const handleDragEnd = async (_, info) => {
    const threshold = window.innerWidth * 0.4;
    
    if (info.offset.x < -threshold) {
      // Supera el umbral → animar salida y eliminar
      await controls.start({
        x: -window.innerWidth,
        opacity: 0,
        transition: { duration: 0.25, ease: "easeOut" }
      });
      onDelete(chat.id);
    } else {
      // No supera → volver a posición original
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 400, damping: 30 }
      });
    }
  };

  const isMobile = window.innerWidth < 768;
  const unread = chat.unreadCount?.[user?.uid] || 0;
  const isMeSeller = chat.participants?.[1] === user?.uid;
  const otherName = isMeSeller ? (chat.buyerName || 'Comprador') : chat.sellerName;
  const otherAvatar = isMeSeller ? chat.buyerAvatar : chat.sellerAvatar;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-1 chat-item touch-action-pan-y">
      {/* Fondo rojo con papelera (Solo visible al deslizar) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
        style={{ background }}
      >
        <motion.div
          style={{ opacity: trashOpacity, scale: trashScale }}
          className="flex flex-col items-center gap-1"
        >
          <Trash2 className="text-white w-6 h-6" />
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">Eliminar</span>
        </motion.div>
      </motion.div>

      {/* Tarjeta de conversación deslizable */}
      <motion.div
        style={{ x }}
        animate={controls}
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        onClick={() => onNavigate(chat.id)}
        className="relative bg-[#E0E5EC] cursor-grab active:cursor-grabbing"
        whileTap={isMobile ? { cursor: "grabbing" } : {}}
      >
        <div className="flex flex-col px-4 bg-[#E0E5EC] transition-all hover:bg-[#E8E8F0]">
          <div className="flex items-center gap-4 py-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A3A]/10 overflow-hidden shadow-[3px_3px_6px_rgba(163,177,198,0.3),-3px_-3px_6px_rgba(255,255,255,0.6)]">
                {otherAvatar ? (
                  <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#1A1A3A]/40">
                    {otherName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {unread > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D90429] rounded-full flex items-center justify-center shadow-md">
                  <span className="text-[9px] font-black text-white">{unread > 9 ? '9+' : unread}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <p className={`font-black text-sm text-[#1A1A3A] truncate pr-2 ${unread > 0 ? '' : 'opacity-70'}`}>
                  {otherName}
                </p>
                <span className="text-[10px] text-[#1A1A3A] font-black whitespace-nowrap opacity-60">
                  {timeAgo(chat.lastMessageTime)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5 overflow-hidden">
                {(() => {
                  const IconComp = getCategoryIcon(chat.productCategory) || FiPlus;
                  return <IconComp size={10} className="text-[#1A1A3A]/60 flex-shrink-0" />;
                })()}
                <p className="text-[11px] font-bold text-[#1A1A3A] truncate">
                  {chat.productCategory ? `${chat.productCategory} / ` : ''}{chat.productName}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-xs truncate flex-1 ${unread > 0 ? 'font-bold text-[#1A1A3A]' : 'text-[#1A1A3A]/50 font-medium'}`}>
                  {chat.lastMessage || 'Conversación iniciada'}
                </p>
                
                {/* Botón borrar visible en Desktop */}
                {!isMobile && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(chat.id, true);
                    }}
                    className="ml-2 p-1.5 text-[#D90429] hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar chat"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Línea tricolor divisoria */}
          <div className="flex w-full h-[1.5px] opacity-100 mb-0.5">
            <div className="flex-1 bg-[#FFCC00]"></div>
            <div className="flex-1 bg-[#003366]"></div>
            <div className="flex-1 bg-[#D90429]"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = conversations.filter(c =>
    c.productName?.toLowerCase().includes(search.toLowerCase()) ||
    c.sellerName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount?.[user?.uid] || 0), 0);

  const handleDeleteAll = async () => {
    if (window.confirm('¿Estás seguro de que quieres borrar TODAS tus conversaciones?')) {
      try {
        await deleteAllConversations(user?.uid);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteOne = async (convId, isDesktop = false) => {
    if (isDesktop && !window.confirm('¿Borrar esta conversación?')) return;
    
    try {
      await deleteConversation(convId);
      // El estado se actualiza por el onSnapshot (subscribeToConversations)
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] pb-24 chat-list-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#E0E5EC]/90 backdrop-blur-xl px-5 pt-0 pb-3">
          <div className="flex items-center justify-between mb-4 pt-4">
            <div>
              <h1 className="text-2xl font-black text-[#1A1A3A] -mt-1 md:mt-0">Mensajes</h1>
              {totalUnread > 0 && (
                <p className="text-xs font-bold text-[#D90429]">{totalUnread} sin leer</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {conversations.length > 0 && (
                <button 
                  onClick={handleDeleteAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#E8E8F0] shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.7)] rounded-xl text-[10px] font-black text-[#D90429] active:scale-95 transition-transform"
                >
                  <Trash2 size={12} /> Borrar todo
                </button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full h-11 pl-10 pr-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] text-sm font-semibold text-[#1A1A3A] placeholder:text-[#1A1A3A]/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-4 mt-2">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#1A1A3A]/20 border-t-[#1A1A3A] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-48 h-48 mb-2 drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                <img src={panaSelfie} alt="Pana" className="w-full h-full object-contain" />
              </div>
              <p className="text-lg font-black text-[#1A1A3A]/40 tracking-wide">
                {search ? 'Sin resultados' : 'Aún no tienes chats'}
              </p>
              <p className="text-sm text-[#1A1A3A]/30 font-medium text-center px-8">
                {!search && 'Inicia una conversación desde un anuncio tocando "Chat Pana"'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout text-left">
              {filtered.map((chat) => (
                <SwipeableChat
                  key={chat.id}
                  chat={chat}
                  user={user}
                  onDelete={handleDeleteOne}
                  onNavigate={(id) => navigate(`/chat/${id}`)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .chat-item { user-select: none; -webkit-user-select: none; }
        .touch-action-pan-y { touch-action: pan-y !important; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
