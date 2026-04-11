import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../services/firebase';

import { Users, Ban, Trash2, CheckCircle, Filter, Info, X, Phone, Mail, Globe, User, Shield, Calendar, Copy, AlertTriangle } from 'lucide-react';

const functions = getFunctions(undefined, 'us-central1');


export default function AdminUsersTab({ searchQuery = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const u = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    try {
      if (confirm(`¿Estás seguro de marcar este usuario como ${status}?`)) {
        await updateDoc(doc(db, 'users', id), { status });

        if (status === 'suspended') {
          try {
            const sendSuspendedEmail = httpsCallable(functions, 'sendAccountSuspendedEmail');
            await sendSuspendedEmail({
              email: user.email,
              userName: user.name || 'Pana',
              reason: 'Incumplimiento de las normas de la comunidad'
            });
          } catch (e) {
            console.error('Error enviando email de suspensión:', e);
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
    }
  };

  const handleDelete = async (id, userName) => {
    const confirmed = window.confirm(
      `⚠️ ELIMINAR USUARIO DEFINITIVAMENTE

Usuario: ${userName || id}

Esta acción borrará:
• Perfil de Firestore
• Todos sus anuncios
• Todas sus conversaciones

⚠️ La cuenta de acceso (email/Google) debe eliminarse manualmente desde Firebase Console.

¿Estas seguro? Esta acción NO se puede deshacer.`
    );
    if (!confirmed) return;

    const user = users.find(u => u.id === id);
    const userEmail = user?.email;

    try {
      const batch = writeBatch(db);

      // 1. Borrar anuncios del usuario
      const productsSnap = await getDocs(query(collection(db, 'products'), where('userId', '==', id)));
      productsSnap.forEach(d => batch.delete(d.ref));

      // 2. Borrar conversaciones del usuario
      const convsSnap = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', id)));
      convsSnap.forEach(d => batch.delete(d.ref));

      // 3. Borrar el perfil de usuario
      batch.delete(doc(db, 'users', id));

      await batch.commit();
      
      // Enviar email de eliminación
      try {
        const sendSuspendedEmail = httpsCallable(functions, 'sendAccountSuspendedEmail');
        await sendSuspendedEmail({
          email: userEmail || '',
          userName: userName || 'Pana',
          reason: 'Tu cuenta ha sido eliminada permanentemente por un administrador por incumplimiento de las normas.'
        });
      } catch (e) {
        console.error('Error enviando email post-eliminación:', e);
      }
      
      alert(`✅ Usuario eliminado correctamente.\n\n⚠️ Recuerda eliminar también la cuenta de autenticación desde:\nFirebase Console > Authentication > Users`);
      setSelectedUser(null);
    } catch (e) {
      console.error(e);
      alert('Error al borrar el usuario: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando usuarios...</div>;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name + ' ' + u.lastName + ' ' + u.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'suspended' ? u.status === 'suspended' : u.status !== 'suspended');
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="w-full max-w-5xl mx-auto">
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
              <button onClick={() => setSelectedUser(u)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm" title="Ver Detalles">
                <Info className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(u.id, `${u.name || ''} ${u.lastName || ''}`.trim() || u.email)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors shadow-sm" title="Eliminar Permanentemente">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        </div>

      {/* Modal de Detalles del Usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95">
            {/* Header del Modal */}
            <div className="bg-gradient-to-br from-[#FFD700] to-yellow-400 p-8 text-black relative">
              
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-lg shrink-0 overflow-hidden">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-[1.2rem]">
                      <Users className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-2xl font-bold leading-tight break-words">{selectedUser.name} {selectedUser.lastName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-bold opacity-80 font-mono bg-black/10 px-2 py-0.5 rounded-md truncate max-w-[150px]" title={selectedUser.id}>
                      ID: {selectedUser.id}
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.id);
                        alert('ID Copiado!');
                      }} 
                      className="p-1.5 bg-black/10 hover:bg-black/20 rounded-md transition-colors text-black/70 hover:text-black shrink-0"
                      title="Copiar ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-1 gap-6">
                
                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Información de Contacto</h5>
                  
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Correo Electrónico</span>
                      <span className="text-sm font-bold text-gray-700 truncate">{selectedUser.email || 'No disponible'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</span>
                      <span className="text-sm font-bold text-gray-700">{selectedUser.phone || 'No disponible'}</span>
                    </div>
                  </div>
                </div>

                {/* Detalles del Perfil */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Detalles del Perfil</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400">País</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{selectedUser.country || 'No definido'}</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Sexo</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{selectedUser.gender || 'No definido'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Rol</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700 capitalize">{selectedUser.role || 'Usuario'}</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-teal-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Estado</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg w-fit ${
                        selectedUser.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {selectedUser.status === 'suspended' ? 'Suspendido' : 'Activo'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer con Acción */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full max-w-[200px] py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
