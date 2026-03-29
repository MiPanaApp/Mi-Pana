import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { submitReview } from '../lib/reviews';
import { useAuthStore } from '../store/useAuthStore';
import { useAuth } from '../context/AuthContext';

export default function ReviewModal({ isOpen, onClose, interaction, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const { userData } = useAuth();

  if (!isOpen || !interaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor, selecciona una calificación.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await submitReview({
        interactionId: interaction.id,
        buyerId: user.uid,
        buyerName: userData?.name || user?.displayName || 'Pana anonimo',
        sellerId: interaction.sellerId,
        productId: interaction.productId,
        productName: interaction.productName,
        rating,
        comment
      });
      setLoading(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Error al enviar la valoración. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col"
        >
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A] hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-black text-[#1A1A3A] mb-1 pl-1">Valorar a tu Pana</h2>
          <p className="text-xs font-bold text-[#8888AA] mb-5 pl-1 truncate">Anuncio: {interaction?.productName}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all active:scale-95 p-1 outline-none"
                >
                  <Star 
                    className={`w-9 h-9 transition-colors duration-200 ${(hoverRating || rating) >= star ? 'fill-[#FFC200] text-[#FFC200] drop-shadow-md' : 'fill-transparent text-[#1A1A3A]/20'}`} 
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">¿Cómo fue tu experiencia?</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu opinión (opcional)..."
                rows={3}
                className="w-full p-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30 resize-none"
              />
            </div>

            {error && <p className="text-center text-xs font-bold text-[#D90429] mt-1">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-[1.2rem] bg-[#1A1A3A] text-white font-black uppercase tracking-wider text-sm shadow-[0_10px_20px_rgba(26,26,58,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Valoración'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
