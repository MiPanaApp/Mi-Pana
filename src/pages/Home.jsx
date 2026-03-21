import { useState, useMemo, useEffect, useRef } from 'react';
import { Sliders, Meh, ArrowUpDown, Pin, Star, Clock, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/ui/FilterPanel';
import { useStore } from '../store/useStore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MOCK_PRODUCTS } from '../data/mockProducts';

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
        const firestoreProducts = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        // Inyectar productos mock con ubicación fija en Madrid para desarrollo
        const madridMocks = MOCK_PRODUCTS.map(p => ({
          ...p,
          location: 'Madrid',
          categoryId: p.category // Sincronizamos con el campo que usa el filtro
        }));

        setProducts([...firestoreProducts, ...madridMocks]);
      } catch (error) {
        console.error("Error fetching products", error);
        // Si falla Firestore, al menos mostramos los mocks
        setProducts(MOCK_PRODUCTS.map(p => ({ ...p, location: 'Madrid', categoryId: p.category })));
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

    // 1. Filtrar por Categoría
    if (activeCategory) {
      result = result.filter(p => {
        // Mostrar si coincide con la categoría o si el producto aún no tiene categoryId asignado
        return p.categoryId === activeCategory || !p.categoryId;
      }); 
    }

    // 2. Filtrar por Precio
    if (filters.price?.min) {
      result = result.filter(p => parseFloat(p.price) >= parseFloat(filters.price.min));
    }
    if (filters.price?.max) {
      result = result.filter(p => parseFloat(p.price) <= parseFloat(filters.price.max));
    }

    // 3. Filtrar por Solo Verificados
    if (filters.onlyVerified) {
      result = result.filter(p => p.verified);
    }

    // 4. Filtrar por Búsqueda (Search)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }

    // 5. Filtrar por Ubicación (Si está seleccionada)
    if (filters.location?.level1) {
      result = result.filter(p => 
        p.location?.toLowerCase().includes(filters.location.level1.toLowerCase()) ||
        (!p.location && filters.location.level1 === 'Madrid') // Fallback a Madrid si no hay loc
      );
    }

    // 6. Ordenar
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'recent':
        result.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
      case 'distance':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      default:
        result.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
    }

    return result;
  }, [products, filters, activeCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto pb-10 transition-all overflow-x-clip">
      {/* El padding-top dinámico del Layout ya maneja el espacio inicial */}
      <div className="mt-2 md:mt-4">
        <div className="flex flex-row items-center justify-between w-full px-4 mb-3">
          {/* Título: min-w-0 permite que truncate funcione en Flexbox */}
          <h2 className="flex-1 min-w-0 font-black text-[#1A1A3A] text-base sm:text-lg truncate pr-2 drop-shadow-sm">
            Panas, para ti
            <div className="h-1 w-8 bg-[#FFC200] mt-0.5 rounded-full"></div>
          </h2>

          {/* Grupo de botones: flex-shrink-0 para que nunca se compriman */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón Ordenar */}
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDEDF5] flex-shrink-0 shadow-[3px_3px_7px_rgba(180,180,210,0.65),-3px_-3px_7px_rgba(255,255,255,0.85)] active:scale-95 transition-all text-[#1A1A3A]"
              >
                <ArrowUpDown size={15} />
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

            <button 
              onClick={() => setIsFilterOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDEDF5] flex-shrink-0 shadow-[3px_3px_7px_rgba(180,180,210,0.65),-3px_-3px_7px_rgba(255,255,255,0.85)] active:scale-95 transition-all text-[#1A1A3A]"
            >
              <Sliders size={15} />
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
                  onClick={() => {
                    setActiveCategory(null);
                    setFilters({ price: { min: '', max: '' }, distance: 50, searchQuery: '' });
                    setSortBy('relevance');
                  }}
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
