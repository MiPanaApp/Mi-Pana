import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ShoppingBag, Trash2, EyeOff, Eye, Filter, Search, X, Info, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';

const countryData = {
  ES: { name: 'España' },
  US: { name: 'Estados Unidos' },
  CO: { name: 'Colombia' },
  EC: { name: 'Ecuador' },
  PA: { name: 'Panamá' },
  PE: { name: 'Perú' },
  DO: { name: 'República Dominicana' },
  CL: { name: 'Chile' },
  AR: { name: 'Argentina' }
};

export default function AdminAdsTab({ searchQuery = '' }) {
  const navigate = useNavigate();
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

  // Controls custom dropdowns
  const [openSelect, setOpenSelect] = useState(null); // 'category' | 'country' | null

  // States for Info Modal
  const [infoAd, setInfoAd] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
    return n.toString();
  };

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
      
      // Since filters.country uses the short code (ES, US...), we need to match it
      // if adCountry is 'ES' it matches 'ES'. If adCountry is 'España', we match name.
      const selectedObj = countryData[filters.country];
      if (selectedObj) {
         if (adCountry !== filters.country && adCountry !== selectedObj.name) {
             return false;
         }
      } else {
         if (adCountry !== filters.country) return false;
      }
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
          <div className="bg-gray-50 p-5 rounded-2xl mb-6 border border-gray-100 animate-in fade-in slide-in-from-top-4 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Filtros Avanzados</h4>
              <button onClick={() => {
                setFilters({ status: 'all', category: '', country: '', keyword: '' });
                setShowFilters(false);
                setOpenSelect(null);
              }} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar Todo
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Custom Category Select */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Categoría</label>
                <div 
                  onClick={() => setOpenSelect(openSelect === 'category' ? null : 'category')}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700 select-none flex items-center gap-2">
                    {filters.category ? (
                      <>
                        {(() => {
                           const catObj = CATEGORIES.find(c => c.name === filters.category);
                           if (!catObj) return filters.category;
                           const IconTag = catObj.icon;
                           return <><IconTag className="w-4 h-4 text-blue-500" /> {catObj.name}</>;
                        })()}
                      </>
                    ) : 'Todas las categorías'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSelect === 'category' ? 'rotate-180' : ''}`} />
                </div>
                {openSelect === 'category' && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-2 custom-scrollbar animate-in fade-in slide-in-from-top-1">
                    <button 
                      onClick={() => { handleFilterChange('category', ''); setOpenSelect(null); }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Todas las categorías
                    </button>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => { handleFilterChange('category', cat.name); setOpenSelect(null); }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <cat.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Custom Country / Nivel 1 Select */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">País / Región</label>
                <div 
                  onClick={() => setOpenSelect(openSelect === 'country' ? null : 'country')}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <span className="text-sm font-bold text-gray-700 select-none flex items-center gap-2">
                    {filters.country && countryData[filters.country] ? (
                      <>
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 relative">
                          <img 
                            src={`https://flagcdn.com/w80/${filters.country.toLowerCase()}.png`} 
                            alt={filters.country}
                            className="w-full h-full object-cover absolute inset-0" 
                          />
                        </div>
                        {countryData[filters.country].name}
                      </>
                    ) : filters.country ? filters.country : 'Todos los países'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openSelect === 'country' ? 'rotate-180' : ''}`} />
                </div>
                {openSelect === 'country' && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-2 custom-scrollbar animate-in fade-in slide-in-from-top-1">
                    <button 
                      onClick={() => { handleFilterChange('country', ''); setOpenSelect(null); }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Todos los países
                    </button>
                    {Object.entries(countryData).map(([code, data]) => (
                      <button 
                        key={code}
                        onClick={() => { handleFilterChange('country', code); setOpenSelect(null); }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 relative">
                          <img 
                            src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`} 
                            alt={code}
                            className="w-full h-full object-cover absolute inset-0" 
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{data.name}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors placeholder:font-medium"
                  />
                </div>
              </div>
            </div>
            
            {/* Click Outside overlay to close selects quickly */}
            {openSelect && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setOpenSelect(null)}
              />
            )}
          </div>
        )}

        {/* List of Ads */}
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar relative z-0">
          {filteredAds.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No se encontraron anuncios que coincidan con la búsqueda.
            </div>
          )}
          {filteredAds.map(ad => (
            <div key={ad.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4 transition-all hover:bg-white hover:shadow-md">
              <div className="flex items-center gap-4 overflow-hidden flex-1">
                <div 
                  onClick={() => navigate(`/perfil-producto?id=${ad.id}`)}
                  className="w-14 h-14 bg-blue-100/50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-blue-100 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {ad.image ? <img src={ad.image} alt={ad.name} className="w-full h-full object-cover"/> : <ShoppingBag className="w-6 h-6 text-blue-500" />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span 
                    onClick={() => navigate(`/perfil-producto?id=${ad.id}`)}
                    className="font-black text-[15px] text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                  >{ad.name}</span>
                  <span className="text-xs text-gray-500 font-bold line-clamp-1 mt-0.5">€ {ad.price} • Publicado por: <span className="text-gray-700">{ad.userName}</span></span>
                  <div className="flex gap-2 mt-1.5 overflow-x-auto hide-scrollbar block">
                    <span className={`text-[10px] min-w-max font-black uppercase px-2 py-0.5 rounded-lg ${
                      ad.status === 'hidden' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {ad.status === 'hidden' ? 'Oculto' : 'Activo'}
                    </span>
                    <span className="text-[10px] min-w-max font-bold text-gray-500 uppercase bg-white border border-gray-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      {ad.category ? (
                         <>
                           {CATEGORIES.find(c => c.name === ad.category)?.icon && (() => {
                              const IconType = CATEGORIES.find(c => c.name === ad.category).icon;
                              return <IconType className="w-3 h-3" />;
                           })()}
                           {ad.category}
                         </>
                      ) : 'Otros'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-50/50 border border-blue-100 px-1.5 py-0.5 rounded-lg text-[11px] font-bold text-blue-600 min-w-max">
                      <Eye className="w-3 h-3" /> {formatCount(ad.views)}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-red-50/50 border border-red-100 px-1.5 py-0.5 rounded-lg text-[11px] font-bold text-red-500 min-w-max">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      {formatCount(ad.likes)}
                    </span>
                    <span className="text-[10px] min-w-max font-bold text-gray-400 uppercase bg-transparent px-1 py-0.5 flex items-center">
                      ID: {String(ad.id).substring(0,6)}...
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0 sm:ml-2 justify-end">
                <button 
                  onClick={() => navigate(`/perfil-producto?id=${ad.id}`)}
                  className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-colors shadow-sm flex items-center gap-2" 
                  title="Ver Anuncio"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-xs font-black sm:hidden">Ver</span>
                </button>
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
                
                <button onClick={() => setInfoAd(ad)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2" title="ID de Producto">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-black sm:hidden">IDs</span>
                </button>
                
                <button onClick={() => handleDelete(ad.id)} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm flex items-center gap-2" title="Eliminar Permanentemente">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-black sm:hidden">Borrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Modal */}
      {infoAd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl w-full max-w-sm relative animate-in zoom-in-95">
            <button onClick={() => setInfoAd(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-black text-xl mb-4 text-gray-800">Detalles de IDs</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">ID de Anuncio</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded-xl text-sm border border-gray-100 font-mono text-gray-700 break-all">{infoAd.id}</code>
                  <button onClick={() => handleCopy(infoAd.id)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-colors shrink-0">
                    {copiedId === infoAd.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">ID de Vendedor</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded-xl text-sm border border-gray-100 font-mono text-gray-700 break-all">{infoAd.sellerId || infoAd.userId || 'N/A'}</code>
                  <button onClick={() => handleCopy(infoAd.sellerId || infoAd.userId || '')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-colors shrink-0">
                    {copiedId === (infoAd.sellerId || infoAd.userId) ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
