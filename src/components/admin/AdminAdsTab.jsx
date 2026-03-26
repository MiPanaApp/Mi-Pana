import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ShoppingBag, Ban, Trash2, CheckCircle, EyeOff, Filter } from 'lucide-react';

export default function AdminAdsTab({ searchQuery = '' }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

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
      let actionName = status === 'active' ? 'Reactivar' : status === 'hidden' ? 'Ocultar' : 'Suspender';
      if (confirm(`¿Estás seguro de ${actionName} este anuncio?`)) {
        await updateDoc(doc(db, 'products', id), { status }); // active, suspended, hidden
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado del anuncio.');
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

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando anuncios...</div>;

  const filteredAds = ads.filter((ad) => {
    const matchesSearch = (ad.name + ' ' + ad.userName + ' ' + (ad.category || '')).toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const actualStatus = ad.status || 'active';
      matchesStatus = actualStatus === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-full mb-6 border border-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="font-black text-2xl text-gray-800">Anuncios en Firebase</h3>
          <p className="text-sm font-bold text-gray-400 mt-1">Gestión en tiempo real ({filteredAds.length})</p>
        </div>
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex-shrink-0 whitespace-nowrap overflow-x-auto w-full md:w-auto hide-scrollbar">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Todos</button>
          <button 
            onClick={() => setStatusFilter('active')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Activos</button>
          <button 
            onClick={() => setStatusFilter('hidden')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'hidden' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Ocultos</button>
          <button 
            onClick={() => setStatusFilter('suspended')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'suspended' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Suspendidos</button>
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        {filteredAds.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-bold">No se encontraron anuncios.</div>
        )}
        {filteredAds.map(ad => (
          <div key={ad.id} className="flex flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 gap-2 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="w-12 h-12 bg-blue-100/50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-blue-100">
                {ad.image ? <img src={ad.image} alt={ad.name} className="w-full h-full object-cover"/> : <ShoppingBag className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-gray-800 line-clamp-1">{ad.name}</span>
                <span className="text-[11px] text-gray-500 font-bold line-clamp-1 mt-0.5">€ {ad.price} • {ad.userName}</span>
                <div className="flex gap-1.5 mt-1 overflow-x-auto hide-scrollbar">
                  <span className={`text-[9px] min-w-max font-black uppercase px-1.5 py-0.5 rounded-md ${
                    ad.status === 'suspended' ? 'bg-red-100 text-red-600' :
                    ad.status === 'hidden' ? 'bg-gray-200 text-gray-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {ad.status === 'suspended' ? 'Suspendido' : ad.status === 'hidden' ? 'Oculto' : 'Activo'}
                  </span>
                  <span className="text-[9px] min-w-max font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {ad.category || 'Otros'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-1">
              {ad.status === 'suspended' || ad.status === 'hidden' ? (
                <button onClick={() => handleUpdateStatus(ad.id, 'active')} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors shadow-sm" title="Reactivar">
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={() => handleUpdateStatus(ad.id, 'hidden')} className="p-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors shadow-sm" title="Ocultar Anuncio">
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleUpdateStatus(ad.id, 'suspended')} className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors shadow-sm" title="Suspender Anuncio">
                    <Ban className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={() => handleDelete(ad.id)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm" title="Eliminar Permanentemente">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
