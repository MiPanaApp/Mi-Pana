import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ShoppingBag, Trash2, EyeOff, Eye, Filter, Search, X } from 'lucide-react';

export default function AdminAdsTab({ searchQuery = '' }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: '',
    country: '',
    keyword: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const a = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAds(a);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      let actionName = status === 'active' ? 'Mostrar (Reactivar)' : 'Ocultar';
      if (confirm(`¿Estás seguro de ${actionName} este anuncio?`)) {
        await updateDoc(doc(db, 'products', id), { status });
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado del anuncio. Verifica tus permisos o reglas de Firebase.');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (confirm('¿Estás seguro de ELIMINAR permanentemente este anuncio? Esta acción no se puede deshacer.')) {
        await deleteDoc(doc(db, 'products', id));
      }
    } catch (e) {
      console.error(e);
      alert('Error al borrar el anuncio.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const uniqueCategories = useMemo(() => {
    const cats = ads.map(ad => ad.category || 'Otros');
    return [...new Set(cats)].sort();
  }, [ads]);

  const uniqueCountries = useMemo(() => {
    const countries = ads.map(ad => {
      if (typeof ad.location === 'object' && ad.location?.country) {
        return ad.location.country;
      }
      if (typeof ad.location === 'string') {
        const parts = ad.location.split(',');
        return parts[parts.length - 1]?.trim() || '';
      }
      return '';
    }).filter(c => c !== '');
    return [...new Set(countries)].sort();
  }, [ads]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando anuncios...</div>;

  const filteredAds = ads.filter((ad) => {
    const searchString = (ad.name + ' ' + ad.userName + ' ' + (ad.description || '')).toLowerCase();
    
    // Global Search from Dashboard
    if (searchQuery && !searchString.includes(searchQuery.toLowerCase())) return false;
    
    // Keyword Filter
    if (filters.keyword && !searchString.includes(filters.keyword.toLowerCase())) return false;

    // Status Filter
    const actualStatus = ad.status || 'active';
    if (filters.status !== 'all' && actualStatus !== filters.status) return false;

    // Category Filter
    const actualCategory = ad.category || 'Otros';
    if (filters.category && actualCategory !== filters.category) return false;

    // Country Filter
    if (filters.country) {
      let adCountry = '';
      if (typeof ad.location === 'object' && ad.location?.country) {
        adCountry = ad.location.country;
      } else if (typeof ad.location === 'string') {
        const parts = ad.location.split(',');
        adCountry = parts[parts.length - 1]?.trim() || '';
      }
      if (adCountry !== filters.country) return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-full mb-6 border border-gray-50">
        
        {/* Header and Toggle Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="font-black text-2xl text-gray-800">Gestión de Anuncios</h3>
            <p className="text-sm font-bold text-gray-400 mt-1">Total resultados: {filteredAds.length}</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar">
            {/* Quick Status Filters */}
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex-shrink-0">
              {['all', 'active', 'hidden'].map((st) => (
                <button 
                  key={st}
                  onClick={() => handleFilterChange('status', st)} 
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${filters.status === st ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {st === 'all' ? 'Todos' : st === 'active' ? 'Activos' : 'Ocultos'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${showFilters ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Filtros Avanzados"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 p-5 rounded-2xl mb-6 border border-gray-100 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Filtros Avanzados</h4>
              <button onClick={() => {
                setFilters({ status: 'all', category: '', country: '', keyword: '' });
                setShowFilters(false);
              }} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar Todo
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Categoría</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Todas las categorías</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              {/* Country / Nivel 1 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">País / Región</label>
                <select 
                  value={filters.country} 
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Todos los países</option>
                  {uniqueCountries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Palabra Clave</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ej. iPhone, Moto..." 
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List of Ads */}
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
          {filteredAds.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No se encontraron anuncios que coincidan con la búsqueda.
            </div>
          )}
          {filteredAds.map(ad => (
            <div key={ad.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4 transition-all hover:bg-white hover:shadow-md">
              <div className="flex items-center gap-4 overflow-hidden flex-1">
                <div className="w-14 h-14 bg-blue-100/50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-blue-100">
                  {ad.image ? <img src={ad.image} alt={ad.name} className="w-full h-full object-cover"/> : <ShoppingBag className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-black text-[15px] text-gray-800 line-clamp-1">{ad.name}</span>
                  <span className="text-xs text-gray-500 font-bold line-clamp-1 mt-0.5">€ {ad.price} • Publicado por: <span className="text-gray-700">{ad.userName}</span></span>
                  <div className="flex gap-2 mt-1.5 overflow-x-auto hide-scrollbar block">
                    <span className={`text-[10px] min-w-max font-black uppercase px-2 py-0.5 rounded-lg ${
                      ad.status === 'hidden' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {ad.status === 'hidden' ? 'Oculto' : 'Activo'}
                    </span>
                    <span className="text-[10px] min-w-max font-bold text-gray-500 uppercase bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                      {ad.category || 'Otros'}
                    </span>
                    <span className="text-[10px] min-w-max font-bold text-gray-400 uppercase bg-transparent px-1 py-0.5 flex items-center">
                      ID: {String(ad.id).substring(0,6)}...
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0 sm:ml-2 justify-end">
                {ad.status === 'hidden' ? (
                  <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="p-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shadow-sm flex items-center gap-2" title="Mostrar Anuncio (Hacer Público)">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-black sm:hidden">Mostrar</span>
                  </button>
                ) : (
                  <button onClick={() => handleUpdateStatus(ad.id, 'hidden')} className="p-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors shadow-sm flex items-center gap-2" title="Ocultar Anuncio (Privado)">
                    <EyeOff className="w-4 h-4" />
                    <span className="text-xs font-black sm:hidden">Ocultar</span>
                  </button>
                )}
                
                <button onClick={() => handleDelete(ad.id)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm flex items-center gap-2" title="Eliminar Permanentemente">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-black sm:hidden">Borrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
