import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, User, Star, Package, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function SellerProfileModal({ isOpen, onClose, seller, productLocation }) {
  const [sellerStats, setSellerStats] = useState({ activeAds: 0, avgRating: 0, totalReviews: 0 });
  const [sellerDetails, setSellerDetails] = useState({ birthDate: null, sex: null, createdAt: null });

  useEffect(() => {
    if (!isOpen || !seller?.userId) return;
    const fetchSellerData = async () => {
      try {
        const adsQuery = query(collection(db, 'products'), where('userId', '==', seller.userId));
        const [adsSnap, userDocSnap] = await Promise.all([
          getDocs(adsQuery),
          getDoc(doc(db, 'users', seller.userId))
        ]);
        
        if (userDocSnap.exists()) {
          const ud = userDocSnap.data();
          setSellerDetails({ 
            birthDate: ud.birthDate, 
            sex: ud.sex, 
            createdAt: ud.createdAt || ud.memberSince 
          });
          setSellerStats({
            activeAds: adsSnap.size,
            avgRating: ud.rating !== undefined ? ud.rating : (seller.rating || 0),
            totalReviews: ud.reviewCount !== undefined ? ud.reviewCount : (seller.reviewCount || 0)
          });
        }
      } catch (err) { console.error('Error fetching seller data:', err); }
    };
    fetchSellerData();
  }, [isOpen, seller]);

  if (!seller) return null;

  const calculateAge = (bd) => {
    if (!bd) return null;
    const birth = new Date(bd);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getMemberSince = (ca) => {
    if (!ca) return '---';
    const date = ca.toDate ? ca.toDate() : new Date(ca);
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  const age = calculateAge(sellerDetails.birthDate);
  const countryCode = productLocation?.country?.toLowerCase() || 'es';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9998] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[320px] bg-[#EDEDF5] rounded-[2.5rem] shadow-2xl overflow-hidden z-[9999]"
          >
            {/* Header Compacto */}
            <div className="bg-[#1A1A3A] pt-10 pb-6 px-6 relative text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/5"
              >
                <X size={16} />
              </button>

              {/* Avatar más grande */}
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#FFC200] shadow-xl mx-auto">
                  <img
                    src={seller.sellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.userName)}&background=FFC200&color=1A1A3A&bold=true`}
                    alt={seller.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {(seller.verified || seller.userVerified) && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                    <ShieldCheck size={16} className="text-[#00C97A] fill-[#00C97A]/10" />
                  </div>
                )}
              </div>

              {/* Nombre y Bandera en la misma línea */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-black text-white leading-tight tracking-tight">{seller.userName}</h2>
                <img 
                  src={`https://flagcdn.com/w40/${countryCode}.png`} 
                  alt="Flag" 
                  className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                />
              </div>
            </div>

            {/* Content compactado */}
            <div className="p-5 space-y-3">
              
              {/* Localidad */}
              <div className="bg-white/70 rounded-[1.8rem] p-3 shadow-sm border border-white/50 text-center">
                <p className="font-bold text-[8px] text-[#1A1A3A]/40 uppercase tracking-[0.2em] mb-0.5">Localidad</p>
                <p className="font-black text-[13px] text-[#1A1A3A] truncate">
                  {productLocation?.level2 || productLocation?.level1 || 'Ubicación...'}
                </p>
                <p className="text-[9px] font-bold text-[#1A1A3A]/50 uppercase tracking-tighter">
                  {productLocation?.level1}, {productLocation?.country || 'ES'}
                </p>
              </div>

              {/* Grid 2 Columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-[1.8rem] p-3 shadow-sm border border-white/50 text-center flex flex-col items-center justify-center">
                   <p className="font-bold text-[8px] text-[#1A1A3A]/40 uppercase tracking-[0.2em] mb-1">Edad</p>
                   <p className="font-black text-[13px] text-[#1A1A3A]">{age ? `${age} años` : '--'}</p>
                </div>
                <div className="bg-white/70 rounded-[1.8rem] p-3 shadow-sm border border-white/50 text-center flex flex-col items-center justify-center">
                   <p className="font-bold text-[8px] text-[#1A1A3A]/40 uppercase tracking-[0.2em] mb-1">Sexo</p>
                   <p className="font-black text-[13px] text-[#1A1A3A] capitalize line-clamp-1">{sellerDetails.sex || '--'}</p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col items-center">
                  <p className="text-lg font-black text-[#1A1A3A] leading-none mb-0.5">{sellerStats.activeAds}</p>
                  <p className="text-[8px] font-bold text-[#1A1A3A]/40 uppercase tracking-widest">Anuncios</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[12px] font-black text-[#1A1A3A] uppercase leading-none mb-0.5">
                    {getMemberSince(sellerDetails.createdAt)}
                  </p>
                  <p className="text-[8px] font-bold text-[#1A1A3A]/40 uppercase tracking-widest text-center">Miembro</p>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
