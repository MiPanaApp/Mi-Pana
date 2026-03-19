import { useState, useMemo, useEffect, useRef } from 'react';
import { Sliders, Meh, ArrowUpDown, Pin, Star, Clock, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/ui/FilterPanel';
import { useStore } from '../store/useStore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const { activeCategory, filters, setFilters, sortBy, setSortBy, setIsFilterOpen, isSortOpen, setIsSortOpen } = useStore();
  const sortRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos de Firestore al iniciar
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen, setIsSortOpen]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Filtrar por Categoría (Desactivado por petición del usuario para mostrar todo)
    /*
    if (activeCategory) {
      result = result.filter(p => !activeCategory || (p.id % 4 === activeCategory % 4)); 
    }
    */

    // 2. Filtrar por Precio
    /*
    if (filters.price.min) {
      result = result.filter(p => parseFloat(p.price) >= parseFloat(filters.price.min));
    }
    if (filters.price.max) {
      result = result.filter(p => parseFloat(p.price) <= parseFloat(filters.price.max));
    }

    // 3. Filtrar por Solo Verificados
    if (filters.onlyVerified) {
      result = result.filter(p => p.verified);
    }
    */

    // 4. Ordenar
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'recent':
        // Fallback to originalId for mock products
        result.sort((a, b) => (b.originalId || 0) - (a.originalId || 0));
        break;
      case 'distance':
        // Safe fallback for distance mock
        result.sort((a, b) => ((a.originalId || a.price) % 45) - ((b.originalId || b.price) % 45));
        break;
      default:
        result.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
    }

    return result;
  }, [products, filters, activeCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto pb-10 transition-all">
      {/* Product Feed Grid Section */}
      <div className="mt-5 md:mt-14">
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A3A] drop-shadow-sm">
              Panas, para ti
              <div className="h-1.5 w-10 bg-[#FFC200] mt-1 rounded-full"></div>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón Ordenar (Nuevo sitio) */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="p-2 sm:p-2.5 bg-[#E0E5EC] rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] text-[#1A1A3A] transition-all"
              >
                <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Dropdown de Ordenar Glassmorphic */}
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-52 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-2 z-[1001] overflow-hidden"
                  >
                    {[
                      { id: 'distance', label: 'Más cerca', icon: Pin },
                      { id: 'rating', label: 'Mejores valorados', icon: Star },
                      { id: 'recent', label: 'Más recientes', icon: Clock },
                      { id: 'price_asc', label: 'Menor precio', icon: Euro },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs ${sortBy === opt.id ? 'bg-[#1A1A3A] text-white shadow-lg' : 'text-[#1A1A3A] hover:bg-black/5'}`}
                      >
                        <opt.icon size={14} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón Filtros (Original restaurado) */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="p-2 sm:p-2.5 bg-[#E0E5EC] rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] text-[#1A1A3A] transition-all"
            >
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* RESPONSIVE GRID: 2 cols mobile, 3 tablet, 4 desktop, 5 ultra-wide */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#1A1A3A]/20 border-t-[#1A1A3A] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-10 px-1">
            {filteredProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}

            {/* Empty State: NO HAY PRODUCTOS EN LA BD */}
            {products.length === 0 && (
              <div className="col-span-full py-16 text-center bg-[#E0E5EC] rounded-[2rem] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] flex flex-col items-center justify-center p-6 mt-4">
                <Meh className="w-12 h-12 opacity-40 mb-3 text-[#1A1A3A]" />
                <p className="text-lg md:text-xl font-bold text-[#1A1A3A]/60 tracking-widest">
                  Aún no hay anuncios
                </p>
                <p className="text-sm font-semibold text-[#1A1A3A]/40 mt-2">
                  ¡Sé el primero en anunciar algo!
                </p>
              </div>
            )}
            
            {/* Empty State: Filtros agresivos que no devuelven nada */}
            {products.length > 0 && filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-xl font-bold text-[#1A1A3A]/40 tracking-widest flex items-center justify-center gap-2">
                  No hay panas con estos filtros <Meh className="w-6 h-6 opacity-60" />
                </p>
                <button 
                  onClick={() => setFilters({ price: { min: '', max: '' }, distance: 50, sortBy: 'relevance' })}
                  className="mt-4 text-[#1A1A3A] font-black underline-none hover:text-[#D90429] transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <FilterPanel />
    </div>
  );
}
