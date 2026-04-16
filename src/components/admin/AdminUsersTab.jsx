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
    const user = users.find(u => u.id === id);
    const resolvedName = user ? (user.name || user.displayName || 'Pana') : 'Pana';

    const confirmed = window.confirm(
      `⚠️ ELIMINAR USUARIO DEFINITIVAMENTE

Usuario: ${resolvedName} (${user?.email || id})

Esta acción borrará:
• Cuenta de inicio de sesión (Authentication)
• Perfil de Firestore
• Todos sus anuncios
• Todas sus conversaciones

¿Estás seguro? Esta acción NO se puede deshacer.`
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

      // 3. Borrar el perfil de usuario de Firestore
      batch.delete(doc(db, 'users', id));

      await batch.commit();
      
      // 4. Borrar de Firebase Authentication (usando Cloud Function nueva)
      try {
        const deleteAuthUser = httpsCallable(functions, 'deleteUserByAdmin');
        await deleteAuthUser({ uid: id });
        console.log("Usuario eliminado de Firebase Auth");
      } catch (authErr) {
        console.error("Error al borrar en Auth (puede que ya no existiera):", authErr);
      }
      
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
      
      alert(`✅ Usuario y todos sus datos eliminados correctamente tanto de la Base de Datos como de Authentication.`);
      setSelectedUser(null);
    } catch (e) {
      console.error(e);
      alert('Error al borrar el usuario: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando usuarios...</div>;

  const filteredUsers = users.filter((u) => {
    const searchStr = (u.name + ' ' + u.lastName + ' ' + u.displayName + ' ' + u.email).toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
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
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm text-gray-800 line-clamp-1">
                  {u.name || u.displayName || 'Sin nombre'} {u.lastName || ''}
                </span>
                <span className="text-[11px] text-gray-500 font-medium line-clamp-1">{u.email}</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${u.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {u.status === 'suspended' ? 'Suspendido' : 'Activo'}
                  </span>
                  
                  {(() => {
                    const provider = u.provider || (u.photoURL?.includes('googleusercontent') ? 'google' : 'email');
                    
                    if (provider === 'google') return (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                      </span>
                    );
                    
                    if (provider === 'facebook') return (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                        Facebook
                      </span>
                    );
                    
                    return (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                        Email
                      </span>
                    );
                  })()}
                </div>
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
                  {(selectedUser.avatar || selectedUser.photoURL) ? (
                    <img 
                      src={selectedUser.avatar || selectedUser.photoURL} 
                      alt={selectedUser.name || selectedUser.displayName} 
                      className="w-full h-full object-cover rounded-[1.2rem]" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-[1.2rem]">
                      <Users className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-2xl font-bold leading-tight break-words">
                    {selectedUser.name || selectedUser.displayName || 'Sin nombre'} {selectedUser.lastName || ''}
                  </h4>
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
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase text-gray-400">Método de acceso</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700 capitalize">
                        {selectedUser.provider || (selectedUser.photoURL?.includes('googleusercontent') ? 'Google' : 'Email')}
                      </span>
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
