import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, X, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import emptyHammock from '../assets/empty_hammock.png';

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

        const allProducts = [...firestoreProducts, ...mockFavorites];
        
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
          Búsquedas
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
                {/* Lista de Favoritos Activos */}
                {products.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => navigate(`/perfil-producto?id=${product.id}`)}
                  className="bg-[#E0E5EC] rounded-[2rem] p-2.5 md:p-3 flex gap-4 overflow-hidden shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_6px_rgba(163,177,198,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] transition-all cursor-pointer relative group"
                >
                  {/* Foto de producto (Izquierda) */}
                  <div className="h-[105px] w-[105px] md:h-32 md:w-32 rounded-[1.5rem] overflow-hidden shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Info (Derecha) */}
                  <div className="flex-1 flex flex-col justify-center py-1.5 pr-12">
                    <h3 className="font-bold text-[#1A1A3A] text-[14px] md:text-[15px] leading-tight line-clamp-2 md:mb-1 drop-shadow-sm">
                      {product.name}
                    </h3>
                    <div className="text-[18px] md:text-xl font-black text-[#003366] mt-0.5 md:mt-1 mb-1.5 flex items-baseline gap-0.5">
                       <span>{Math.floor(parseFloat(product.price) || 0)}</span>
                       <span className="text-[10px] md:text-xs opacity-80">,{((parseFloat(product.price) || 0) % 1).toFixed(2).split('.')[1]}</span>
                       <span className="text-[10px] opacity-80 ml-0.5">€</span>
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 text-[#1A1A3A]/50">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold md:text-xs truncate">
                        {typeof product.location === 'object' 
                          ? (product.location.level2 || product.location.level1 || 'Madrid') 
                          : (product.location || 'Madrid' )
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Botón X para quitar de favoritos (más pequeño y sin solapamiento) */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                      setProducts(prev => prev.filter(p => String(p.id) !== String(product.id)));
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-[#E0E5EC] rounded-full shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.7)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] active:scale-90 transition-all z-10 text-[#1A1A3A]/40 hover:text-[#D90429]"
                  >
                    <X size={13} strokeWidth={3} />
                  </button>
                </motion.div>
                ))}
              </>
            ) : (
              /* Estado Vacío de Anuncios Favoritos */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 px-6 text-center"
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
                <button
                  onClick={() => navigate('/home')}
                  className="mt-10 px-10 py-4 bg-[#1A1A3A] text-white rounded-2xl font-black text-[15px] shadow-[4px_4px_10px_rgba(163,177,198,0.8),-4px_-4px_10px_rgba(255,255,255,1)] active:scale-95 transition-all uppercase tracking-wide"
                >
                  Descubrir Panas
                </button>
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
                
                {recentSearches.map((query, index) => (
                  <motion.div 
                    key={`${query}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#E0E5EC] rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)]"
                  >
                    <div 
                      className="flex items-center gap-3.5 flex-1 cursor-pointer group"
                      onClick={() => handleSearchClick(query)}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/50 flex flex-shrink-0 items-center justify-center group-hover:bg-[#1A1A3A]/10 transition-colors">
                        <Clock className="w-4 h-4 text-[#1A1A3A]/50 group-hover:text-[#1A1A3A]" />
                      </div>
                      <span className="font-bold text-[#1A1A3A] text-[15px] line-clamp-1">{query}</span>
                    </div>
                    <button 
                      onClick={() => removeRecentSearch(query)}
                      className="w-10 h-10 flex shrink-0 items-center justify-center ml-2 text-[#1A1A3A]/40 hover:text-[#D90429] active:scale-90 transition-all bg-[#E0E5EC] rounded-full hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </>
            ) : (
               /* Estado Vacío de Búsquedas Recientes */
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center py-16 px-6 text-center"
               >
                 <div className="w-24 h-24 bg-[#E0E5EC] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] mb-6">
                   <Search className="w-10 h-10 text-[#1A1A3A]/20" />
                 </div>
                 <h3 className="text-xl font-black text-[#1A1A3A] mb-2">Sin búsquedas recientes</h3>
                 <p className="text-[#1A1A3A]/60 font-medium text-sm leading-relaxed max-w-[250px]">
                   El historial de lo que busques en "Descubrir Panas" aparecerá aquí.
                 </p>
                 <button
                  onClick={() => navigate('/home')}
                  className="mt-8 px-8 py-3.5 bg-[#1A1A3A] text-white rounded-2xl font-black text-[15px] shadow-[4px_4px_10px_rgba(163,177,198,0.8),-4px_-4px_10px_rgba(255,255,255,1)] active:scale-95 transition-all"
                >
                  Buscar ahora
                </button>
               </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
