import { Search, Menu, X, Home, Heart as LucideHeart, PlusCircle, MessageCircle, User as LucideUser } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState, useRef, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import logoTexto from '../../assets/solotexto.png';
import useAuthFlow from '../../hooks/useAuthFlow';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { CATEGORIES as DEFAULT_CATEGORIES, getCategoryIcon, sortCategories } from '../../data/categories';
import { FiPlus } from 'react-icons/fi';

// Las categorías se cargan dinámicamente desde Firestore en el useEffect del componente

const Header = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const { 
    activeCategory, 
    setActiveCategory, 
    setIsFilterOpen, 
    setSortBy,
    selectedCountry,
    selectedRegion,
    setCountry,
    setRegion,
    filters,
    setFilters,
    addRecentSearch
  } = useStore();
  
  const [hidden, setHidden] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const countryRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const categoriesRef = useRef(null);
  const { scrollY } = useScroll();

  const { user } = useAuthFlow();
  const [userName, setUserName] = useState('');
  const [dbCategories, setDbCategories] = useState(DEFAULT_CATEGORIES);

  // Scroll categories to left on mount or when categories change
  useEffect(() => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollLeft = 0;
    }
  }, [dbCategories]);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const cats = querySnapshot.docs.map(doc => ({
            id: doc.data().name, // Usamos el nombre como ID para el filtro
            name: doc.data().name,
            icon: getCategoryIcon(doc.data().name)
          }));
          
          // Prepend "Todas" category
          setDbCategories([
            { id: 'Todas', name: 'Todas', icon: FiPlus },
            ...sortCategories(cats)
          ]);
        }
      } catch (err) {
        console.error("Error fetching categories for header:", err);
        // Fallback with "Todas" prepended to default categories
        setDbCategories([
          { id: 'Todas', name: 'Todas', icon: FiPlus },
          ...sortCategories(DEFAULT_CATEGORIES)
        ]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      if (user?.uid) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.name) setUserName(data.name);

            // Initialize app state to user's registered country automatically
            if (data.country && !sessionStorage.getItem('country_initialized')) {
              let code = 'ES';
              if (data.country.includes('Colombia')) code = 'CO';
              else if (data.country.includes('Estados Unidos')) code = 'US';
              else if (data.country.includes('Chile')) code = 'CL';
              else if (data.country.includes('Panamá')) code = 'PA';
              else if (data.country.includes('República Dominicana')) code = 'DO';
              else if (data.country.includes('Argentina')) code = 'AR';

              setCountry(code);
              if (data.region) {
                setRegion(data.region);
                setFilters({ ...filters, location: { level1: data.region, level2: data.region, level3: '' } });
              }
              sessionStorage.setItem('country_initialized', 'true');
            }
            return;
          }

          if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
            setUserName(user.displayName?.split(' ')[0] || 'Pana');
            return;
          }
          
          if (user.displayName) {
            setUserName(user.displayName.split(' ')[0]);
          } else {
            setUserName('');
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserName('Pana');
        }
      } else {
        setUserName('');
      }
    }
    fetchUserData();
  }, [user]);

  const handleCountryChange = async (countryCode, defaultRegion) => {
    setCountry(countryCode);
    setRegion(defaultRegion);
    setFilters({ location: { level1: defaultRegion, level2: defaultRegion, level3: '' } });
    setIsCountryOpen(false);

    if (user?.uid && import.meta.env.VITE_AUTH_BYPASS !== 'true') {
      try {
        const countryNames = {
          'ES': '🇪🇸 España',
          'CO': '🇨🇴 Colombia',
          'US': '🇺🇸 Estados Unidos',
          'CL': '🇨🇱 Chile',
          'PA': '🇵🇦 Panamá',
          'DO': '🇩🇴 República Dominicana',
          'AR': '🇦🇷 Argentina'
        };
        await updateDoc(doc(db, "users", user.uid), {
          country: countryNames[countryCode] || countryNames['ES'],
          region: defaultRegion
        });
      } catch (err) {
        console.error("Error saving smart country pref:", err);
      }
    }
  };

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(event.target)) {
        setIsDesktopMenuOpen(false);
      }
    };
    if (isCountryOpen || isDesktopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryOpen, isDesktopMenuOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 50) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <header ref={ref} className="fixed top-0 left-0 right-0 w-full z-50 overflow-visible">
      {/* 1. TOP HEADER FIJO (Logo + Buscador) - Neumorphism */}
      <div className="bg-[#E0E5EC] pt-safe safe-area-pt shadow-[0_5px_15px_rgba(163,177,198,0.3)]">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-4">
                        {/* Logo y Ubicación */}
            <div className="flex flex-col items-center md:items-start flex-shrink-0 relative md:min-w-[180px]">
              <img 
                src={logoTexto} 
                alt="miPana" 
                style={{ objectFit: 'contain' }} 
                className="h-10 md:h-[72px] header-logo cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate('/')}
              />
              
              <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2 md:pl-1">
                {/* 1. Botón Bandera (Selector de País) */}
                <div className="relative" ref={countryRef}>
                  <button 
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform opacity-90"
                  >
                    {selectedCountry === 'ES' ? (
                      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full overflow-hidden flex flex-col border-[0.5px] border-[#003366]/20 shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.8)]">
                        <div className="h-[30%] bg-[#AD1519]"></div>
                        <div className="h-[40%] bg-[#FABD00]"></div>
                        <div className="h-[30%] bg-[#AD1519]"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full overflow-hidden flex flex-col border-[0.5px] border-[#003366]/20 shadow-[2px_2px_4px_rgba(163,177,198,0.5),-2px_-2px_4px_rgba(255,255,255,0.8)]">
                        <div className="h-[50%] bg-[#FCD116]"></div>
                        <div className="h-[25%] bg-[#003893]"></div>
                        <div className="h-[25%] bg-[#CE1126]"></div>
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isCountryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 mt-4 bg-[#E0E5EC] rounded-3xl shadow-[8px_8px_16px_rgba(163,177,198,0.7),-8px_-8px_16px_rgba(255,255,255,0.9)] border-[0.5px] border-white/60 p-2.5 z-[1001] flex flex-col gap-3"
                      >
                        <button
                          onClick={() => handleCountryChange('ES', 'Madrid')}
                          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${selectedCountry === 'ES' ? 'shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]' : 'shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95'}`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden flex flex-col shadow-sm">
                            <div className="h-[30%] bg-[#AD1519]"></div>
                            <div className="h-[40%] bg-[#FABD00]"></div>
                            <div className="h-[30%] bg-[#AD1519]"></div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleCountryChange('CO', 'Bogotá')}
                          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${selectedCountry === 'CO' ? 'shadow-[inset_4px_4px_8_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]' : 'shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95'}`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden flex flex-col shadow-sm">
                            <div className="h-[50%] bg-[#FCD116]"></div>
                            <div className="h-[25%] bg-[#003893]"></div>
                            <div className="h-[25%] bg-[#CE1126]"></div>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Botón Región / Municipio (Abre Modal Filtros de Ubicación) */}
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="cursor-pointer active:scale-95 transition-transform opacity-90"
                >
                  <span className="text-[10px] sm:text-[11px] md:text-[15px] font-black text-[#003366] tracking-widest uppercase truncate block">
                    {filters?.location?.level2 || filters?.location?.level1 || selectedRegion || 'Ubicación'}
                  </span>
                </button>
              </div>
            </div>

            {/* Buscador + Menú Hamburguesa (Container único para alineación perfecta) */}
            <div className="relative flex-1 md:max-w-5xl flex flex-col md:self-center">
              <div className="flex items-center gap-3 md:gap-4 w-full">
                {/* Buscador Claymorphism Amarillo */}
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="¿Qué necesitas, pana?" 
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters({ searchQuery: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filters.searchQuery?.trim() !== '') {
                        addRecentSearch(filters.searchQuery.trim());
                      }
                    }}
                    className="w-full h-11 md:h-14 pl-11 pr-12 bg-[#FFCC00] rounded-xl md:rounded-2xl text-sm md:text-lg text-[#1A1A3A] font-bold placeholder:text-[#1A1A3A]/70 shadow-[inset_4px_4px_8px_rgba(204,163,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/80 w-5 h-5 md:w-7 md:h-7" />
                  
                  {filters.searchQuery && (
                    <button 
                      onClick={() => setFilters({ searchQuery: '' })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[#1A1A3A]/10 rounded-full hover:bg-[#1A1A3A]/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-[#1A1A3A]" />
                    </button>
                  )}
                </div>

                {/* Menú Hamburguesa Escritorio */}
                <div className="hidden md:flex relative flex-shrink-0" ref={desktopMenuRef}>
                  <button
                    onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                    className={`w-10 h-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
                      isDesktopMenuOpen 
                      ? 'bg-[#1A1A3A] text-white shadow-[inset_4px_4px_8px_rgba(26,26,58,0.8),inset_-4px_-4px_8px_rgba(40,40,80,0.5)]' 
                      : 'bg-[#E0E5EC] text-[#1A1A3A] shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)] hover:bg-[#1A1A3A] hover:text-white'
                    }`}
                  >
                    {isDesktopMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
                  </button>

                  <AnimatePresence>
                    {isDesktopMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, originX: 1, originY: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute top-[120%] right-0 w-[240px] bg-[#E0E5EC] rounded-3xl shadow-[8px_8px_20px_rgba(163,177,198,0.7),-8px_-8px_20px_rgba(255,255,255,0.9)] border-[0.5px] border-white/60 p-3 z-50 flex flex-col gap-2"
                      >
                        <button onClick={() => { setIsDesktopMenuOpen(false); navigate('/home'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)] transition-all active:scale-95 group">
                           <Home className="w-5 h-5 text-[#0056B3] group-hover:scale-110 transition-transform" /> Inicio
                        </button>
                        <button onClick={() => { setIsDesktopMenuOpen(false); navigate('/favoritos'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)] transition-all active:scale-95 group">
                           <LucideHeart className="w-5 h-5 text-[#D90429] group-hover:scale-110 transition-transform" /> Favoritos
                        </button>
                        <button onClick={() => { setIsDesktopMenuOpen(false); navigate('/anunciar'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)] transition-all active:scale-95 group">
                           <PlusCircle className="w-5 h-5 text-[#1A1A3A] group-hover:scale-110 transition-transform" /> Anunciar
                        </button>
                        <button onClick={() => { setIsDesktopMenuOpen(false); navigate('/mensajes'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)] transition-all active:scale-95 group">
                           <MessageCircle className="w-5 h-5 text-[#FFB400] group-hover:scale-110 transition-transform" /> Mensajes
                        </button>
                        <button onClick={() => { setIsDesktopMenuOpen(false); navigate('/perfil'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#E0E5EC] text-[#1A1A3A] font-bold shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.7)] transition-all active:scale-95 group">
                           <LucideUser className="w-5 h-5 text-[#0056B3] group-hover:scale-110 transition-transform" /> Mi Perfil
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {userName && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 self-end mr-0 md:mr-[64px]"
                >
                  <p 
                    onClick={() => navigate('/perfil')}
                    className="text-[12px] md:text-[14px] font-medium text-[#1A1A3A]/80 tracking-tight cursor-pointer hover:text-[#0056B3] transition-colors"
                  >
                    Hola, <span className="font-bold underline underline-offset-2">{userName}</span>
                  </p>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 2. CATEGORIAS - Píldoras Goma (Claymorphism) que se ocultan al scroll */}
      <AnimatePresence>
        {!hidden && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`bg-[#E0E5EC]/95 backdrop-blur-md ${isDesktopMenuOpen ? 'overflow-visible' : 'overflow-hidden'}`}
          >
            <div className="max-w-7xl mx-auto py-2">
              <div 
                ref={categoriesRef}
                className="flex items-center gap-3 overflow-x-auto py-2 px-5 w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {dbCategories.map((cat, index) => {
                  const isActive = activeCategory === cat.id;
                  
                  // Brand Color Pattern: Blue, Yellow, Red
                  let iconColor;
                  if (index % 3 === 0) iconColor = '#0056B3';      // Blue
                  else if (index % 3 === 1) iconColor = '#FFB400'; // Yellow
                  else iconColor = '#D90429';                      // Red

                  const Icon = cat.icon || FiPlus;

                  return (
                    <motion.button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 transition-all duration-300
                        ${isActive 
                          ? 'bg-[#D1D9E6] text-[#1A1A3A] border-2 border-[#0056B3] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]' 
                          : 'bg-[#E0E5EC] text-gray-500 border-2 border-transparent shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)]'
                        }
                      `}
                    >
                      <Icon size={16} style={{ color: iconColor }} />
                      <span className="text-xs font-bold tracking-wide">{cat.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Línea tricolor VZLA */}
      <div className="flex w-full h-[3px]">
        <div className="flex-1 bg-[#FFCC00]"></div>
        <div className="flex-1 bg-[#003366]"></div>
        <div className="flex-1 bg-[#D90429]"></div>
      </div>
    </header>
  );
});

export default Header;
