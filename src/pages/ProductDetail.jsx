import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, Heart, ShieldCheck, MessageCircle, AlertCircle, Star } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useStore } from '../store/useStore';

// Mock reviews for the UI (Comunidad)
const MOCK_REVIEWS = [
  { id: 1, user: "María G.", rating: 5, date: "Hace 2 días", text: "Excelente atención y muy rápido. Lo recomiendo 100%." },
  { id: 2, user: "José L.", rating: 4, date: "Hace 1 semana", text: "Muy buen servicio, llegó todo a tiempo." },
  { id: 3, user: "Ana C.", rating: 5, date: "Hace 2 semanas", text: "Súper confiable. El pana es muy amable." },
];

export default function ProductDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  
  const { favorites, toggleFavorite } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Carousel tracking
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isFavorite = favorites.includes(productId);

  useEffect(() => {
    if (!productId) {
      setError('Anuncio no encontrado');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
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

    fetchProduct();
  }, [productId]);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollPos = carouselRef.current.scrollLeft;
      const width = carouselRef.current.clientWidth;
      setActiveIndex(Math.round(scrollPos / width));
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
        <AlertCircle size={64} className="text-[#1A1A3A]/40 mb-4" />
        <h2 className="text-2xl font-black text-[#1A1A3A] mb-2">Ups, Pana...</h2>
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

  // 1. Array simulado para el carrusel para que hayan 6+ fotos (la principal del FS y las demás de relleno)
  const images = [
    product.image || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  ];

  return (
    <div className="bg-[#E0E5EC] min-h-screen font-sans overflow-x-hidden relative">
        {/* Capa 0: Fondo Amarillo Independiente y Sangrado (Full-Bleed) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[380px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-[#FFC200] to-[#E6B000] rounded-b-[2.5rem] md:rounded-b-[0] shadow-md z-0 transition-all duration-300"></div>

        {/* Capa 10: Contenedor de Contenido (Por encima del fondo) */}
        <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8 relative z-10 md:grid md:grid-cols-12 md:gap-8 lg:gap-12 pt-[70px] md:pt-[100px] pb-32">
            
            {/* 1. Carrusel de Fotos (6+) - Left Column on Desktop */}
            <div className="relative w-full pb-2 md:col-span-7 lg:col-span-7 self-start flex flex-col items-center">
                
                {/* Wrapper exclusivo para Imágenes y Dots - Restaurado con bordes curvos */}
                <div className="relative w-full rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_10px_20px_rgba(163,177,198,0.4)]">
                   <div 
                      ref={carouselRef}
                      onScroll={handleScroll}
                      className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full px-4 md:px-0 gap-4 md:gap-6"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar
                   >
                      {images.map((img, idx) => (
                         <div key={idx} className="min-w-[calc(100%-24px)] md:min-w-full flex-shrink-0 snap-center rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-[4px] border-white/60 bg-white relative shadow-sm">
                            <img src={img} alt={`${product.name} - foto ${idx + 1}`} className="w-full h-[320px] md:h-[450px] lg:h-[550px] object-cover" />
                         </div>
                      ))}
                   </div>
                   
                   {/* Indicador de posición (Dots flotantes Minimalistas) */}
                   <div className="absolute bottom-6 md:bottom-8 left-0 w-full flex justify-center z-20 pointer-events-none">
                      <div className="bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-full flex items-center gap-2 md:gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-white/50 pointer-events-auto">
                        {images.map((_, idx) => (
                           <div 
                             key={idx} 
                             className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ease-out ${
                               idx === activeIndex 
                                 ? 'bg-[#1A1A3A] w-6 md:w-8' 
                                 : 'bg-[#1A1A3A]/20 w-1.5 md:w-2'
                             }`} 
                           />
                        ))}
                      </div>
                   </div>
                </div>

                {/* Descripción (SOLO TABLET/ORDENADOR) debajo del carrusel */}
                <div className="hidden md:block bg-[#E0E5EC] rounded-[2rem] p-8 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.7)] border border-white/30 relative z-10 mx-6 md:mx-0">
                   <h3 className="text-2xl font-black text-[#1A1A3A] mb-4">Descripción del Anuncio</h3>
                   <p className="text-[#1A1A3A]/80 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                      {product.description || "Sin descripción proporcionada. ¡Contacta al vendedor para más info!"}
                   </p>
                </div>
            </div>

            {/* Content Slide-up - Right Column on Desktop */}
            <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
               className="px-5 mt-4 md:mt-0 md:col-span-5 lg:col-span-5 sticky top-28 h-max"
            >
               {/* NUEVA UBICACIÓN: Botones de Navegación debajo del carrusel (Distancia mínima) */}
               <div className="flex justify-between items-center mb-4 pt-1">
                  <button onClick={() => navigate(-1)} className="p-3 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] text-[#1A1A3A] transition-all">
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex gap-3">
                    <button className="p-3 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] text-[#1A1A3A] transition-all">
                       <Share2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => toggleFavorite(product.id)} className="p-3 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_8_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.6)] transition-all">
                       <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-[#D90429] text-[#D90429]' : 'text-[#1A1A3A]'}`} />
                    </button>
                  </div>
               </div>

               {/* 2. Información del Producto (Layout) - Vendedor */}
               <div className="mb-6 bg-[#E0E5EC] rounded-[2rem] p-4 shadow-[6px_6px_12px_rgba(163,177,198,0.6),-6px_-6px_12px_rgba(255,255,255,0.8)] border border-white/30 flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] bg-white border-2 border-white flex-shrink-0">
                     <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${product.userName || 'Pana'}&backgroundColor=E0E5EC`} className="w-full h-full object-cover" alt="Avatar"/>
                  </div>
                  <div className="flex flex-col flex-1">
                     <div className="flex items-center gap-1.5">
                        <span className="font-black text-lg md:text-xl text-[#1A1A3A] truncate max-w-[180px] md:max-w-full">{product.userName || "Pana Local"}</span>
                        {(product.verified || true) && <ShieldCheck className="w-[18px] h-[18px] md:w-5 md:h-5 text-[#0056B3] fill-[#E0E5EC]" />}
                     </div>
                     <span className="text-[11px] md:text-xs uppercase tracking-wider font-bold text-[#1A1A3A]/60 flex items-center gap-1">
                        Check de Pana Verificado
                     </span>
                  </div>
               </div>

               {/* Cabecera: Nombre y Precio (Badge Azul Claymorphism) */}
               <div className="flex flex-col gap-4 mb-6">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A3A] leading-tight drop-shadow-sm">
                     {product.name}
                  </h1>
                  
                  <div className="self-start px-6 pt-3 pb-2.5 rounded-[1.2rem] bg-[#1A1A3A] text-white shadow-[inset_2px_4px_8px_rgba(255,255,255,0.25),_0_8px_16px_rgba(26,26,58,0.3)]">
                     <span className="text-2xl md:text-3xl font-black">{product.price}€</span>
                  </div>
               </div>

               {/* Descripción (Sólo Móvil, en Desktop va a la izq) */}
               <div className="md:hidden mb-10 bg-[#E0E5EC] rounded-[1.5rem] p-5 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] border border-white/20">
                  <p className="text-[#1A1A3A]/80 font-medium leading-relaxed whitespace-pre-wrap md:text-lg">
                     {product.description || "Sin descripción proporcionada. ¡Contacta al vendedor para más info!"}
                  </p>
               </div>

               {/* 3. Estadísticas de Reseñas (Modernas) */}
               <div className="mb-6">
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A3A] mb-5">Valoraciones de la Comunidad</h3>
                  
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
                                 <Star className="w-2.5 h-2.5 text-[#1A1A3A] fill-[#1A1A3A]" />
                              </div>
                              <div className="flex-1 h-2 bg-[#1A1A3A]/10 rounded-full overflow-hidden border border-white/20 shadow-inner">
                                 <div className="h-full bg-[#1A1A3A] rounded-full" style={{ width: `${bar.p}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Lista de Comentarios en tarjetas Glassmorphic */}
                  <div className="flex flex-col gap-3">
                     {MOCK_REVIEWS.map(rw => (
                        <div key={rw.id} className="bg-[#E0E5EC] border border-white/60 rounded-[1.5rem] p-4 shadow-[4px_4px_10px_rgba(163,177,198,0.5),-4px_-4px_10px_rgba(255,255,255,0.7)] flex flex-col gap-2">
                           <div className="flex justify-between items-start">
                              <div>
                                <span className="font-black text-[#1A1A3A] text-sm">{rw.user}</span>
                                <div className="flex drop-shadow-sm mt-0.5">
                                   {[...Array(5)].map((_, i) => <Star key={i} className={`w-2.5 h-2.5 ${i < rw.rating ? 'fill-[#FFC200] text-[#FFC200]' : 'fill-[#1A1A3A]/10 text-transparent'}`} />)}
                                </div>
                              </div>
                              <span className="text-[10px] text-[#1A1A3A]/40 font-bold uppercase">{rw.date}</span>
                           </div>
                           <p className="text-[13px] text-[#1A1A3A]/80 font-semibold leading-snug">{rw.text}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Escritorio: Botones de Acción integrados al final de la columna derecha, en vez de flotar en pantalla grande */}
               <div className="hidden md:flex gap-3 mt-8">
                  <button 
                    onClick={() => window.open(`https://wa.me/${product.whatsapp || '34600000000'}?text=Hola%20${product.userName || 'Pana'},%20vi%20tu%20anuncio`)}
                    className="flex-[1.1] h-14 bg-gradient-to-br from-[#25D366] to-[#1DA851] rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_16px_rgba(37,211,102,0.4),inset_2px_4px_10px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all outline-none"
                  >
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                       <path d="M12.002 0C5.372 0 0 5.373 0 12.005C0 14.664 0.855 17.135 2.28 19.145L0.752 24.027L5.804 22.506C7.712 23.716 9.789 24.072 12.002 24.072C18.632 24.072 24 18.699 24 12.067C24 5.435 18.632 0 12.002 0ZM18.591 17.125C18.314 17.902 16.978 18.575 16.086 18.753C15.476 18.875 14.615 18.951 11.698 17.74C7.969 16.191 5.558 12.392 5.373 12.147C5.188 11.902 3.837 10.116 3.837 8.273C3.837 6.43 4.792 5.539 5.16 5.169C5.529 4.801 6.05 4.647 6.541 4.647C6.694 4.647 6.835 4.654 6.963 4.661C7.331 4.675 7.514 4.693 7.76 5.278C8.067 6.015 8.804 7.814 8.897 7.998C8.989 8.182 9.112 8.428 8.989 8.674C8.865 8.919 8.773 9.043 8.588 9.258C8.404 9.472 8.22 9.64 8.036 9.871C7.867 10.071 7.674 10.286 7.889 10.655C8.104 11.024 8.788 12.135 9.791 13.025C11.083 14.175 12.12 14.538 12.519 14.707C12.918 14.876 13.149 14.846 13.395 14.585C13.64 14.324 14.285 13.511 14.561 13.11C14.838 12.71 15.114 12.772 15.483 12.91C15.852 13.048 17.816 14.016 18.184 14.2C18.552 14.385 18.798 14.477 18.89 14.63C18.983 14.783 18.983 15.521 18.591 17.125Z" />
                     </svg>
                     <span className="text-white font-black tracking-wide text-[16px]">WhatsApp</span>
                  </button>
                  <button className="flex-1 h-14 bg-gradient-to-br from-[#2D2D4E] to-[#1A1A3A] rounded-2xl flex items-center justify-center gap-2 shadow-[inset_2px_4px_8px_rgba(255,255,255,0.25),0_8px_16px_rgba(26,26,58,0.5)] hover:-translate-y-1 transition-all outline-none border border-[#1A1A3A]">
                     <MessageCircle className="w-[22px] h-[22px] stroke-[2.5] text-white" />
                     <span className="text-white font-black tracking-wide text-[16px] mr-1">Chat Pana</span>
                  </button>
               </div>
            </motion.div>
        </div> {/* Final grid wrapper */}
        
        {/* Espacio para la barra inferior en móvil */}
        <div className="h-20 md:hidden"></div>

        {/* 4. Botones de Acción (Sticky Bottom) - Solo visible en móvil */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#E0E5EC]/95 backdrop-blur-3xl border-t border-white/60 px-5 py-4 pb-safe-bottom z-50 shadow-[0_-10px_20px_rgba(163,177,198,0.4)]">
           <div className="max-w-md mx-auto flex gap-3 h-14">
              <button 
                onClick={() => window.open(`https://wa.me/${product.whatsapp || '34600000000'}?text=Hola%20${product.userName || 'Pana'},%20vi%20tu%20anuncio`)}
                className="flex-[1.1] bg-gradient-to-br from-[#25D366] to-[#1DA851] rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_16px_rgba(37,211,102,0.4),inset_2px_4px_10px_rgba(255,255,255,0.4)] active:scale-95 transition-all outline-none"
              >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
                   <path d="M12.002 0C5.372 0 0 5.373 0 12.005C0 14.664 0.855 17.135 2.28 19.145L0.752 24.027L5.804 22.506C7.712 23.716 9.789 24.072 12.002 24.072C18.632 24.072 24 18.699 24 12.067C24 5.435 18.632 0 12.002 0ZM18.591 17.125C18.314 17.902 16.978 18.575 16.086 18.753C15.476 18.875 14.615 18.951 11.698 17.74C7.969 16.191 5.558 12.392 5.373 12.147C5.188 11.902 3.837 10.116 3.837 8.273C3.837 6.43 4.792 5.539 5.16 5.169C5.529 4.801 6.05 4.647 6.541 4.647C6.694 4.647 6.835 4.654 6.963 4.661C7.331 4.675 7.514 4.693 7.76 5.278C8.067 6.015 8.804 7.814 8.897 7.998C8.989 8.182 9.112 8.428 8.989 8.674C8.865 8.919 8.773 9.043 8.588 9.258C8.404 9.472 8.22 9.64 8.036 9.871C7.867 10.071 7.674 10.286 7.889 10.655C8.104 11.024 8.788 12.135 9.791 13.025C11.083 14.175 12.12 14.538 12.519 14.707C12.918 14.876 13.149 14.846 13.395 14.585C13.64 14.324 14.285 13.511 14.561 13.11C14.838 12.71 15.114 12.772 15.483 12.91C15.852 13.048 17.816 14.016 18.184 14.2C18.552 14.385 18.798 14.477 18.89 14.63C18.983 14.783 18.983 15.521 18.591 17.125Z" />
                 </svg>
                 <span className="text-white font-black tracking-wide text-[16px]">WhatsApp</span>
              </button>
              
              <button className="flex-1 h-14 bg-gradient-to-br from-[#2D2D4E] to-[#1A1A3A] rounded-2xl flex items-center justify-center gap-2 shadow-[inset_2px_4px_8px_rgba(255,255,255,0.25),0_8px_16px_rgba(26,26,58,0.5)] active:scale-95 transition-all outline-none border border-[#1A1A3A]">
                 <MessageCircle className="w-[22px] h-[22px] stroke-[2.5] text-white" />
                 <span className="text-white font-black tracking-wide text-[16px] mr-1">Chat Pana</span>
              </button>
           </div>
        </div>
        
        {/* Helper Style Component for hiding scrollbars if custom classes are not set */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
    </div>
  );
}