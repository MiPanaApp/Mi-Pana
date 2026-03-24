import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToConversations, deleteConversation, deleteAllConversations } from '../lib/chat';
import { getCategoryIcon } from '../data/categories';
import { FiPlus } from 'react-icons/fi';

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

  const handleDeleteOne = async (e, convId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('¿Borrar esta conversación?')) {
      try {
        await deleteConversation(convId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#E0E5EC]/90 backdrop-blur-xl px-5 pt-0 pb-3">
          <div className="flex items-center justify-between mb-4">
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
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-8 bg-[#E0E5EC] rounded-[3rem] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.8)]">
                <MessageCircle size={40} className="text-[#FFC200]" />
              </div>
              <p className="text-lg font-black text-[#1A1A3A]/40 tracking-wide">
                {search ? 'Sin resultados' : 'Aún no tienes chats'}
              </p>
              <p className="text-sm text-[#1A1A3A]/30 font-medium text-center px-8">
                {!search && 'Inicia una conversación desde un anuncio tocando "Chat Pana"'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((conv, i) => {
                const unread = conv.unreadCount?.[user?.uid] || 0;
                const isMeSeller = conv.participants?.[1] === user?.uid;
                const otherName = isMeSeller ? 'Comprador' : conv.sellerName;
                const otherAvatar = conv.sellerAvatar;

                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="flex flex-col cursor-pointer active:opacity-70 transition-all group relative"
                  >
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
                            {timeAgo(conv.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5 overflow-hidden">
                          {(() => {
                            const IconComp = getCategoryIcon(conv.productCategory) || FiPlus;
                            return <IconComp size={10} className="text-[#1A1A3A]/60 flex-shrink-0" />;
                          })()}
                          <p className="text-[11px] font-bold text-[#1A1A3A] truncate">
                            {conv.productCategory ? `${conv.productCategory} / ` : ''}{conv.productName}
                          </p>
                        </div>
                        <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-[#1A1A3A]' : 'text-[#1A1A3A]/50 font-medium'}`}>
                          {conv.lastMessage || 'Conversación iniciada'}
                        </p>
                      </div>
                    </div>

                    {/* Línea tricolor divisoria */}
                    <div className="flex w-full h-[1.5px] opacity-100">
                      <div className="flex-1 bg-[#FFCC00]"></div>
                      <div className="flex-1 bg-[#003366]"></div>
                      <div className="flex-1 bg-[#D90429]"></div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
