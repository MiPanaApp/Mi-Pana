import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Star } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const DEFAULT_CATEGORIES = ["Comida", "Envios", "Inmobiliaria", "Formación", "Deporte", "Empleo", "Servicios", "Ventas", "Legal", "Salud", "Otros"];

export default function AdvancedSearchPanel({ isOpen, onClose }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [filters, setFilters] = useState({
    country: '',
    category: '',
    verified: false,
    premium: false,
    minRating: 0
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        if (!snap.empty) {
          setCategories(snap.docs.map(d => d.data().name));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetch();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[85vw] max-w-sm h-full bg-pana-bg shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
               <h2 className="text-xl font-black text-pana-blue flex items-center gap-2">
                 <SlidersHorizontal className="w-5 h-5 text-pana-yellow" /> Filtros
               </h2>
               <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-pana-base bg-gray-50 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
               
               {/* Toggles */}
               <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                     <span className="font-bold text-gray-700 text-sm">Solo Premium</span>
                     <input type="checkbox" className="w-5 h-5 accent-pana-yellow rounded" checked={filters.premium} onChange={e => setFilters({...filters, premium: e.target.checked})} />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                     <span className="font-bold text-gray-700 text-sm">Panas Verificados</span>
                     <input type="checkbox" className="w-5 h-5 accent-pana-yellow rounded" checked={filters.verified} onChange={e => setFilters({...filters, verified: e.target.checked})} />
                  </label>
               </div>

               {/* Rating Slider (Simplified native range for now) */}
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700 text-sm flex items-center gap-1">Valoración Mínima</span>
                    <span className="font-black text-pana-blue bg-pana-yellow py-0.5 px-2 rounded-full text-xs flex items-center gap-1">{filters.minRating} <Star className="w-3 h-3 fill-pana-blue" /></span>
                  </div>
                  <input 
                    type="range" min="0" max="5" step="0.5" 
                    value={filters.minRating} 
                    onChange={e => setFilters({...filters, minRating: parseFloat(e.target.value)})} 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pana-yellow"
                  />
               </div>

               {/* Categories */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Categoría Específica</label>
                  <select 
                    className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-pana-yellow text-gray-700 font-medium"
                    value={filters.category}
                    onChange={e => setFilters({...filters, category: e.target.value})}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
               </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-4 pb-safe-bottom">
               <button 
                 onClick={() => setFilters({country:'', category:'', verified:false, premium:false, minRating:0})}
                 className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 active:bg-gray-200"
               >
                 Limpiar
               </button>
               <button 
                 onClick={onClose}
                 className="flex-grow py-3 rounded-xl font-black text-pana-blue bg-pana-yellow active:bg-pana-gold shadow-[0_4px_15px_rgba(255,180,0,0.3)] transition-all"
               >
                 Aplicar
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
