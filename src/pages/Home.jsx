import { useState, useMemo, useEffect, useRef } from 'react';
import { Sliders, Meh, ArrowUpDown, Pin, Star, Clock, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/ui/FilterPanel';
import { useStore } from '../store/useStore';

const MOCK_PRODUCTS = [
  {
    id: 101,
    name: "Reparación Profesional de Laptops y PC",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80",
    price: "45",
    rating: 4.9,
    reviewCount: 124,
    premium: true,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 102,
    name: "Tequeños Caseros (Pack 50 uds)",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80",
    price: "15",
    rating: 4.7,
    reviewCount: 312,
    premium: false,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 103,
    name: "Asesoría Legal Extranjería y Asilo",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80",
    price: "50",
    rating: 5.0,
    reviewCount: 89,
    premium: true,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 104,
    name: "Cajas a Venezuela - Envío Marítimo Seguro",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80",
    price: "120",
    rating: 4.5,
    reviewCount: 56,
    premium: false,
    verified: false,
    whatsapp: "34600000000",
  },
  {
    id: 105,
    name: "Sabor Venezolano: Hallacas y Dulces",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80",
    price: "25",
    rating: 4.8,
    reviewCount: 156,
    premium: true,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 106,
    name: "Venta de Divisas (Tasa del día)",
    image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&q=80",
    price: "1",
    rating: 4.9,
    reviewCount: 423,
    premium: false,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 107,
    name: "Peluquería y Estética a Domicilio",
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80",
    price: "25",
    rating: 4.8,
    reviewCount: 92,
    premium: true,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 108,
    name: "Queso Llanero y Palmita Artesanal",
    image: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&q=80",
    price: "12",
    rating: 4.9,
    reviewCount: 215,
    premium: false,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 109,
    name: "Clases de Música: Cuatro y Guitarra",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
    price: "20",
    rating: 4.7,
    reviewCount: 45,
    premium: false,
    verified: false,
    whatsapp: "34600000000",
  },
  {
    id: 110,
    name: "Transporte al Aeropuerto (Barajas)",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80",
    price: "35",
    rating: 5.0,
    reviewCount: 128,
    premium: true,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 111,
    name: "Repostería: Torta de Pan y Tres Leches",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    price: "18",
    rating: 4.9,
    reviewCount: 88,
    premium: false,
    verified: true,
    whatsapp: "34600000000",
  },
  {
    id: 112,
    name: "Servicio de Limpieza de Hogar",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80",
    price: "15",
    rating: 4.6,
    reviewCount: 167,
    premium: false,
    verified: true,
    whatsapp: "34600000000",
  }
];

export default function Home() {
  const { activeCategory, filters, setFilters, sortBy, setSortBy, setIsFilterOpen, isSortOpen, setIsSortOpen } = useStore();
  const sortRef = useRef(null);

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
    let result = [...MOCK_PRODUCTS];

    // 1. Filtrar por Categoría (Desactivado por petición del usuario para mostrar todo)
    /*
    if (activeCategory) {
      result = result.filter(p => !activeCategory || (p.id % 4 === activeCategory % 4)); 
    }
    */

    // 2. Filtrar por Precio
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

    // 4. Ordenar
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_asc':
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'recent':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'distance':
        result.sort((a, b) => (a.id % 45) - (b.id % 45));
        break;
      default:
        result.sort((a, b) => (b.premium ? 1 : 0) - (a.premium ? 1 : 0));
    }

    return result;
  }, [filters, activeCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto pb-10 transition-all">
      {/* Product Feed Grid Section */}
      <div className="mt-8">
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
                className="p-3 bg-[#E0E5EC] rounded-2xl shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] text-[#1A1A3A] transition-all"
              >
                <ArrowUpDown className="w-6 h-6" />
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
              className="p-3 bg-[#E0E5EC] rounded-2xl shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] text-[#1A1A3A] transition-all"
            >
              <Sliders className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* RESPONSIVE GRID: 2 cols mobile, 3 tablet, 4 desktop, 5 ultra-wide */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-10 px-1">
          {filteredProducts.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl font-bold text-[#1A1A3A]/40 tracking-widest flex items-center justify-center gap-2">
                No hay panas con estos filtros <Meh className="w-6 h-6 opacity-60" />
              </p>
              <button 
                onClick={() => setFilters({ price: { min: '', max: '' }, distance: 50, sortBy: 'relevance' })}
                className="mt-4 text-[#1A1A3A] font-black underline-none"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <FilterPanel />
    </div>
  );
}
