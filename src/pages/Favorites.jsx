import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Heart, Search, X, MapPin, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import emptyHammock from '../assets/empty_hammock.png';

const isMobile = () => window.innerWidth < 768;

// ── Swipeable wrapper para tarjetas de Anuncios favoritos ──────────────────
function SwipeableFavorite({ product, onDelete, onNavigate }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const background = useTransform(x, [-150, -50, 0], ['rgba(220,38,38,1)', 'rgba(220,38,38,0.8)', 'rgba(220,38,38,0)']);
  const trashOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const trashScale  = useTransform(x, [-100, -40, 0], [1.2, 0.8, 0.5]);

  const handleDragEnd = async (_, info) => {
    if (info.offset.x < -(window.innerWidth * 0.4)) {
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } });
      onDelete(product.id);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  };

  const mobile = isMobile();

  return (
    <div className="relative overflow-hidden rounded-[2rem] fav-item">
      {/* Fondo rojo (solo móvil) */}
      {mobile && (
        <motion.div className="absolute inset-0 flex items-center justify-end pr-6 rounded-[2rem]" style={{ background }}>
          <motion.div style={{ opacity: trashOpacity, scale: trashScale }} className="flex flex-col items-center gap-1">
            <Trash2 className="text-white w-6 h-6" />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Eliminar</span>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        style={{ x }}
        animate={controls}
        drag={mobile ? 'x' : false}
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        onClick={() => onNavigate(product.id)}
        className="relative bg-[#E0E5EC] rounded-[2rem] p-2.5 md:p-3 flex gap-4 overflow-hidden shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_6px_rgba(163,177,198,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] transition-shadow cursor-pointer group"
        whileTap={mobile ? { cursor: 'grabbing' } : {}}
      >
        {/* Foto */}
        <div className="h-[105px] w-[105px] md:h-32 md:w-32 rounded-[1.5rem] overflow-hidden shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center py-1.5 pr-3 md:pr-12">
          <h3 className="font-bold text-[#1A1A3A] text-[14px] md:text-[15px] leading-tight line-clamp-2 md:mb-1 drop-shadow-sm">{product.name}</h3>
          <div className="text-[18px] md:text-xl font-black text-[#003366] mt-0.5 md:mt-1 mb-1.5 flex items-baseline gap-0.5">
            <span>{Math.floor(parseFloat(product.price) || 0)}</span>
            <span className="text-[10px] md:text-xs opacity-80">,{((parseFloat(product.price) || 0) % 1).toFixed(2).split('.')[1]}</span>
            <span className="text-[10px] opacity-80 ml-0.5">€</span>
          </div>
          <div className="mt-auto flex items-center gap-1.5 text-[#1A1A3A]/50">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold md:text-xs truncate">
              {typeof product.location === 'object' ? (product.location.level2 || product.location.level1 || 'Madrid') : (product.location || 'Madrid')}
            </span>
          </div>
        </div>

        {/* Botón X solo en Desktop */}
        {!mobile && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
            className="absolute top-3 right-3 p-1.5 bg-[#E0E5EC] rounded-full shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.7)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-90 transition-all z-10 text-[#1A1A3A]/40 hover:text-[#D90429]"
          >
            <X size={13} strokeWidth={3} />
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ── Swipeable wrapper para tarjetas de Búsquedas recientes ────────────────
function SwipeableSearch({ query, onDelete, onNavigate }) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const background = useTransform(x, [-150, -50, 0], ['rgba(220,38,38,1)', 'rgba(220,38,38,0.8)', 'rgba(220,38,38,0)']);
  const trashOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const trashScale  = useTransform(x, [-100, -40, 0], [1.2, 0.8, 0.5]);

  const handleDragEnd = async (_, info) => {
    if (info.offset.x < -(window.innerWidth * 0.4)) {
      await controls.start({ x: -window.innerWidth, opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } });
      onDelete(query);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }
  };

  const mobile = isMobile();

  return (
    <div className="relative overflow-hidden rounded-2xl fav-item">
      {/* Fondo rojo (solo móvil) */}
      {mobile && (
        <motion.div className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl" style={{ background }}>
          <motion.div style={{ opacity: trashOpacity, scale: trashScale }} className="flex flex-col items-center gap-1">
            <Trash2 className="text-white w-5 h-5" />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Eliminar</span>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        style={{ x }}
        animate={controls}
        drag={mobile ? 'x' : false}
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        className="relative bg-[#E0E5EC] rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)]"
        whileTap={mobile ? { cursor: 'grabbing' } : {}}
      >
        <div className="flex items-center gap-3.5 flex-1 cursor-pointer group" onClick={() => onNavigate(query)}>
          <div className="w-8 h-8 rounded-full bg-white/50 flex flex-shrink-0 items-center justify-center group-hover:bg-[#1A1A3A]/10 transition-colors">
            <Clock className="w-4 h-4 text-[#1A1A3A]/50 group-hover:text-[#1A1A3A]" />
          </div>
          <span className="font-bold text-[#1A1A3A] text-[15px] line-clamp-1">{query}</span>
        </div>

        {/* Botón X solo en Desktop */}
        {!mobile && (
          <button
            onClick={() => onDelete(query)}
            className="w-10 h-10 flex shrink-0 items-center justify-center ml-2 text-[#1A1A3A]/40 hover:text-[#D90429] active:scale-90 transition-all bg-[#E0E5EC] rounded-full hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, clearFavorites, recentSearches, removeRecentSearch, clearRecentSearches, setSearchQuery } = useStore();
  const [activeTab, setActiveTab] = useState('anuncios'); // 'anuncios' | 'busquedas'
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorite products
  useEffect(() => {
    let isMounted = true;
    
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }
      
      try {
        // Solo mostramos loading si la lista está vacía (carga inicial)
        if (products.length === 0) setLoading(true);
        
        // Normalizamos IDs para comparar de forma segura (strings)
        const favStrings = favorites.map(f => String(f));
        
        // Mocks
        const mockFavorites = MOCK_PRODUCTS.filter(p => favStrings.includes(String(p.id)));
        
        // Firestore
        const firestoreIds = favStrings.filter(id => !MOCK_PRODUCTS.some(m => String(m.id) === id));
        const promises = firestoreIds.map(id => getDoc(doc(db, 'products', id)));
        const docsSnap = await Promise.all(promises);
        
        const firestoreProducts = docsSnap
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const allProducts = [...firestoreProducts, ...mockFavorites].filter(p => p.status !== 'inactive' && p.status !== 'hidden');
        
        // Mantener orden y asegurar unicidad
        const uniqueProductsMap = new Map();
        allProducts.forEach(p => {
           if (!uniqueProductsMap.has(String(p.id))) {
              uniqueProductsMap.set(String(p.id), p);
           }
        });

        const sortedProducts = Array.from(uniqueProductsMap.values()).sort((a, b) => {
           return favStrings.indexOf(String(b.id)) - favStrings.indexOf(String(a.id));
        });

        if (isMounted) {
          setProducts(sortedProducts);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
 
    fetchFavorites();
 
    return () => { isMounted = false; };
  }, [favorites.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleSearchClick = (query) => {
    setSearchQuery(query);
    navigate('/home');
  };

  return (
    <div className="bg-[#E0E5EC] min-h-screen font-sans pb-24 pt-0 md:pt-6 px-5 max-w-3xl mx-auto overflow-x-hidden">
      <h1 className="text-3xl md:text-4xl font-black text-[#1A1A3A] mb-8 drop-shadow-sm px-1 -mt-1 md:mt-0">
        Tus Favoritos
      </h1>

      {/* Pestañas (Tabs) Neumórficas */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('anuncios')}
          className={`flex-1 py-3.5 px-2 rounded-2xl font-bold text-[14px] md:text-[15px] transition-all flex justify-center items-center gap-2 ${
            activeTab === 'anuncios' 
            ? 'bg-[#1A1A3A] text-white shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.95)]' 
            : 'bg-[#E0E5EC] text-[#1A1A3A]/60 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] hover:text-[#1A1A3A]'
          }`}
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'anuncios' ? 'fill-white' : ''}`} />
          Anuncios ({favorites.length})
        </button>
        <button 
          onClick={() => setActiveTab('busquedas')}
          className={`flex-1 py-3.5 px-2 rounded-2xl font-bold text-[14px] md:text-[15px] transition-all flex justify-center items-center gap-2 ${
            activeTab === 'busquedas' 
            ? 'bg-[#1A1A3A] text-white shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.95)]' 
            : 'bg-[#E0E5EC] text-[#1A1A3A]/60 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] hover:text-[#1A1A3A]'
          }`}
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
          Búsquedas ({recentSearches.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'anuncios' ? (
          <motion.div 
            key="anuncios"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {loading ? (
              // Skeletons de carga
              [1, 2, 3].map(i => (
                 <div key={i} className="bg-[#E0E5EC] rounded-[2rem] p-3 flex gap-4 h-32 animate-pulse shadow-[6px_6px_12px_rgba(163,177,198,0.4),-6px_-6px_12px_rgba(255,255,255,0.6)]">
                    <div className="h-full w-28 bg-[#1A1A3A]/10 rounded-2xl shrink-0" />
                    <div className="flex-1 py-2 pr-2 flex flex-col justify-between">
                       <div className="h-4 bg-[#1A1A3A]/10 rounded-full w-3/4" />
                       <div className="h-4 bg-[#1A1A3A]/10 rounded-full w-1/2" />
                       <div className="h-6 bg-[#1A1A3A]/10 rounded-full w-1/3 mt-auto" />
                    </div>
                 </div>
              ))
            ) : products.length > 0 ? (
              <>
                <div className="flex justify-between items-center px-3 mb-1">
                  <span className="text-[11px] font-bold text-[#1A1A3A]/50 tracking-tighter">Tus guardados</span>
                  <button 
                    onClick={() => {
                        clearFavorites();
                        setProducts([]);
                    }}
                    className="text-[11px] font-bold text-[#D90429] opacity-80 hover:opacity-100 transition-colors tracking-tighter px-2 py-1 rounded-md hover:bg-white/40"
                  >
                    Borrar todo
                  </button>
                </div>
                {/* Lista de Favoritos Activos — Swipeable en móvil */}
                <AnimatePresence>
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  >
                    <SwipeableFavorite
                      product={product}
                      onDelete={(id) => {
                        toggleFavorite(id);
                        setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
                      }}
                      onNavigate={(id) => navigate(`/perfil-producto?id=${id}`)}
                    />
                  </motion.div>
                ))}
                </AnimatePresence>
              </>
            ) : (
              /* Estado Vacío de Anuncios Favoritos */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center pt-2 pb-10 px-6 text-center"
              >
                <img 
                  src={emptyHammock} 
                  alt="Sin favoritos" 
                  className="w-[240px] h-auto object-contain mb-2 drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)]" 
                />
                <h3 className="text-[22px] font-black text-[#1A1A3A] mb-2 leading-none uppercase">No tienes favoritos aún</h3>
                <p className="text-[#1A1A3A]/40 font-bold text-sm leading-relaxed max-w-[250px] mt-2">
                  Explora anuncios y guárdalos con el corazón para verlos más tarde.
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Lista de Búsquedas Recientes */
          <motion.div 
            key="busquedas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {recentSearches.length > 0 ? (
              <>
                <div className="flex justify-between items-center px-3 mb-1">
                  <span className="text-[11px] font-bold text-[#1A1A3A]/50 tracking-tighter">Historial</span>
                  <button 
                    onClick={clearRecentSearches}
                    className="text-[11px] font-bold text-[#D90429] opacity-80 hover:opacity-100 transition-colors tracking-tighter px-2 py-1 rounded-md hover:bg-white/40"
                  >
                    Borrar todo
                  </button>
                </div>
                
                <AnimatePresence>
                {recentSearches.map((query, index) => (
                  <motion.div
                    key={`${query}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  >
                    <SwipeableSearch
                      query={query}
                      onDelete={removeRecentSearch}
                      onNavigate={handleSearchClick}
                    />
                  </motion.div>
                ))}
                </AnimatePresence>
              </>
            ) : (
               /* Estado Vacío de Búsquedas Recientes */
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center pt-2 pb-16 px-6 text-center"
               >
                 <img 
                   src={emptyHammock} 
                   alt="Sin búsquedas" 
                   className="w-[240px] h-auto object-contain mb-2 drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)]" 
                 />
                 <h3 className="text-xl font-black text-[#1A1A3A] mb-2 uppercase">Sin búsquedas recientes</h3>
                 <p className="text-[#1A1A3A]/60 font-medium text-sm leading-relaxed max-w-[250px] mt-2">
                   El historial de lo que busques en "Descubrir Panas" aparecerá aquí.
                 </p>
               </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .fav-item { user-select: none; -webkit-user-select: none; }
      `}} />
    </div>
  );
}
