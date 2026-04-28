import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sliders, Meh, ArrowUpDown, Pin, Star, Clock, Euro, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/ui/FilterPanel';
import SkeletonGrid from '../components/ui/SkeletonGrid';
import NotificationModal from '../components/ui/NotificationModal';
import { useStore } from '../store/useStore';
import { useLocationStore } from '../store/useLocationStore';
import { collection, getDocs, query, doc, updateDoc, increment, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { normalizeText } from '../utils/textUtils';
import emptyHammock from '../assets/empty_hammock.png';
import panaEnMecedora from '../assets/pana_en_mecedora.png';
import { useNotifications } from '../hooks/useNotifications';
import { calculateDistance, getUserProvince, getNearbyProvinces, getUserLocation } from '../utils/geoUtils';


const CAPITALS = {
  ES: 'Madrid',
  CO: 'Bogotá',
  VE: 'Caracas',
  US: 'Washington D.C.',
  CL: 'Santiago',
  PA: 'Ciudad de Panamá',
  PE: 'Lima',
  EC: 'Quito',
  DO: 'Santo Domingo',
  AR: 'Buenos Aires'
};

export default function Home() {
  const {
    activeCategory,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    setIsFilterOpen,
    isSortOpen,
    setIsSortOpen,
    selectedCountry,
    setActiveCategory,
    userLocation,
    setUserLocation
  } = useStore();
  const { countries } = useLocationStore();
  const sortRef = useRef(null);
  const { categoryId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { activeNotifications, loading: notifsLoading, dismissOne, dismissAll } = useNotifications();

  // Sync route param with global store category
  useEffect(() => {
    if (categoryId) {
      // decodificar en caso de espacios/caracteres especiales
      const decodedCat = decodeURIComponent(categoryId);
      if (activeCategory !== decodedCat) {
        setActiveCategory(decodedCat);
      }
    } else if (location.pathname === '/home' || location.pathname === '/') {
      // Si estamos en home sin param, la categoría es "Todas"
      if (activeCategory !== 'Todas') {
        setActiveCategory('Todas');
      }
    }
  }, [categoryId, setActiveCategory, activeCategory]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setLastDoc(null);
      setHasMore(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef,
          where('location.country', '==', selectedCountry),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(q);
        // DEBUG TEMPORAL — eliminar después
        console.log('Total Firestore:', snap.docs.length);
        snap.docs.forEach(d => {
          const data = d.data();
          console.log(d.id, '|', data.name, '| status:', data.status, '| country:', data.location?.country);
        });
        const firestoreData = snap.docs
          .map(d => ({ ...d.data(), id: d.id }))
          .filter(p => p.status !== 'hidden' && p.status !== 'inactive')
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
        setProducts(firestoreData);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCountry]); // Re-fetch cuando cambia el país

  const loadMore = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('location.country', '==', selectedCountry),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const moreData = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter(p => p.status !== 'hidden' && p.status !== 'inactive')
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      setProducts(prev => [...prev, ...moreData]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const [nearbyLoading, setNearbyLoading] = useState(false);

  const handleSortSelect = async (id) => {
    setSortBy(id);

    if (id === 'distance' && !userLocation) {
      try {
        // ✅ USAR NUEVA FUNCIÓN COMPATIBLE WEB + NATIVO
        const coords = await getUserLocation();

        const loc = await getUserProvince(coords.lat, coords.lng);

        if (loc) {
          setUserLocation({
            lat: coords.lat,
            lng: coords.lng,
            level1: loc.level1,
            level2: loc.level2,
            level3: loc.level3,
            country: loc.country
          });
        } else {
          setUserLocation({
            lat: coords.lat,
            lng: coords.lng,
            level1: '',
            level2: '',
            level3: '',
            country: ''
          });
        }
      } catch (err) {
        console.error('Error obteniendo ubicación:', err);
        alert('No pudimos obtener tu ubicación. Verifica los permisos de la app.');
      }
    }

    setIsSortOpen(false);
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
    };
    if (isSortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen, setIsSortOpen]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    // DEBUG TEMPORAL
    console.log('products en useMemo:', products.length);

    // REGLAS DE NEGOCIO (Guardadas para futura edición):
    // 1. Filtrar por país seleccionado por defecto si no hay filtro manual de ubicación.
    // 2. Orden default (relevance): Priorizar Capital del país, luego más recientes.
    const suspendedCountryIds = countries
      .filter(c => c.status === 'suspended')
      .map(c => c.id);

    // Firestore ya filtra por país y status=active.
    // Solo se excluyen productos de países suspendidos (edge case de cambio de estado en tiempo real).
    result = result.filter(p =>
      !suspendedCountryIds.includes(p.location?.country)
    );
    // DEBUG TEMPORAL
    console.log('suspendedCountryIds:', suspendedCountryIds);
    console.log('después de filter suspendidos:', result.length);

    // Filtros de Ubicación Estrictos
    if (filters.location?.level1) {
      const targetL1 = normalizeText(filters.location.level1);
      result = result.filter(p => {
        const pL1 = normalizeText(p.location?.level1 || p.state || '');
        return pL1 === targetL1 || pL1.includes(targetL1) || targetL1.includes(pL1);
      });
    }
    console.log('después de filter level1:', result.length, 'filtro:', filters.location?.level1);

    if (filters.location?.level2) {
      const targetL2 = normalizeText(filters.location.level2);
      result = result.filter(p => {
        const pL2 = normalizeText(p.location?.level2 || p.city || '');
        return pL2 === targetL2 || pL2.includes(targetL2) || targetL2.includes(pL2);
      });
    }
    console.log('después de filter level2:', result.length, 'filtro:', filters.location?.level2);

    // Filtro por Categoría
    if (activeCategory && activeCategory !== 'Todas') {
      const activeCatNorm = normalizeText(activeCategory);
      result = result.filter(p => normalizeText(p.category) === activeCatNorm);
    }
    console.log('después de filter categoria:', result.length, 'cat:', activeCategory);

    if (filters.onlyVerified) result = result.filter(p => p.verified);
    console.log('después de filter verified:', result.length);

    if (filters.searchQuery) {
      const q = normalizeText(filters.searchQuery);
      result = result.filter(p => {
        const matchesName = normalizeText(p.name || '').includes(q);
        const matchesDesc = normalizeText(p.description || '').includes(q);
        const matchesKeyword = Array.isArray(p.keywords) && p.keywords.some(k => normalizeText(k).includes(q));
        return matchesName || matchesDesc || matchesKeyword;
      });
    }
    console.log('después de filter search:', result.length);

    if (filters.price?.min) result = result.filter(p => parseFloat(p.price) >= parseFloat(filters.price.min));
    if (filters.price?.max) result = result.filter(p => parseFloat(p.price) <= parseFloat(filters.price.max));
    console.log('después de filter precio:', result.length);

    // Lógica de Ordenación
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      case 'recent':
        result.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        break;
      case 'searches':
        result.sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
        break;
      case 'distance':
        if (!userLocation) break;
        result.sort((a, b) => {
          let scoreA = 10000;
          let scoreB = 10000;

          const aL3 = a.location?.level3 || '';
          const aL2 = a.location?.level2 || a.city || '';
          const aL1 = a.location?.level1 || a.state || '';
          const bL3 = b.location?.level3 || '';
          const bL2 = b.location?.level2 || b.city || '';
          const bL1 = b.location?.level1 || b.state || '';

          if (!a.location?.coordinates) {
            if (aL3 && userLocation.level3 && aL3 === userLocation.level3) scoreA = 0;
            else if (aL2 && userLocation.level2 && aL2 === userLocation.level2) scoreA = 100;
            else if (aL1 && userLocation.level1 && aL1 === userLocation.level1) scoreA = 500;
            else scoreA = 1000;
          } else {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, a.location.coordinates.lat, a.location.coordinates.lng);
            scoreA = dist;
            a._distanceKm = dist;
          }

          if (!b.location?.coordinates) {
            if (bL3 && userLocation.level3 && bL3 === userLocation.level3) scoreB = 0;
            else if (bL2 && userLocation.level2 && bL2 === userLocation.level2) scoreB = 100;
            else if (bL1 && userLocation.level1 && bL1 === userLocation.level1) scoreB = 500;
            else scoreB = 1000;
          } else {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, b.location.coordinates.lat, b.location.coordinates.lng);
            scoreB = dist;
            b._distanceKm = dist;
          }

          a._distanceScore = scoreA;
          b._distanceScore = scoreB;

          return scoreA - scoreB;
        });
        break;

      case 'relevance':

      default:
        // Orden default: Capital primero, luego fecha descendente
        const capitalCity = CAPITALS[selectedCountry] || 'Madrid';
        result.sort((a, b) => {
          const isACapital = (a.location?.level2 === capitalCity || a.city === capitalCity) ? 0 : 1;
          const isBCapital = (b.location?.level2 === capitalCity || b.city === capitalCity) ? 0 : 1;

          if (isACapital !== isBCapital) return isACapital - isBCapital;

          // Secondary sort: Recents (createdAt). Handle standard Timestamp or Date or string
          const getMillis = (dateObj) => {
            if (!dateObj) return 0;
            if (dateObj.toMillis) return dateObj.toMillis();
            if (dateObj.seconds) return dateObj.seconds * 1000;
            if (typeof dateObj === 'string' || typeof dateObj === 'number') return new Date(dateObj).getTime();
            if (dateObj instanceof Date) return dateObj.getTime();
            return 0;
          };
          const dateA = getMillis(a.createdAt);
          const dateB = getMillis(b.createdAt);
          return dateB - dateA;
        });
    }

    // DEBUG TEMPORAL
    console.log('resultado final filteredProducts:', result.length);
    return result;
  }, [products, filters, activeCategory, sortBy, selectedCountry, userLocation]);

  // Fallback: Si no hay anuncios en la provincia, buscar en limítrofes
  useEffect(() => {
    const fetchNearby = async () => {
      if (sortBy === 'distance' && userLocation?.level2 && !nearbyLoading && products.length > 0) {
        // Verificar si de los filtrados, alguno es de la zona
        const hasLocalAds = filteredProducts.some(p => p._distanceScore === 0);

        if (!hasLocalAds) {
          setNearbyLoading(true);
          try {
            const nearbyProvinces = getNearbyProvinces(userLocation.level2);
            if (nearbyProvinces.length > 0) {
              const q = query(
                collection(db, 'products'),
                where('location.level2', 'in', nearbyProvinces),
                orderBy('createdAt', 'desc'),
                limit(10)
              );
              const snap = await getDocs(q);
              const nearbyData = snap.docs.map(d => ({ ...d.data(), id: d.id, _isNearbyFallback: true }))
                .filter(p => !products.find(ex => ex.id === p.id));

              if (nearbyData.length > 0) {
                setProducts(prev => [...prev, ...nearbyData]);
              }
            }
          } catch (err) {
            console.error('Error fetching nearby fallback:', err);
          } finally {
            setNearbyLoading(false);
          }
        }
      }
    };
    fetchNearby();
  }, [sortBy, userLocation, filteredProducts.length]);

  useEffect(() => {

    if (!filters.searchQuery || filteredProducts.length === 0) return;
    const timer = setTimeout(() => {
      filteredProducts.forEach(prod => {
        if (prod.id && typeof prod.id === 'string') {
          updateDoc(doc(db, 'products', prod.id), {
            searchCount: increment(1)
          }).catch(() => { });
        }
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [filters.searchQuery, filteredProducts.length]);

  return (
    <div className="max-w-7xl mx-auto pb-10 transition-all overflow-x-clip">
      <div className="-mt-4 md:mt-1">
        <div className="flex flex-row items-center justify-between w-full px-4 mb-1">
          <h2 className="flex-1 min-w-0 font-black text-[#1A1A3A] text-[17px] truncate pr-2 drop-shadow-sm">
            Panas, para ti
            <div className="h-1 w-7 bg-[#FFC200] mt-0.5 rounded-full"></div>
          </h2>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDEDF5] flex-shrink-0 shadow-[3px_3px_7px_rgba(180,180,210,0.65),-3px_-3px_7px_rgba(255,255,255,0.85)] active:scale-95 transition-all text-[#1A1A3A]"
              >
                <ArrowUpDown size={15} />
              </button>

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
                      { id: 'searches', label: 'Más buscados', icon: Search },
                      { id: 'rating', label: 'Mejores valorados', icon: Star },
                      { id: 'recent', label: 'Más recientes', icon: Clock },
                      { id: 'price_asc', label: 'Menor precio', icon: Euro },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSortSelect(opt.id)}
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

            <button
              onClick={() => setIsNotifOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDEDF5] flex-shrink-0 shadow-[3px_3px_7px_rgba(180,180,210,0.65),-3px_-3px_7px_rgba(255,255,255,0.85)] active:scale-95 transition-all text-[#1A1A3A] relative"
            >
              <Bell size={15} />
              {activeNotifications.length > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#D90429] rounded-full shadow-sm text-white text-[9px] font-black flex items-center justify-center leading-none z-10 border border-white">
                  {activeNotifications.length > 99 ? '99+' : activeNotifications.length}
                </div>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-10 px-1">
            {filteredProducts.map(prod => (
              <ProductCard key={prod.objectID || prod.id} product={prod} />
            ))}

            {products.length === 0 && (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center p-6 mt-4">
                <img
                  src={emptyHammock}
                  alt="No hay anuncios"
                  className="w-[280px] h-auto object-contain mb-2 drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)]"
                />
                <p className="text-[20px] md:text-[24px] font-black text-[#1A1A3A] tracking-tight uppercase leading-none">
                  Aún no hay anuncios
                </p>
                <p className="text-[14px] font-bold text-[#1A1A3A]/40 mt-3">
                  ¡Sé el primero en anunciar algo!
                </p>
              </div>
            )}

            {products.length > 0 && filteredProducts.length === 0 && (
              <div className="col-span-full py-8 text-center flex flex-col items-center justify-center p-6 mt-0">
                <img
                  src={panaEnMecedora}
                  alt="No hay resultados"
                  className="w-[190px] h-auto object-contain mb-1 drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)]"
                />
                <h3 className="text-[22px] font-black text-[#1A1A3A] tracking-tight uppercase leading-none">
                  No hay panas con estos filtros
                </h3>

              </div>
            )}
          </div>
        )}

        {/* Botón Cargar más — solo visible si hay más docs y no hay filtros activos */}
        {!loading && hasMore && !filters.searchQuery && !filters.location?.level1 && !filters.onlyVerified && activeCategory === 'Todas' && (
          <div className="flex justify-center mt-6 mb-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-4 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-black text-sm uppercase tracking-wider shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMore ? (
                <><span className="inline-block w-4 h-4 border-2 border-[#1A1A3A]/30 border-t-[#1A1A3A] rounded-full animate-spin" /> Cargando...</>
              ) : (
                'Cargar más anuncios'
              )}
            </button>
          </div>
        )}
      </div>
      <FilterPanel />
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={activeNotifications}
        loading={notifsLoading}
        onDismissOne={dismissOne}
        onDismissAll={dismissAll}
      />
    </div>
  );
}