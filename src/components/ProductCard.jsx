import { Heart, MapPin, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getBadge, BADGE_STYLES } from '../utils/badgeUtils';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, userLocation, sortBy } = useStore();
  const isFavorite = (favorites || []).some(id => String(id) === String(product.id));
  const badge = getBadge(product);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => navigate(`/perfil-producto?id=${product.objectID || product.id}`)}
      className="bg-[#E0E5EC] rounded-[1.5rem] p-2.5 flex flex-col shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] h-full cursor-pointer group"
    >
      <div className="relative aspect-square rounded-[1.2rem] overflow-hidden mb-2.5 bg-[#E0E5EC] shadow-[6px_6px_12px_rgba(163,177,198,0.4),-6px_-6px_12px_rgba(255,255,255,0.6)]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
          className={`absolute top-2 right-2 p-1.5 bg-white/85 backdrop-blur-sm rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] active:scale-90 transition-all z-10 ${isFavorite ? 'text-[#D90429]' : 'text-gray-400 hover:text-[#D90429]'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? '#D90429' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        {badge && (
          <div className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md text-white text-[9px] font-black tracking-wide shadow-lg uppercase ${BADGE_STYLES[badge].bg}`}>
            {BADGE_STYLES[badge].label}
          </div>
        )}
      </div>

      <div className="px-1 flex flex-col flex-grow">
        {/* Fila precio + rating */}
        <div className="flex items-end justify-between mb-0">
          <div className="text-lg font-black text-[#003366] flex items-baseline gap-0.5">
            {product.price === 'Consultar' ? (
              <span className="text-[13px] font-bold tracking-tight text-[#003366]/60">Consultar</span>
            ) : (
              <>
                <span className="text-lg">{Math.floor(parseFloat(product.price) || 0)}</span>
                <span className="text-[10px]">,{((parseFloat(product.price) || 0) % 1).toFixed(2).split('.')[1]}</span>
                <span className="text-[10px] ml-0.5">€</span>
              </>
            )}
          </div>
          {product.rating != null && (
            <div className="flex items-center gap-0.5 pb-0.5">
              <svg width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFA500" />
                  </linearGradient>
                </defs>
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={product.reviewCount > 0 ? "url(#starGrad)" : "currentColor"} 
                  className={product.reviewCount > 0 ? "stroke-none" : "text-[#1A1A3A]/10"} />
              </svg>
              <span className="text-[10px] font-bold text-[#1A1A3A]/50 leading-none">
                {product.reviewCount > 0 
                  ? parseFloat(product.rating || 0).toFixed(1).replace('.', ',') 
                  : "0,0"}
              </span>
            </div>
          )}
        </div>
        <h3 className="font-bold text-gray-700 text-xs line-clamp-2 mb-0.5">
          {product.name}
          {product.userVerified && (
            <ShieldCheck size={14} className="inline ml-1 text-[#00C97A] -mt-0.5" title="Pana Verificado" />
          )}
        </h3>
        <div className="mt-auto flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[#1A1A3A]/70 font-semibold">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-[11px] truncate">
              {typeof product.location === 'object'
                ? (product.location.level2 || product.location.level1 || 'Madrid')
                : (product.location || 'Madrid')}
              {sortBy === 'distance' && (
                <>
                  {' • '}
                  {product._distanceKm != null 
                    ? `${product._distanceKm.toFixed(1)} km`
                    : product._distanceScore === 0 
                      ? '📍 Cerca de ti' 
                      : product._distanceScore === 500
                        ? 'En tu región'
                        : ''}
                </>
              )}
            </span>
          </div>
          {product.location?.level3 && (
            <span className="text-[10px] font-bold text-[#1A1A3A]/40 pl-[18px] truncate">
              {product.location.level3}
            </span>
          )}
        </div>

      </div>
    </motion.div>
  );
}
