import { Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => navigate(`/perfil-producto?id=${product.id}`)}
      className="bg-[#E0E5EC] rounded-[2.2rem] p-3 flex flex-col shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] h-full cursor-pointer group"
    >
      {/* 1. IMAGEN Y FAVORITO (Estilo Wallapop) */}
      <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-3 bg-[#E0E5EC] shadow-[6px_6px_12px_rgba(163,177,198,0.4),-6px_-6px_12px_rgba(255,255,255,0.6)]">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Botón Corazón - Mejor Contraste */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 bg-white/85 backdrop-blur-sm rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] active:scale-90 transition-all z-10 
            ${isFavorite ? 'text-[#D90429]' : 'text-gray-400 hover:text-[#D90429]'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? '#D90429' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Badge "NUEVO" o "TOP" */}
        {(product.premium || product.id % 2 === 0) && (
          <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-white text-[10px] font-black tracking-wide shadow-lg uppercase ${product.premium ? 'bg-[#0056B3]' : 'bg-[#D90429]'}`}>
            {product.premium ? 'TOP' : 'NUEVO'}
          </div>
        )}
      </div>
      
      {/* 2. INFORMACIÓN DEL PRODUCTO (Precio y Título) */}
      <div className="px-1 flex flex-col flex-grow">
        {/* Precio destacado - Estilo Supermercado */}
        <div className="text-xl font-black text-[#003366] mb-0.5 flex items-baseline gap-0.5">
           <span className="text-xl">{Math.floor(parseFloat(product.price) || 0)}</span>
           <span className="text-xs">,{((parseFloat(product.price) || 0) % 1).toFixed(2).split('.')[1]}</span>
           <span className="text-xs ml-0.5">€</span>
        </div>
        
        {/* Título conciso */}
        <h3 className="font-bold text-gray-700 text-sm line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        {/* 3. UBICACIÓN (Lección Wallapop) */}
        <div className="mt-auto flex items-center gap-1 text-[#1A1A3A]/70 font-semibold">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px] truncate">
            {typeof product.location === 'object' 
              ? (product.location.level2 || product.location.level1 || 'Madrid') 
              : (product.location || 'Madrid' )
            } • {product.distance || `${(Math.random() * 5 + 0.5).toFixed(1)} km`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
