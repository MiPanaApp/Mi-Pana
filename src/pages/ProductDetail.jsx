import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, Share2, Heart, ShieldCheck, MessageCircle, AlertCircle, Star, MapPin, Flag, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import ProductCard from '../components/ProductCard';
import { useTimeAgo } from '../hooks/useTimeAgo';
import panaLengua from '../assets/pana_lengua.png';

// Los productos relacionados se cargan ahora dinámicamente desde Firestore.

// Mock reviews for the UI (Comunidad)
const MOCK_REVIEWS = [
   { id: 1, user: "María G.", rating: 5, date: "Hace 2 días", text: "Excelente atención y muy rápido. Lo recomiendo 100%." },
   { id: 2, user: "José L.", rating: 4, date: "Hace 1 semana", text: "Muy buen servicio, llegó todo a tiempo." },
   { id: 3, user: "Ana C.", rating: 5, date: "Hace 2 semanas", text: "Súper confiable. El pana es muy amable." },
   { id: 4, user: "Ricardo M.", rating: 5, date: "Hace 1 mes", text: "Me salvó la vida con la reparación de la laptop. Muy profesional." },
   { id: 5, user: "Elena P.", rating: 4, date: "Hace 1 mes", text: "Todo perfecto, aunque tardó un poco más de lo esperado." },
];

export default function ProductDetail() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const productId = searchParams.get('id');

   const { favorites, toggleFavorite } = useStore();
   const [product, setProduct] = useState(null);
   const [relatedProducts, setRelatedProducts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   // Reporting State
   const [isReportModalOpen, setIsReportModalOpen] = useState(false);
   const [reportReasons, setReportReasons] = useState([]);
   const [isReporting, setIsReporting] = useState(false);
   const [reportSuccess, setReportSuccess] = useState(false);
   
   const REPORT_REASONS = [
     "Está repetido",
     "La categoría es incorrecta",
     "Ya está vendido",
     "Es un profesional",
     "El teléfono es incorrecto",
     "Contenido ilegal",
     "Es una estafa",
     "Comentarios ofensivos o discriminatorios"
   ];

   const handleReportSubmit = async () => {
     if (reportReasons.length === 0) return;
     setIsReporting(true);
     try {
       await addDoc(collection(db, 'reports'), {
         productId: product.id,
         productName: product.name,
         reasons: reportReasons,
         createdAt: new Date(),
         status: 'pending',
       });
       setReportSuccess(true);
       setTimeout(() => {
         setIsReportModalOpen(false);
         setReportSuccess(false);
         setReportReasons([]);
       }, 3000);
     } catch (error) {
       console.error("Error reporting ad:", error);
     } finally {
       setIsReporting(false);
     }
   };

   // Carousel tracking (móvil y desktop tienen refs separados para no conflictar)
   const carouselRef = useRef(null);       // móvil
   const carouselRefDesktop = useRef(null); // desktop
   const [showAllReviews, setShowAllReviews] = useState(false); // valoraciones expandidas
   const [activeIndex, setActiveIndex] = useState(0);

   const isFavorite = (favorites || []).includes(productId);

   const timeAgo = useTimeAgo(product?.createdAt);

   // Construir array de imágenes reales: imagen principal + carrusel de Firestore
   const images = product ? [
      product.image || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      ...(Array.isArray(product.carouselImages) ? product.carouselImages : []),
   ].filter(Boolean) : [];

   // --- LÓGICA LIGHTBOX ---
   const [lightboxOpen, setLightboxOpen] = useState(false);
   const [lightboxIndex, setLightboxIndex] = useState(0);
   const [zoomed, setZoomed] = useState(false);
   const [swipeDir, setSwipeDir] = useState(1); // 1 = siguiente (izq→der), -1 = anterior

   // Abrir lightbox en la foto tocada
   const openLightbox = (idx) => {
      setLightboxIndex(idx);
      setLightboxOpen(true);
      setZoomed(false);
      document.body.style.overflow = 'hidden';
   };

   // Cerrar lightbox
   const closeLightbox = () => {
      setLightboxOpen(false);
      setZoomed(false);
      document.body.style.overflow = '';
   };

   // Navegar entre fotos dentro del lightbox
   const lightboxNext = () => {
      if (zoomed) return;
      setSwipeDir(1);
      setZoomed(false);
      setLightboxIndex(prev => (prev + 1) % images.length);
   };
   const lightboxPrev = () => {
      if (zoomed) return;
      setSwipeDir(-1);
      setZoomed(false);
      setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
   };

   // Cerrar con tecla Escape y navegar con flechas
   useEffect(() => {
      if (!lightboxOpen) return;
      const handleKey = (e) => {
         if (e.key === 'Escape') closeLightbox();
         if (e.key === 'ArrowRight') lightboxNext();
         if (e.key === 'ArrowLeft') lightboxPrev();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
   }, [lightboxOpen, lightboxIndex, images.length]);

   // Limpiar overflow al desmontar
   useEffect(() => {
      return () => { document.body.style.overflow = ''; };
   }, []);

   useEffect(() => {
      window.scrollTo(0, 0);
      if (!productId) {
         setError('Anuncio no encontrado');
         setLoading(false);
         return;
      }

      const fetchProductAndRelated = async () => {
         setLoading(true);
         try {
            // 1. Fetch Producto Principal
            const docRef = doc(db, 'products', productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
               const productData = { id: docSnap.id, ...docSnap.data() };
               setProduct(productData);

               // 2. Fetch Productos Relacionados (Misama categoría, excluyendo el actual)
               try {
                  const q = query(
                     collection(db, 'products'),
                     where('category', '==', productData.category || 'otros'),
                     limit(10)
                  );
                  const relatedSnap = await getDocs(q);
                  const relatedList = relatedSnap.docs
                     .map(doc => ({ id: doc.id, ...doc.data() }))
                     .filter(p => p.id !== productId);
                  
                  // Si hay pocos de la misma categoría, traer unos genéricos
                  if (relatedList.length < 4) {
                     const qGeneral = query(collection(db, 'products'), limit(10));
                     const genSnap = await getDocs(qGeneral);
                     const genList = genSnap.docs
                         .map(doc => ({ id: doc.id, ...doc.data() }))
                         .filter(p => p.id !== productId);
                     
                     // Mezclar y eliminar duplicados por ID
                     const merged = [...relatedList, ...genList];
                     const unique = Array.from(new Map(merged.map(p => [p.id, p])).values());
                     setRelatedProducts(unique.slice(0, 10));
                  } else {
                     setRelatedProducts(relatedList);
                  }
               } catch (err) {
                  console.warn("Error fetching related products:", err);
               }

            } else {
               setError('El anuncio ya no existe o fue eliminado.');
            }
         } catch (err) {
            console.error(err);
            setError('Error de conexión al cargar el anuncio.');
         } finally {
            setLoading(false);
         }
      };

      fetchProductAndRelated();
   }, [productId]);

   const handleScroll = (ref) => {
      const el = ref?.current || carouselRef.current;
      if (el) {
         const scrollPos = el.scrollLeft;
         const width = el.clientWidth;
         setActiveIndex(Math.round(scrollPos / width));
      }
   };

   const scrollToIndex = (idx) => {
      // Intentar con el ref activo (móvil primero, luego desktop)
      const el = carouselRef.current || carouselRefDesktop.current;
      if (el) {
         el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
      }
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#1A1A3A]/20 border-t-[#1A1A3A] animate-spin" />
         </div>
      );
   }

   if (error || !product) {
      return (
         <div className="min-h-screen bg-[#E0E5EC] flex flex-col items-center justify-center px-6 text-center">
            <img src={panaLengua} alt="Ups Pana" className="w-[180px] md:w-[220px] h-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)] mb-6" />
            <h2 className="text-3xl font-black text-[#1A1A3A] tracking-tighter mb-2">Ups, Pana...</h2>
            <p className="text-[#1A1A3A]/70 font-medium mb-8">{error}</p>
            <button
               onClick={() => navigate(-1)}
               className="px-6 py-3 bg-[#1A1A3A] text-white font-bold rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.2)]"
            >
               Volver atrás
            </button>
         </div>
      );
   }

   return (
      <div className="bg-[#E0E5EC] min-h-screen font-sans overflow-x-hidden relative">


         {/* Capa 10: Contenedor de Contenido (Por encima del fondo) */}
         <div className="max-w-7xl mx-auto px-3 md:px-8 relative z-10 md:grid md:grid-cols-12 md:gap-8 lg:gap-12 pt-12 md:pt-14 pb-10">

            {/* 1. Carrusel de Fotos (6+) - Left Column on Desktop */}
            <div className="relative w-full pb-2 md:col-span-7 lg:col-span-7 self-start flex flex-col items-center">

               {/* Navegación superior: Volver (Global) y Controles (Solo Móvil) */}
               <div className="flex justify-between items-center w-full px-1 md:px-0 mb-3">
                  <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#1A1A3A] hover:opacity-70 transition-all font-bold group">
                     <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                     <span className="text-[15px] tracking-wide">Volver</span>
                  </button>
                  <div className="flex md:hidden items-center gap-5">
                     <button className="text-[#1A1A3A] hover:opacity-70 transition-all">
                        <Share2 className="w-5 h-5" />
                     </button>
                     <button onClick={() => toggleFavorite(product.id)} className="transition-all active:scale-90">
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-[#D90429] text-[#D90429]' : 'text-[#1A1A3A] hover:text-[#D90429]'}`} />
                     </button>
                  </div>
               </div>


               {/* Wrapper exclusivo para Imágenes y Dots */}
               {/* MÓVIL: sangrado completo (edge-to-edge), sin bordes redondeados en lados */}
               {/* DESKTOP: con padding y bordes redondeados */}
               <div className="relative w-full md:px-0">
                  {/* Contenedor edge-to-edge en móvil: -mx compensa el px del padre */}
                  <div className="md:hidden -mx-3">
                     {/* Borde blanco superior */}
                     <div className="w-full h-[4px] bg-white/70" />
                     <div
                        ref={carouselRef}
                        onScroll={() => handleScroll(carouselRef)}
                        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full gap-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                     >
                        {images.map((img, idx) => (
                           <div key={idx} className="min-w-full flex-shrink-0 snap-center overflow-hidden bg-white relative">
                              <img
                                 src={img}
                                 alt={`${product.name} - foto ${idx + 1}`}
                                 className="w-full h-[260px] object-cover cursor-zoom-in active:scale-95 transition-transform duration-150"
                                 onClick={() => openLightbox(idx)}
                              />
                              {/* Icono de lupa sutil en esquina */}
                              <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-full p-1.5 pointer-events-none">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                    <path d="M11 8v6M8 11h6" />
                                 </svg>
                              </div>
                           </div>
                        ))}
                     </div>
                     {/* Borde blanco inferior */}
                     <div className="w-full h-[4px] bg-white/70" />
                  </div>

                   {/* DESKTOP: carrusel con bordes redondeados y estilos normales */}
                  <div className="hidden md:block">
                     <div
                        ref={carouselRefDesktop}
                        onScroll={() => handleScroll(carouselRefDesktop)}
                        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full gap-0"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                     >
                        {images.map((img, idx) => (
                           <div key={idx} className="min-w-full flex-shrink-0 snap-center rounded-[2.5rem] overflow-hidden border-[4px] border-white/60 bg-white relative shadow-sm">
                              <img
                                 src={img}
                                 alt={`${product.name} - foto ${idx + 1}`}
                                 className="w-full h-[450px] lg:h-[550px] object-cover cursor-zoom-in active:scale-95 transition-transform duration-150"
                                 onClick={() => openLightbox(idx)}
                              />
                              <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm rounded-full p-1.5 pointer-events-none">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                    <path d="M11 8v6M8 11h6" />
                                 </svg>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Indicador de posición (Dots flotantes) — aplica a ambos */}
                  <div className="absolute bottom-7 left-0 w-full flex justify-center z-20 pointer-events-none">
                     <div className="bg-white/80 backdrop-blur-xl px-2 py-1.5 md:px-4 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/50 pointer-events-auto">
                        {images.map((_, idx) => (
                           <button
                              key={idx}
                              onClick={() => scrollToIndex(idx)}
                              className={`h-1 md:h-2 rounded-full transition-all duration-500 ease-out outline-none ${idx === activeIndex
                                 ? 'bg-[#1A1A3A] w-3 md:w-8'
                                 : 'bg-[#1A1A3A]/20 w-1 md:w-2'
                                 }`}
                           />
                        ))}
                     </div>
                  </div>
               </div>

               {/* Descripción (SOLO TABLET/ORDENADOR) debajo del carrusel */}
               <div className="hidden md:block w-full relative z-10 mb-[150px] mt-14">
                   <h3 className="text-2xl font-black text-[#1A1A3A] mb-8">
                      Descripción del Anuncio{" "}
                      <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] rounded-full translate-y-[-4px] ml-1"></span>
                   </h3>
                  <p className="text-[#1A1A3A]/80 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                     {product.description || `Se ofrece servicios informáticos tanto para mac como para Windows. En remoto o en mi casa si no es posible el remoto.

Técnico especializado con más de 10 años de experiencia.
-soporte instalación programas (office, adobe, autocad, indesign, illustrator, photoshop....etc)
-Cambio de disco duro por ssd
-limpieza y optimización de equipos
-ampliación de equipos
-Limpieza de virus ...etc.

Servicio post-venta gratuito
Preguntar sin compromiso.

tlfno contacto: 672 593 950`}
                  </p>

                  {/* Keywords / Etiquetas (Desktop) */}
                  {product.keywords && product.keywords.length > 0 && (
                     <div className="flex flex-wrap gap-3 mt-8">
                        {product.keywords.map((kw, i) => (
                           <span key={i} className="px-5 py-2 rounded-xl bg-white/40 text-[#1A1A3A]/50 text-sm font-black border border-white/60 shadow-sm transition-all hover:scale-105">
                              #{kw}
                           </span>
                        ))}
                     </div>
                  )}
               </div>

               {/* Valoraciones de la Comunidad — SOLO TABLET/ESCRITORIO (Columna izquierda) */}
               <div className="hidden md:block w-full mt-[100px]">
                   <h3 className="text-2xl font-black text-[#1A1A3A] mb-8">
                      Valoraciones de la Comunidad{" "}
                      <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] rounded-full translate-y-[-4px] ml-1"></span>
                   </h3>

                  {/* Tarjeta de Resumen - Ancha para ocupar el espacio horizontal */}
                  <div className="mb-10 bg-[#E0E5EC] rounded-[2.5rem] p-10 border border-white/40 shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)] flex items-center justify-between gap-20">
                     {/* Izquierda: Promedio de Valoración */}
                     <div className="flex flex-col items-center justify-center border-r border-[#1A1A3A]/10 pr-20">
                        <span className="text-7xl font-black text-[#1A1A3A] tracking-tighter">{product.rating || "4.8"}</span>
                        <div className="flex text-white drop-shadow-md mt-2 mb-3">
                           {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#FFC200] text-[#FFC200]" />)}
                        </div>
                        <span className="text-[12px] uppercase font-bold text-[#1A1A3A]/50 tracking-[0.25em] leading-none text-center">
                           {product.reviewCount || "124"} VALORACIONES
                        </span>
                     </div>

                     {/* Derecha: Barras Estadísticas */}
                     <div className="flex-1 flex flex-col gap-3.5 max-w-lg">
                        {[
                           { s: 5, p: 85 }, { s: 4, p: 10 }, { s: 3, p: 3 }, { s: 2, p: 2 }, { s: 1, p: 0 }
                        ].map(bar => (
                           <div key={bar.s} className="flex items-center gap-4">
                              <div className="flex items-center gap-1 w-[34px] justify-end">
                                 <span className="text-[14px] font-black text-[#1A1A3A]">{bar.s}</span>
                                 <Star className="w-3.5 h-3.5 text-[#1A1A3A] fill-[#1A1A3A]" />
                              </div>
                              <div className="flex-1 h-2.5 bg-[#1A1A3A]/10 rounded-full overflow-hidden border border-white/20 shadow-inner">
                                 <div className="h-full bg-[#1A1A3A] rounded-full" style={{ width: `${bar.p}%` }}></div>
                              </div>
                              <span className="w-10 text-[12px] font-bold text-[#1A1A3A]/40 text-right">{bar.p}%</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Lista de Comentarios - Organizada en 2 columnas debajo del resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                     {MOCK_REVIEWS.map((rw, index) => (
                        <div key={rw.id} className="py-6 flex flex-col gap-4 group transition-all">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className="w-11 h-11 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex-shrink-0 bg-gradient-to-br from-white to-[#E0E5EC]">
                                    <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${rw.user}&backgroundColor=E0E5EC`} alt={rw.user} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-black text-[#1A1A3A] text-[15px] leading-tight">{rw.user}</span>
                                    <div className="flex drop-shadow-sm mt-0.5">
                                       {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < rw.rating ? 'fill-[#FFC200] text-[#FFC200]' : 'fill-[#1A1A3A]/10 text-transparent'}`} />)}
                                    </div>
                                 </div>
                              </div>
                              <span className="text-[10px] text-[#1A1A3A]/40 font-bold uppercase tracking-widest">{rw.date}</span>
                           </div>
                           <p className="text-[14px] text-[#1A1A3A]/80 font-semibold leading-relaxed pl-1 italic">"{rw.text}"</p>
                           
                           {/* Línea tricolor divisoria */}
                           <div className="flex w-full h-[2px] mt-2 opacity-20">
                              <div className="flex-1 bg-[#FFCC00]"></div>
                              <div className="flex-1 bg-[#003366]"></div>
                              <div className="flex-1 bg-[#D90429]"></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>  {/* Fin columna izquierda */}

            {/* Content Slide-up - Right Column on Desktop */}
            <motion.div
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
               className="px-1 mt-4 md:mt-0 md:pt-[52px] md:col-span-5 lg:col-span-5 sticky top-28 h-max"
            >
               {/* Fila superior Desktop: Información del Vendedor + Botones Acción alineados */}
               <div className="flex items-center justify-between mb-4 pl-1">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full overflow-hidden shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] bg-white border-2 border-white flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${product.userName || 'Pana'}&backgroundColor=E0E5EC`} className="w-full h-full object-cover" alt="Avatar" />
                     </div>
                     <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="font-bold text-lg text-[#1A1A3A] truncate max-w-[140px] md:max-w-[180px] lg:max-w-[220px]">{product.userName || "Pana Local"}</span>
                        {(product.verified || true) && <ShieldCheck className="w-5 h-5 text-[#25D366] fill-[#25D366]/10" />}
                     </div>
                  </div>

                  {/* Indicador de Ubicación (Dinamico) */}
                  <div className="flex items-center gap-4 pr-1">
                     <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-[#FFC200] to-[#FFAA00] shadow-[0_4px_10px_rgba(255,180,0,0.3)] group transition-all hover:scale-105 active:scale-95">
                        <MapPin className="w-3.5 h-3.5 text-[#1A1A3A]" />
                        <span className="text-[12px] font-bold text-[#1A1A3A] uppercase tracking-wider">
                           {product.location || "Madrid"}
                        </span>
                     </div>

                     {/* Botones de Acción: Solo Desktop (sin fondos, alineados con el nombre) */}
                     <div className="hidden md:flex items-center gap-5 pr-1">
                        <button className="text-[#1A1A3A] hover:opacity-70 transition-all">
                           <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button onClick={() => toggleFavorite(product.id)} className="transition-all active:scale-90">
                           <Heart className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isFavorite ? 'fill-[#D90429] text-[#D90429]' : 'text-[#1A1A3A] hover:text-[#D90429]'}`} />
                        </button>
                     </div>
                  </div>
               </div>

               {/* Cabecera: Nombre, Tiempo publicado y Precio (Badge Azul Claymorphism) */}
               <div className="flex flex-col gap-3 mb-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A3A] leading-tight drop-shadow-sm">
                     {product.name}
                  </h1>

                  {/* Indicador de tiempo dinámico */}
                  {timeAgo && (
                     <p className="text-[13px] font-medium text-[#0056B3] flex items-center gap-1.5 opacity-80">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D90429] flex-shrink-0 shadow-[0_0_8px_rgba(217,4,41,0.4)]" />
                        {timeAgo}
                     </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                     <div className="px-5 pt-3 pb-2.5 rounded-[1.2rem] bg-[#1A1A3A] text-white shadow-[inset_2px_4px_8px_rgba(255,255,255,0.25),_0_8px_16px_rgba(26,26,58,0.3)] flex items-baseline gap-0.5">
                        <span className="text-3xl md:text-4xl font-black">
                           {Math.floor(parseFloat(product.price) || 0)}
                        </span>
                         <span className="text-xl md:text-2xl font-black">
                           ,{((parseFloat(product.price) || 0) % 1).toFixed(2).split('.')[1]}
                        </span>
                        <span className="text-xl md:text-2xl font-black ml-0.5">€</span>
                     </div>

                     {(product.premium || product.id % 2 === 0) && (
                        <div className={`px-4 py-2 rounded-xl text-white text-[12px] font-black tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.15)] uppercase ${product.premium ? 'bg-[#0056B3]' : 'bg-[#D90429]'}`}>
                           {product.premium ? 'TOP' : 'NUEVO'}
                        </div>
                     )}
                  </div>
               </div>

               {/* Descripción (Sólo Móvil, en Desktop va a la izq) */}
               <div className="md:hidden mb-[150px] px-1">
                   <h3 className="text-xl font-black text-[#1A1A3A] mb-4">
                      Descripción{" "}
                      <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] rounded-full translate-y-[-4px] ml-1"></span>
                   </h3>
                  <p className="text-[#1A1A3A]/80 font-medium leading-relaxed whitespace-pre-wrap">
                     {product.description || `Se ofrece servicios informáticos tanto para mac como para Windows. En remoto o en mi casa si no es posible el remoto.

Técnico especializado con más de 10 años de experiencia.
-soporte instalación programas (office, adobe, autocad, indesign, illustrator, photoshop....etc)
-Cambio de disco duro por ssd
-limpieza y optimización de equipos
-ampliación de equipos
-Limpieza de virus ...etc.

Servicio post-venta gratuito
Preguntar sin compromiso.

tlfno contacto: 672 593 950`}
                  </p>

                  {/* Keywords / Etiquetas (Mobile) */}
                  {product.keywords && product.keywords.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-6">
                        {product.keywords.map((kw, i) => (
                           <span key={i} className="px-3 py-1.5 rounded-full bg-white/50 text-[#1A1A3A]/60 text-[11px] font-bold border border-white/40 shadow-sm">
                              #{kw}
                           </span>
                        ))}
                     </div>
                  )}
               </div>

               {/* 3. Estadísticas de Reseñas — Solo visible en móvil */}
               <div className="md:hidden mb-6">
                   <h3 className="text-xl md:text-2xl font-black text-[#1A1A3A] mb-6">
                      Valoraciones de la Comunidad{" "}
                      <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] rounded-full translate-y-[-4px] ml-1"></span>
                   </h3>

                  <div className="flex gap-6 items-center mb-6 bg-[#E0E5EC] rounded-[2rem] p-6 border border-white/40 shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)]">
                     {/* Left: Promedio */}
                     <div className="flex flex-col items-center justify-center border-r border-[#1A1A3A]/10 pr-6">
                        <span className="text-5xl font-black text-[#1A1A3A] tracking-tighter">{product.rating || "4.8"}</span>
                        <div className="flex text-white drop-shadow-md mt-1 mb-1">
                           {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#FFC200] text-[#FFC200]" />)}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#1A1A3A]/50 tracking-widest">{product.reviewCount || "124"} avisos</span>
                     </div>

                     {/* Right: Barras de progreso (App Store Style) */}
                     <div className="flex-1 flex flex-col gap-2">
                        {[
                           { s: 5, p: 85 }, { s: 4, p: 10 }, { s: 3, p: 3 }, { s: 2, p: 2 }, { s: 1, p: 0 }
                        ].map(bar => (
                           <div key={bar.s} className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5 w-[22px] justify-end">
                                 <span className="text-[11px] font-black text-[#1A1A3A]">{bar.s}</span>
                                 <Star className="w-3 h-3 text-[#1A1A3A] fill-[#1A1A3A]" />
                              </div>
                              <div className="flex-1 h-2 bg-[#1A1A3A]/10 rounded-full overflow-hidden border border-white/20 shadow-inner">
                                 <div className="h-full bg-[#1A1A3A] rounded-full" style={{ width: `${bar.p}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Lista de Comentarios — colapsable con fade inferior */}
                  <div className="relative">
                     <motion.div
                        animate={{ maxHeight: showAllReviews ? 2000 : 310 }}
                        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                        className="flex flex-col overflow-hidden"
                     >
                        {MOCK_REVIEWS.map((rw, index) => (
                           <div key={rw.id} className="py-4 flex flex-col gap-1.5 transition-all">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <span className="font-black text-[#1A1A3A] text-[15px] leading-none mb-1">{rw.user}</span>
                                    <div className="flex drop-shadow-sm">
                                       {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < rw.rating ? 'fill-[#FFC200] text-[#FFC200]' : 'fill-[#1A1A3A]/10 text-transparent'}`} />)}
                                    </div>
                                 </div>
                                 <span className="text-[10px] text-[#1A1A3A]/50 font-bold uppercase tracking-wider">{rw.date}</span>
                              </div>
                              <p className="text-[14px] text-[#1A1A3A]/80 font-semibold leading-snug pr-4">{rw.text}</p>

                              {/* Línea tricolor divisoria */}
                              {index < MOCK_REVIEWS.length - 1 && (
                                 <div className="flex w-full h-[2px] mt-4 opacity-20">
                                    <div className="flex-1 bg-[#FFCC00]"></div>
                                    <div className="flex-1 bg-[#003366]"></div>
                                    <div className="flex-1 bg-[#D90429]"></div>
                                 </div>
                              )}
                           </div>
                        ))}
                     </motion.div>

                     {/* Gradiente fade inferior — visible solo cuando está colapsado */}
                     <AnimatePresence>
                        {!showAllReviews && (
                           <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                              style={{
                                 background: 'linear-gradient(to bottom, transparent, #E0E5EC)'
                              }}
                           />
                        )}
                     </AnimatePresence>
                  </div>

                  {/* Botón expandir / colapsar */}
                  <motion.button
                     whileTap={{ scale: 0.97 }}
                     onClick={() => setShowAllReviews(v => !v)}
                     className="w-full mt-3 py-3 flex items-center justify-center gap-2 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-bold text-sm tracking-wide transition-all active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)]"
                  >
                     <motion.span animate={{ rotate: showAllReviews ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown className="w-4 h-4" />
                     </motion.span>
                     {showAllReviews ? 'Ocultar valoraciones' : `Ver las ${MOCK_REVIEWS.length} valoraciones`}
                  </motion.button>
               </div>

               {/* Botones de Acción integrados al final del flujo del contenido */}
               <div className="flex gap-4 mt-10 mb-6">
                  <button
                     onClick={() => window.open(`https://wa.me/${product.whatsapp || '34600000000'}?text=Hola%20${product.userName || 'Pana'},%20vi%20tu%20anuncio`)}
                     className="flex-1 h-[56px] px-4 bg-gradient-to-br from-[#25D366] to-[#1DA851] rounded-2xl flex items-center justify-center gap-1.5 shadow-[0_8px_16px_rgba(37,211,102,0.4),inset_2px_4px_10px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all outline-none"
                  >
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm flex-shrink-0">
                        <path d="M12.002 0C5.372 0 0 5.373 0 12.005C0 14.664 0.855 17.135 2.28 19.145L0.752 24.027L5.804 22.506C7.712 23.716 9.789 24.072 12.002 24.072C18.632 24.072 24 18.699 24 12.067C24 5.435 18.632 0 12.002 0ZM18.591 17.125C18.314 17.902 16.978 18.575 16.086 18.753C15.476 18.875 14.615 18.951 11.698 17.74C7.969 16.191 5.558 12.392 5.373 12.147C5.188 11.902 3.837 10.116 3.837 8.273C3.837 6.43 4.792 5.539 5.16 5.169C5.529 4.801 6.05 4.647 6.541 4.647C6.694 4.647 6.835 4.654 6.963 4.661C7.331 4.675 7.514 4.693 7.76 5.278C8.067 6.015 8.804 7.814 8.897 7.998C8.989 8.182 9.112 8.428 8.989 8.674C8.865 8.919 8.773 9.043 8.588 9.258C8.404 9.472 8.22 9.64 8.036 9.871C7.867 10.071 7.674 10.286 7.889 10.655C8.104 11.024 8.788 12.135 9.791 13.025C11.083 14.175 12.12 14.538 12.519 14.707C12.918 14.876 13.149 14.846 13.395 14.585C13.64 14.324 14.285 13.511 14.561 13.11C14.838 12.71 15.114 12.772 15.483 12.91C15.852 13.048 17.816 14.016 18.184 14.2C18.552 14.385 18.798 14.477 18.89 14.63C18.983 14.783 18.983 15.521 18.591 17.125Z" />
                     </svg>
                     <span className="text-white font-bold tracking-tight text-[15px] whitespace-nowrap">WhatsApp</span>
                  </button>
                  <button className="flex-1 h-[56px] px-4 bg-gradient-to-br from-[#2D2D4E] to-[#1A1A3A] rounded-2xl flex items-center justify-center gap-2 shadow-[inset_2px_4px_8px_rgba(255,255,255,0.25),0_8px_16px_rgba(26,26,58,0.5)] hover:-translate-y-1 transition-all outline-none border border-[#1A1A3A]">
                     <MessageCircle className="w-[18px] h-[18px] stroke-[2.5] text-white flex-shrink-0" />
                     <span className="text-white font-bold tracking-tight text-[15px] whitespace-nowrap">Chat Pana</span>
                  </button>
               </div>

               {/* Botón de denunciar/informar */}
               <div className="mt-8 flex flex-col items-center justify-center pb-6 border-b border-[#1A1A3A]/10">
                 <span className="font-bold text-[#1A1A3A] mb-3 text-sm">¿Hay algo que debamos revisar?</span>
                 <button 
                   onClick={() => setIsReportModalOpen(true)}
                   className="flex items-center gap-2 px-6 py-3 border-2 border-[#D90429] text-[#D90429] rounded-2xl font-bold hover:bg-[#D90429] hover:text-white transition-all active:scale-95 w-full md:w-auto justify-center"
                 >
                   <Flag className="w-5 h-5 pointer-events-none" />
                   Informar sobre el anuncio
                 </button>
               </div>
            </motion.div>
         </div> {/* Final grid wrapper */}

         {/* 5. SECCIÓN DE RELACIONADOS (Carrusel Horizontal) */}
         <div className="max-w-7xl mx-auto px-5 md:px-8 mb-2">
            <h3 className="text-2xl font-black text-[#1A1A3A] mb-8 pt-10 border-t border-[#1A1A3A]/5">
               Anuncios relacionados{" "}
               <span className="inline-block h-1.5 w-6 bg-gradient-to-r from-[#FFC200] to-[#FFAA00] rounded-full translate-y-[-4px] ml-1"></span>
            </h3>

            <div className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0">
               {relatedProducts.map((relatedProd) => (
                  <div key={relatedProd.id} className="min-w-[240px] md:min-w-[280px] snap-center">
                     <ProductCard product={relatedProd} />
                  </div>
               ))}
               {/* Espaciador final para que en móvil el último elemento no quede pegado */}
               <div className="min-w-[20px] md:hidden"></div>
            </div>
         </div>



         {/* --- LIGHTBOX PANTALLA COMPLETA CON SWIPE --- */}
         <AnimatePresence>
            {lightboxOpen && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
               >
                  {/* Header: Contador + Botón cerrar */}
                  <div className="flex items-center justify-between px-5 pt-12 pb-3 z-[110] flex-shrink-0">
                     <span className="text-white/60 text-sm font-black tracking-widest uppercase">
                        {lightboxIndex + 1} / {images.length}
                     </span>
                     <button
                        onClick={closeLightbox}
                        className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all active:scale-90"
                     >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                           <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                     </button>
                  </div>

                  {/* Zona central: imagen con swipe */}
                  <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                     <AnimatePresence mode="popLayout" custom={swipeDir}>
                        <motion.div
                           key={lightboxIndex}
                           custom={swipeDir}
                           initial={{ x: swipeDir * 400, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           exit={{ x: swipeDir * -400, opacity: 0 }}
                           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                           drag={images.length > 1 && !zoomed ? 'x' : false}
                           dragConstraints={{ left: 0, right: 0 }}
                           dragElastic={0.2}
                           onDragEnd={(e, info) => {
                              if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 300) {
                                 if (info.offset.x < 0 || info.velocity.x < -200) lightboxNext();
                                 else lightboxPrev();
                              }
                           }}
                           className="absolute inset-0 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
                        >
                           <motion.img
                              src={images[lightboxIndex]}
                              alt={`${product.name} foto ${lightboxIndex + 1}`}
                              animate={{ scale: zoomed ? 2.2 : 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              drag={zoomed ? true : false}
                              dragConstraints={{ left: -400, right: 400, top: -400, bottom: 400 }}
                              className={`max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl touch-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                              onClick={() => setZoomed(z => !z)}
                           />
                        </motion.div>
                     </AnimatePresence>

                     {/* Zonas tap laterales (solo móvil, cuando no hay zoom) */}
                     {!zoomed && images.length > 1 && (
                        <>
                           {/* Zona izquierda */}
                           <button
                              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                              className="absolute left-0 top-0 h-full w-[20%] z-20 flex items-center justify-start pl-3 md:pl-6 group"
                              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.25), transparent)' }}
                           >
                              <div className="opacity-0 group-active:opacity-100 md:opacity-100 transition-opacity bg-white/10 rounded-full p-2">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                              </div>
                           </button>
                           {/* Zona derecha */}
                           <button
                              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                              className="absolute right-0 top-0 h-full w-[20%] z-20 flex items-center justify-end pr-3 md:pr-6 group"
                              style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.25), transparent)' }}
                           >
                              <div className="opacity-0 group-active:opacity-100 md:opacity-100 transition-opacity bg-white/10 rounded-full p-2">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                              </div>
                           </button>
                        </>
                     )}
                  </div>

                  {/* Footer: Dots indicadores + hint */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-3 pb-10 pt-4">
                     {images.length > 1 && (
                        <div className="flex items-center gap-2">
                           {images.map((_, idx) => (
                              <button
                                 key={idx}
                                 onClick={() => {
                                    setSwipeDir(idx > lightboxIndex ? 1 : -1);
                                    setLightboxIndex(idx);
                                    setZoomed(false);
                                 }}
                                 className={`rounded-full transition-all duration-300 ${
                                    idx === lightboxIndex
                                       ? 'bg-white w-5 h-2'
                                       : 'bg-white/30 w-2 h-2'
                                 }`}
                              />
                           ))}
                        </div>
                     )}
                     <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest md:block hidden">
                        Esc para cerrar • Flechas para navegar • Click para zoom
                     </p>
                     <p className="text-white/20 text-[10px] font-bold tracking-widest md:hidden">
                        Desliza para ver más fotos
                     </p>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* --- MODAL DE REPORTE --- */}
         <AnimatePresence>
            {isReportModalOpen && (
               <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setIsReportModalOpen(false)}
                     className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }} 
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-md bg-[#E0E5EC] rounded-3xl p-6 flex flex-col max-h-[90vh] shadow-[12px_12px_24px_rgba(163,177,198,0.7),-12px_-12px_24px_rgba(255,255,255,0.9)] border border-white/60"
                  >
                     <button 
                        onClick={() => setIsReportModalOpen(false)}
                        className="absolute top-4 right-4 p-2 text-[#1A1A3A]/50 hover:text-[#1A1A3A] transition-colors"
                     >
                        <X className="w-6 h-6" />
                     </button>
                     
                     {!reportSuccess ? (
                        <>
                           <h3 className="text-xl md:text-2xl font-black text-[#1A1A3A] mb-6 pr-8 leading-tight">
                              ¿Cuál es el motivo de tu denuncia?
                           </h3>
                           
                           <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 mb-6">
                              {REPORT_REASONS.map((reason, idx) => {
                                 const isSelected = reportReasons.includes(reason);
                                 return (
                                    <label 
                                       key={idx} 
                                       className="flex items-start gap-4 p-2 cursor-pointer group"
                                    >
                                       <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors shadow-sm ${isSelected ? 'border-[#003366] bg-[#003366]' : 'border-[#1A1A3A]/20 bg-white group-hover:border-[#003366] group-hover:bg-[#003366]/5'}`}>
                                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                       </div>
                                       <span className="text-[15px] font-bold text-[#1A1A3A]/80 pt-0.5 leading-snug select-none">{reason}</span>
                                       <input 
                                          type="checkbox"
                                          className="hidden"
                                          checked={isSelected}
                                          onChange={() => {
                                             if (isSelected) {
                                                setReportReasons(prev => prev.filter(r => r !== reason));
                                             } else {
                                                setReportReasons(prev => [...prev, reason]);
                                             }
                                          }}
                                       />
                                    </label>
                                 )
                              })}
                           </div>
                           
                           <button 
                              onClick={handleReportSubmit}
                              disabled={reportReasons.length === 0 || isReporting}
                              className="w-full py-4 rounded-2xl bg-[#D90429] text-white font-black shadow-[4px_4px_10px_rgba(217,4,41,0.3)] hover:shadow-[2px_2px_5px_rgba(217,4,41,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all active:scale-95 flex justify-center items-center h-[56px]"
                           >
                              {isReporting ? (
                                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                 "Enviar Informe"
                              )}
                           </button>
                        </>
                     ) : (
                        <div className="py-10 flex flex-col items-center text-center">
                           <div className="w-20 h-20 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                              <ShieldCheck className="w-10 h-10 text-[#25D366]" />
                           </div>
                           <h3 className="text-2xl font-black text-[#1A1A3A] mb-3">¡Gracias por avisarnos!</h3>
                           <p className="text-[#1A1A3A]/60 font-medium leading-relaxed">
                              Tu información ha sido recibida por nuestro equipo. Juntos hacemos de "Mi Pana" un lugar más seguro.
                           </p>
                        </div>
                     )}
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* Helper Style Component for hiding scrollbars if custom classes are not set */}
         <style dangerouslySetInnerHTML={{
            __html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </div>
   );
}