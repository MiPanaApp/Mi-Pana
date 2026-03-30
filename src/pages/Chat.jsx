import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Smile, X, CornerUpLeft, Check, CheckCheck, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { useAuthStore } from '../store/useAuthStore';
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  setTyping,
} from '../lib/chat';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCategoryIcon } from '../data/categories';
import { FiPlus } from 'react-icons/fi';
import panaExito from '../assets/pana_exito.png';
import ReviewModal from '../components/ReviewModal';
import { canUserReview } from '../lib/reviews';

// ─── Status icons ─────────────────────────────────────────────────────────────
function MessageStatus({ status, isMine }) {
  if (!isMine) return null;
  if (status === 'read') return <CheckCheck size={12} className="text-[#4FC3F7] ml-1 flex-shrink-0" />;
  if (status === 'delivered') return <CheckCheck size={12} className="text-white/50 ml-1 flex-shrink-0" />;
  return <Check size={12} className="text-white/50 ml-1 flex-shrink-0" />;
}

// ─── Formato hora ──────────────────────────────────────────────────────────────
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Bubble de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, onReply, isLast }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} group mb-1`}
      onTouchStart={() => setShowActions(true)}
      onTouchEnd={() => setTimeout(() => setShowActions(false), 2000)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-end gap-2 max-w-[78%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Botón responder */}
        <AnimatePresence>
          {showActions && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onReply(msg)}
              className="p-1.5 rounded-full bg-[#E0E5EC] shadow-md text-[#1A1A3A]/50 hover:text-[#1A1A3A] transition-colors flex-shrink-0 mb-1"
            >
              <CornerUpLeft size={13} />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          className={`rounded-[18px] px-4 py-2.5 shadow-sm ${
            isMine
              ? 'bg-[#1A1A3A] text-white rounded-tr-sm'
              : 'bg-white text-[#1A1A3A] rounded-tl-sm border border-gray-100'
          }`}
        >
          {/* Reply preview */}
          {msg.replyTo && (
            <div className={`mb-2 pl-3 border-l-2 ${isMine ? 'border-white/40' : 'border-[#FFC200]'} rounded`}>
              <p className={`text-[10px] font-black ${isMine ? 'text-white/60' : 'text-[#FFC200]'}`}>
                {msg.replyTo.senderName}
              </p>
              <p className={`text-[11px] ${isMine ? 'text-white/70' : 'text-[#1A1A3A]/60'} line-clamp-2`}>
                {msg.replyTo.text}
              </p>
            </div>
          )}

          <p className="text-sm leading-relaxed">{msg.text}</p>

          {/* Time + status */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
            <span className={`text-[9px] ${isMine ? 'text-white/50' : 'text-[#1A1A3A]/40'}`}>
              {formatTime(msg.timestamp)}
            </span>
            <MessageStatus status={msg.status} isMine={isMine} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuthStore();

  const goToProduct = () => {
    if (conversation?.productId) {
      navigate(`/perfil-producto?id=${conversation.productId}`);
    }
  };

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({ can: false, interactionId: null });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Scroll al final ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ─── Suscripción a mensajes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user) return;
    const unsub = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
      markMessagesAsRead({ conversationId, userId: user.uid });
    });
    return () => unsub();
  }, [conversationId, user]);

  // ─── Suscripción a conversación (typing, etc.) ──────────────────────────────
  useEffect(() => {
    if (!conversationId || !user) return;
    const unsub = subscribeToConversation(conversationId, (conv) => {
      setConversation(conv);
      const otherId = conv.participants?.find(p => p !== user.uid);
      setOtherIsTyping(conv.typing?.[otherId] || false);
    });
    return () => unsub();
  }, [conversationId, user]);

  // ─── Verificar si puede valorar ─────────────────────────────────────────────
  useEffect(() => {
    if (user && conversation?.productId && conversation?.participants) {
       const isMeSeller = conversation.participants[1] === user.uid || conversation.sellerId === user.uid;
       if (!isMeSeller) {
         canUserReview({ buyerId: user.uid, productId: conversation.productId })
           .then(res => setReviewStatus(res))
           .catch(err => console.error(err));
       }
    }
  }, [user, conversation]);

  // ─── Typing indicator ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setTyping({ conversationId, userId: user.uid, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId, userId: user.uid, isTyping: false });
    }, 2000);
  };

  // ─── Enviar mensaje ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    setReplyTo(null);
    setShowEmoji(false);
    clearTimeout(typingTimeoutRef.current);
    setTyping({ conversationId, userId: user.uid, isTyping: false });

    await sendMessage({
      conversationId,
      senderId: user.uid,
      text,
      replyTo: replyTo
        ? { messageId: replyTo.id, text: replyTo.text, senderName: replyTo.senderId === user.uid ? 'Tú' : (conversation?.sellerName || 'Pana') }
        : null,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setInputText(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // ─── Info del otro participante ─────────────────────────────────────────────
  const isMeSeller = conversation?.participants?.[1] === user?.uid;
  const otherId = conversation?.participants?.find(p => p !== user?.uid);
  const otherName = isMeSeller ? (conversation?.buyerName || 'Comprador') : (conversation?.sellerName || 'Vendedor');
  const otherAvatar = isMeSeller ? conversation?.buyerAvatar : conversation?.sellerAvatar;

  return (
    <div className="h-screen bg-[#D1D9E6] flex justify-center overflow-hidden">
      <div className="flex flex-col h-full w-full max-w-4xl bg-[#E0E5EC] shadow-2xl relative overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-[#1A1A3A] text-white px-4 pt-safe pb-4 pt-[50px] flex items-center gap-3 z-20 md:rounded-b-none rounded-b-3xl shadow-lg flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Avatar del otro participante */}
          <div 
            onClick={goToProduct}
            className="w-10 h-10 rounded-full overflow-hidden bg-white/20 shadow-inner flex-shrink-0 border-2 border-white/20 cursor-pointer active:opacity-70 transition-opacity"
            title="Ver anuncio"
          >
            {otherAvatar ? (
              <img src={otherAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-black text-white/40">
                {otherName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div 
            onClick={goToProduct}
            className="flex-1 min-w-0 cursor-pointer active:opacity-70 transition-opacity"
            title="Ver anuncio"
          >
            <p className="font-black text-base leading-tight truncate">{otherName || '...'}</p>
            <div className="flex items-center mt-0.5 overflow-hidden gap-1">
              <p className="text-[11px] text-[#FFC200] font-bold truncate">
                {conversation?.productName || '...'}
              </p>
              {conversation?.productId && (
                <ExternalLink size={10} className="text-[#FFC200] opacity-50 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Thumbnail del Producto y Botón Valorar */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {otherIsTyping && (
              <span className="text-[11px] text-[#FFC200] font-bold italic animate-pulse whitespace-nowrap hidden sm:inline">escribiendo...</span>
            )}

            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-white/10 bg-white/5 flex-shrink-0">
              <img 
                src={conversation?.productImage || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36'} 
                className="w-full h-full object-cover" 
                alt="Producto"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1599566150163-29194dcaad36';
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Mensajes ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar"
          onClick={() => setShowEmoji(false)}
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-[3px] border-[#1A1A3A]/20 border-t-[#1A1A3A] rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-40 h-40"
              >
                <img 
                  src={panaExito} 
                  alt="Mi Pana" 
                  className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)]"
                />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-black text-[#1A1A3A] mb-1">¡Inicia la conversación!</p>
                <p className="text-sm font-bold text-[#1A1A3A]/40">
                  Pregunta lo que necesites al pana.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.senderId === user?.uid}
                  onReply={setReplyTo}
                  isLast={i === messages.length - 1}
                />
              ))}

              {/* Typing bubble */}
              <AnimatePresence>
                {otherIsTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="flex justify-start mb-2"
                  >
                    <div className="bg-white rounded-[18px] rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay }}
                            className="w-1.5 h-1.5 bg-[#1A1A3A]/30 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Botón flotante de Valorar ── */}
        <AnimatePresence>
          {reviewStatus?.can && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="px-4 pb-2 flex justify-center flex-shrink-0"
            >
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] text-[#1A1A3A] font-black text-sm rounded-2xl shadow-[0_8px_20px_rgba(255,194,0,0.4)] hover:shadow-[0_12px_28px_rgba(255,194,0,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                <Star size={16} className="fill-[#1A1A3A]" />
                ¿Cómo fue el servicio de {otherName}? Valóralo ahora
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reply preview ── */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-4 py-2 flex items-center gap-3 flex-shrink-0"
            >
              <div className="flex-1 min-w-0 pl-3 border-l-4 border-[#FFC200]">
                <p className="text-[11px] font-black text-[#FFC200]">
                  {replyTo.senderId === user?.uid ? 'Tú' : otherName}
                </p>
                <p className="text-xs text-[#1A1A3A]/60 truncate">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 text-[#1A1A3A]/40 hover:text-[#D90429] transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Emoji Picker ── */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width="100%"
                height={320}
                searchPlaceholder="Buscar emoji..."
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Area ── */}
        <div className="bg-[#E0E5EC]/80 backdrop-blur-md border-t border-[#d0d8e4] px-3 pt-3 pb-[30px] md:pb-6 flex-shrink-0 flex justify-center">
          <div className="flex items-center gap-2 w-full max-w-3xl">
            {/* Emoji button */}
            <button
              onClick={() => { setShowEmoji(v => !v); inputRef.current?.focus(); }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                showEmoji
                  ? 'bg-[#FFC200] text-[#1A1A3A] shadow-inner'
                  : 'bg-[#E0E5EC] text-[#1A1A3A]/50 shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.8)]'
              }`}
            >
              <Smile size={18} />
            </button>

            {/* Input */}
            <input
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="flex-1 h-11 bg-[#E0E5EC] rounded-2xl px-4 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] text-sm font-semibold text-[#1A1A3A] placeholder:text-[#1A1A3A]/30 focus:outline-none"
            />

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                inputText.trim()
                  ? 'bg-[#1A1A3A] text-white shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)]'
                  : 'bg-[#E0E5EC] text-[#1A1A3A]/20 shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]'
              }`}
            >
              <Send size={16} className={inputText.trim() ? 'ml-0.5' : ''} />
            </motion.button>
          </div>
        </div>
        
        {/* ── Modal de Valoración ── */}
        <ReviewModal 
           isOpen={showReviewModal}
           onClose={() => setShowReviewModal(false)}
           interaction={{
             id: reviewStatus?.interactionId,
             sellerId: otherId,
             productId: conversation?.productId,
             productName: conversation?.productName,
           }}
           onSuccess={() => {
             setShowReviewModal(false);
             setReviewStatus({ can: false, interactionId: null });
           }}
        />
      </div>
    </div>
  );
}
