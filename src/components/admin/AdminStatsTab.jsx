import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Star, TrendingUp, Search, Trophy, Flame, Globe, RefreshCw, Eye, Heart } from 'lucide-react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useLocationStore } from '../../store/useLocationStore';

export default function AdminStatsTab() {
  const { categories } = useCategoryStore();
  const { countries, init: initCountries } = useLocationStore();
  const dbCategories = ['Todas', ...categories.map(c => c.label)];

  const [topRated, setTopRated] = useState([]);
  const [topSearched, setTopSearched] = useState([]);
  const [topViewed, setTopViewed] = useState([]);
  const [selectedCat, setSelectedCat] = useState('Todas');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Init countries store
  useEffect(() => {
    const unsub = initCountries();
    return () => unsub();
  }, [initCountries]);

  const fetchRankings = useCallback(async (category, countryCode) => {
    setLoading(true);
    try {
      const ref = collection(db, 'products');

      // Build base filters
      const buildQuery = (orderField) => {
        const filters = [];
        if (category !== 'Todas') filters.push(where('category', '==', category));
        if (countryCode !== 'ALL') filters.push(where('location.country', '==', countryCode));
        return query(ref, ...filters, orderBy(orderField, 'desc'), limit(20));
      };

      const [ratedSnap, searchedSnap, viewedSnap] = await Promise.all([
        getDocs(buildQuery('rating')),
        getDocs(buildQuery('searchCount')),
        getDocs(buildQuery('views')),
      ]);

      setTopRated(ratedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTopSearched(searchedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTopViewed(viewedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching rankings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings(selectedCat, selectedCountry);
  }, [selectedCat, selectedCountry, fetchRankings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRankings(selectedCat, selectedCountry);
  };

  const activeCountries = [
    { id: 'ALL', name: 'Todos los Países', flag: '🌎' },
    ...(countries || []).filter(c => c.status === 'active')
  ];

  const selectedCountryInfo = activeCountries.find(c => c.id === selectedCountry);

  const RankItem = ({ item, i, valueKey, icon: Icon, iconColor, formatVal }) => (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
      {/* Position badge */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
        i === 0 ? 'bg-[#FFD700] text-black shadow-md' :
        i === 1 ? 'bg-gray-200 text-gray-600' :
        i === 2 ? 'bg-orange-100 text-orange-600' :
        'bg-gray-50 text-gray-400'
      }`}>
        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
        {item.image
          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📷</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400 font-bold truncate">{item.category}</span>
          {item.location?.country && (
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-black uppercase">
              {item.location.country}
            </span>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 flex-shrink-0 bg-gray-50 px-2.5 py-1.5 rounded-xl">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className="text-sm font-black text-gray-700">
          {valueKey === 'rating' 
            ? (item.reviewCount > 0 ? Number(item.rating || 0).toFixed(1).replace('.', ',') : "0,0")
            : (formatVal ? formatVal(item[valueKey]) : (item[valueKey] || 0))}
        </span>
      </div>
    </div>
  );

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="pb-24 lg:pb-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">Rankings de la Plataforma</h2>
            <p className="text-xs font-bold text-gray-400">
              Top 20 por país y categoría
              {lastUpdated && ` · Actualizado: ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFD700] text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Country Filter */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={13} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar por País</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {activeCountries.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCountry(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                selectedCountry === c.id
                  ? 'bg-[#1A1A3A] text-white border-[#1A1A3A] shadow-lg scale-105'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="text-sm">{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Country context pill */}
        {selectedCountry !== 'ALL' && selectedCountryInfo && (
          <div className="mt-2 flex items-center gap-2 bg-[#1A1A3A]/5 px-4 py-2 rounded-xl w-fit">
            <span className="text-base">{selectedCountryInfo.flag}</span>
            <span className="text-xs font-black text-[#1A1A3A]">Mostrando ranking de <span className="text-[#0056B3]">{selectedCountryInfo.name}</span></span>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar por Categoría</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {dbCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCat === cat
                  ? 'bg-[#FFD700] text-black shadow-md'
                  : 'bg-white text-gray-400 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#FFD700] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400">Cargando rankings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Top Rated */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">Top Mejor Valorados</h3>
                <p className="text-[10px] text-gray-400 font-bold">
                  {selectedCountry === 'ALL' ? 'Global' : selectedCountryInfo?.name} · {selectedCat === 'Todas' ? 'Todas' : selectedCat}
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto hide-scrollbar">
              {topRated.filter(i => (i.rating || 0) > 0).length === 0
                ? <div className="py-12 text-center text-gray-300 font-bold text-sm">Sin valoraciones aún</div>
                : topRated.filter(i => (i.rating || 0) > 0).map((item, i) =>
                    <RankItem key={item.id} item={item} i={i} valueKey="rating" icon={Star} iconColor="text-[#FFD700] fill-[#FFD700]" />
                  )
              }
            </div>
          </div>

          {/* Top Searched */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">Top Más Buscados</h3>
                <p className="text-[10px] text-gray-400 font-bold">
                  {selectedCountry === 'ALL' ? 'Global' : selectedCountryInfo?.name} · {selectedCat === 'Todas' ? 'Todas' : selectedCat}
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto hide-scrollbar">
              {topSearched.filter(i => (i.searchCount || 0) > 0).length === 0
                ? <div className="py-12 text-center text-gray-300 font-bold text-sm">Sin búsquedas aún</div>
                : topSearched.filter(i => (i.searchCount || 0) > 0).map((item, i) =>
                    <RankItem key={item.id} item={item} i={i} valueKey="searchCount" icon={Search} iconColor="text-[#FF6B00]" formatVal={formatCount} />
                  )
              }
            </div>
          </div>

          {/* Top Viewed */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm">Top Más Vistos</h3>
                <p className="text-[10px] text-gray-400 font-bold">
                  {selectedCountry === 'ALL' ? 'Global' : selectedCountryInfo?.name} · {selectedCat === 'Todas' ? 'Todas' : selectedCat}
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto hide-scrollbar">
              {topViewed.filter(i => (i.views || 0) > 0).length === 0
                ? <div className="py-12 text-center text-gray-300 font-bold text-sm">Sin vistas aún</div>
                : topViewed.filter(i => (i.views || 0) > 0).map((item, i) =>
                    <RankItem key={item.id} item={item} i={i} valueKey="views" icon={Eye} iconColor="text-blue-500" formatVal={formatCount} />
                  )
              }
            </div>
          </div>

        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
