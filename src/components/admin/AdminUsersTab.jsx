import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Users, Ban, Trash2, CheckCircle, Filter } from 'lucide-react';

export default function AdminUsersTab({ searchQuery = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const u = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      if (confirm(`¿Estás seguro de marcar este usuario como ${status}?`)) {
        await updateDoc(doc(db, 'users', id), { status });
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (confirm('¿Estás seguro de ELIMINAR permanentemente este usuario? Esta acción no se puede deshacer.')) {
        await deleteDoc(doc(db, 'users', id));
      }
    } catch (e) {
      console.error(e);
      alert('Error al borrar el usuario.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando usuarios...</div>;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'suspended' ? u.status === 'suspended' : u.status !== 'suspended');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-full mb-6 border border-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="font-black text-2xl text-gray-800">Usuarios Registrados</h3>
          <p className="text-sm font-bold text-gray-400 mt-1">Sincronizado en tiempo real ({filteredUsers.length})</p>
        </div>
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex-shrink-0">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Todos</button>
          <button 
            onClick={() => setStatusFilter('active')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Activos</button>
          <button 
            onClick={() => setStatusFilter('suspended')} 
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'suspended' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >Suspendidos</button>
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-400 font-bold">No se encontraron usuarios.</div>
        )}
        {filteredUsers.map(u => (
          <div key={u.id} className="flex flex-row items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 gap-2 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <div className="w-10 h-10 bg-blue-100/50 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-blue-100">
                {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover"/> : <Users className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-gray-800 line-clamp-1">{u.name} {u.lastName}</span>
                <span className="text-[11px] text-gray-500 font-medium line-clamp-1">{u.email}</span>
                <span className={`text-[9px] font-black uppercase mt-0.5 w-fit px-1.5 py-0.5 rounded-md ${u.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {u.status === 'suspended' ? 'Suspendido' : 'Activo'}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-2">
              {u.status === 'suspended' ? (
                <button onClick={() => handleUpdateStatus(u.id, 'active')} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors shadow-sm" title="Reactivar">
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => handleUpdateStatus(u.id, 'suspended')} className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors shadow-sm" title="Suspender">
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm" title="Eliminar Permanentemente">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
