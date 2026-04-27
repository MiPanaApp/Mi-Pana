import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../../services/firebase';

export default function AdminVerificationsTab() {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending | approved | rejected
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'verifications'),
        where('status', '==', filter),
        orderBy('submittedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const data = await Promise.all(
        snap.docs.map(async (d) => {
          const userData = await getDoc(doc(db, 'users', d.id));
          return {
            id: d.id,
            ...d.data(),
            user: userData.data()
          };
        })
      );
      setVerifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [filter]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha desconocida';
    return timestamp.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleApprove = async (verificationId) => {
    setProcessing(true);
    try {
      if (!auth.currentUser) throw new Error("No admin user found");
      
      // Actualizar verificación
      await updateDoc(doc(db, 'verifications', verificationId), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser.uid
      });

      // Eliminar fotos por privacidad y costos
      try {
        const storage = getStorage();
        await deleteObject(ref(storage, `verifications/${verificationId}/document_front.jpg`));
        await deleteObject(ref(storage, `verifications/${verificationId}/selfie.jpg`));
        await updateDoc(doc(db, 'verifications', verificationId), {
          photosDeleted: true,
          photosDeletedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Error al borrar fotos tras aprobar:", err);
      }
      
      // Dar badge al usuario
      await updateDoc(doc(db, 'users', verificationId), {
        verified: true,
        verificationStatus: 'approved',
        verifiedAt: serverTimestamp()
      });

      // Enviar email de aprobación
      const functions = getFunctions(undefined, 'us-central1');
      const sendEmail = httpsCallable(functions, 'sendVerificationResultEmail');
      await sendEmail({
        userId: verificationId,
        approved: true
      }).catch((e) => console.error("Error al enviar email:", e));

      await loadVerifications();
      setSelected(null);
    } catch (error) {
      console.error(error);
      alert('Error al aprobar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (verificationId) => {
    if (!rejectionReason.trim()) {
      alert('Debes indicar el motivo del rechazo.');
      return;
    }
    setProcessing(true);
    try {
      if (!auth.currentUser) throw new Error("No admin user found");

      await updateDoc(doc(db, 'verifications', verificationId), {
        status: 'rejected',
        rejectionReason,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser.uid
      });

      // Eliminar fotos por privacidad y costos
      try {
        const storage = getStorage();
        await deleteObject(ref(storage, `verifications/${verificationId}/document_front.jpg`));
        await deleteObject(ref(storage, `verifications/${verificationId}/selfie.jpg`));
        await updateDoc(doc(db, 'verifications', verificationId), {
          photosDeleted: true,
          photosDeletedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Error al borrar fotos tras rechazar:", err);
      }

      await updateDoc(doc(db, 'users', verificationId), {
        verified: false,
        verificationStatus: 'rejected'
      });

      const functions = getFunctions(undefined, 'us-central1');
      const sendEmail = httpsCallable(functions, 'sendVerificationResultEmail');
      await sendEmail({
        userId: verificationId,
        approved: false,
        reason: rejectionReason
      }).catch((e) => console.error("Error al enviar email:", e));

      await loadVerifications();
      setSelected(null);
      setRejectionReason('');
    } catch (error) {
      console.error(error);
      alert('Error al rechazar: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-10">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] mb-6 border border-gray-50">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="font-black text-2xl text-[#1A1A3A]">Verificaciones de Identidad</h3>
            <p className="text-sm font-bold text-gray-400 mt-1">Revisión de cuentas "Pana Verificado"</p>
          </div>
          
          {/* Filtros */}
          <div className="w-full md:w-auto bg-gray-100 p-1 rounded-2xl flex items-center shadow-inner">
            <div className="grid grid-cols-3 gap-1 w-full md:flex md:w-auto">
              <button 
                onClick={() => setFilter('pending')} 
                className={`px-3 py-2.5 text-[10px] md:text-xs font-black rounded-xl transition-all ${filter === 'pending' ? 'bg-white text-[#B48A05] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Pendientes
              </button>
              <button 
                onClick={() => setFilter('approved')} 
                className={`px-3 py-2.5 text-[10px] md:text-xs font-black rounded-xl transition-all ${filter === 'approved' ? 'bg-white text-[#00C97A] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Aprobados
              </button>
              <button 
                onClick={() => setFilter('rejected')} 
                className={`px-3 py-2.5 text-[10px] md:text-xs font-black rounded-xl transition-all ${filter === 'rejected' ? 'bg-white text-[#D90429] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Rechazados
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center font-bold text-gray-400 py-10">Cargando solicitudes...</p>
          ) : verifications.length === 0 ? (
            <p className="text-center font-bold text-gray-400 py-10">No hay solicitudes en esta categoría.</p>
          ) : (
            verifications.map((v) => (
              <div 
                key={v.id} 
                className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm flex items-start sm:items-center gap-4 cursor-pointer hover:border-[#FFD700]/30 transition-all active:scale-[0.98]"
                onClick={() => setSelected(v)}
              >
                {/* Avatar Section */}
                <div className="relative shrink-0">
                  <img 
                    src={v.selfieUrl} 
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-gray-100" 
                    alt="Selfie" 
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    v.status === 'pending' ? 'bg-[#FFB400]' : 
                    v.status === 'approved' ? 'bg-[#00C97A]' : 'bg-[#D90429]'
                  }`} />
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <p className="font-black text-[#1A1A3A] text-sm truncate pr-4">
                      {v.user?.name || 'Usuario desconocido'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                      <span className="text-[10px] font-black text-[#1A1A3A]/40 uppercase tracking-tight bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {v.documentType?.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        Nivel Real: {v.livenessScore}%
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-gray-300 mt-1 uppercase">
                      {formatDate(v.submittedAt)}
                    </p>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border self-start sm:self-center shrink-0 tracking-wider ${
                    v.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    v.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {v.status === 'pending' ? 'Pendiente' : v.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* MODAL DE REVISIÓN */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            
            {/* Header del Modal */}
            <div className="bg-[#1A1A3A] p-6 text-white flex justify-between items-center shrink-0">
              <h4 className="text-xl font-black flex items-center gap-2">
                Revisión de identidad <span className="bg-white/10 px-2 py-0.5 rounded text-sm text-[#FFB400]">{selected.documentType?.toUpperCase()}</span>
              </h4>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><span className="text-xl font-black">×</span></button>
            </div>

            {/* Content layout grid */}
            <div className="flex flex-col lg:flex-row overflow-y-auto">
              
              {/* Fotos */}
              <div className="lg:w-2/3 p-6 bg-[#F8F9FB] flex flex-col gap-6">
                <div>
                  <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Documento Frontal</h5>
                  <div className="w-full h-64 bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group relative cursor-pointer" onClick={() => window.open(selected.documentFrontUrl, '_blank')}>
                    <img src={selected.documentFrontUrl} className="w-full h-full object-contain" alt="Documento" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold">Ver original</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Selfie (Liveness)</h5>
                  <div className="w-full max-w-sm mx-auto h-64 bg-black rounded-2xl overflow-hidden shadow-inner relative flex items-center justify-center group cursor-pointer" onClick={() => window.open(selected.selfieUrl, '_blank')}>
                    <img src={selected.selfieUrl} className="w-full h-full object-cover object-top scale-x-[-1]" alt="Selfie" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center scale-x-[-1]">
                      <span className="text-white font-bold">Ver original</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel de datos y acciones */}
              <div className="lg:w-1/3 p-6 bg-white border-l border-gray-100 flex flex-col space-y-6 shrink-0">
                
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Usuario</p>
                    <p className="text-lg font-black text-[#1A1A3A]">{selected.user?.name || 'N/A'}</p>
                    <p className="text-sm font-bold text-gray-500">{selected.user?.email}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nivel de Realidad</p>
                    <p className={`text-xl font-black ${selected.livenessScore >= 70 ? 'text-[#00C97A]' : 'text-[#FFB400]'}`}>
                      {selected.livenessScore}/100
                    </p>
                  </div>

                  <div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fecha de solicitud</p>
                     <p className="text-sm font-bold text-[#1A1A3A]">{formatDate(selected.submittedAt)}</p>
                  </div>

                  {selected.status === 'rejected' && (
                    <div className="bg-[#FFF0F0] border-l-4 border-[#D90429] p-3 rounded-r-xl">
                      <p className="text-[10px] font-black uppercase text-[#D90429] mb-1">Motivo del rechazo anterior</p>
                      <p className="text-xs font-bold text-[#D90429]">{selected.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {selected.status === 'pending' && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <button 
                      onClick={() => handleApprove(selected.id)}
                      disabled={processing}
                      className="w-full bg-[#00C97A] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#00C97A]/20 hover:-translate-y-0.5 active:scale-95 transition-all text-sm disabled:opacity-50"
                    >
                      {processing ? 'Procesando...' : '✅ Aprobar verificación'}
                    </button>

                    <div className="space-y-2">
                       <input 
                         type="text" 
                         value={rejectionReason}
                         onChange={(e) => setRejectionReason(e.target.value)}
                         placeholder="Motivo del rechazo..."
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#D90429]"
                       />
                       <button 
                         onClick={() => handleReject(selected.id)}
                         disabled={processing}
                         className="w-full bg-[#D90429]/10 text-[#D90429] font-black py-4 rounded-2xl active:scale-95 transition-transform text-sm disabled:opacity-50"
                       >
                         ❌ Rechazar verificación
                       </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
