import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Star, TrendingUp, Search, Trophy, Flame } from 'lucide-react';

import { useCategoryStore } from '../../store/useCategoryStore';

export default function AdminStatsTab() {
  const { categories } = useCategoryStore();
  const dbCategories = ['Todas', ...categories.map(c => c.label)];
  const [topRated, setTopRated] = useState([]);
  const [topSearched, setTopSearched] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRankings(selectedCat); }, [selectedCat]);

  const fetchRankings = async (category) => {
    setLoading(true);
    try {
      const ref = collection(db, 'products');
      const ratedQ = category === 'Todas'
        ? query(ref, orderBy('rating', 'desc'), limit(20))
        : query(ref, where('category', '==', category), orderBy('rating', 'desc'), limit(20));
      const searchedQ = category === 'Todas'
        ? query(ref, orderBy('searchCount', 'desc'), limit(20))
        : query(ref, where('category', '==', category), orderBy('searchCount', 'desc'), limit(20));
      const [ratedSnap, searchedSnap] = await Promise.all([getDocs(ratedQ), getDocs(searchedQ)]);
      setTopRated(ratedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTopSearched(searchedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const RankItem = ({ item, i, valueKey, icon: Icon, iconColor }) => (
    <div className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-[#FFD700] text-black' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
        {i + 1}
      </div>
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
        <p className="text-[11px] text-gray-400 font-bold truncate">{item.category} · {item.userName || 'Pana'}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-sm font-black text-gray-700">{item[valueKey] || 0}</span>
      </div>
    </div>
  );

  return (
    <div className="pb-20 lg:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#FFD700] rounded-2xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-black" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-800">Rankings de la Plataforma</h2>
          <p className="text-xs font-bold text-gray-400">Top 20 por categoría — actualizado cada 24h</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {dbCategories.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCat === cat ? 'bg-[#FFD700] text-black shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#FFD700] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50">
              <div className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">Top 20 Mejor Valorados</h3>
                <p className="text-[11px] text-gray-400 font-bold">{selectedCat === 'Todas' ? 'Todas las categorías' : selectedCat}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {topRated.length === 0
                ? <div className="py-12 text-center text-gray-300 font-bold text-sm">Sin datos aún</div>
                : topRated.map((item, i) => <RankItem key={item.id} item={item} i={i} valueKey="rating" icon={Star} iconColor="text-[#FFD700] fill-[#FFD700]" />)
              }
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-50">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">Top 20 Más Buscados</h3>
                <p className="text-[11px] text-gray-400 font-bold">{selectedCat === 'Todas' ? 'Todas las categorías' : selectedCat}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {topSearched.length === 0
                ? <div className="py-12 text-center text-gray-300 font-bold text-sm">Sin datos aún</div>
                : topSearched.map((item, i) => <RankItem key={item.id} item={item} i={i} valueKey="searchCount" icon={Search} iconColor="text-[#FF6B00]" />)
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
