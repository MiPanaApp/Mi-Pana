import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../../services/firebase';
import { collection, query, orderBy, limit, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Bell, Send, Loader2, ChevronDown, Check, Users, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COUNTRIES = {
  all: { name: 'Todos los países', flag: '🌍' },
  España: { name: 'España', flag: '🇪🇸' },
  USA: { name: 'Estados Unidos', flag: '🇺🇸' },
  Colombia: { name: 'Colombia', flag: '🇨🇴' },
  Chile: { name: 'Chile', flag: '🇨🇱' }
};

export default function AdminNotificationsTab() {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifUrl, setNotifUrl] = useState('/home');
  const [notifCountry, setNotifCountry] = useState('all');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifHistory, setNotifHistory] = useState([]);
  const [showRecipients, setShowRecipients] = useState(null);

  const loadHistory = async () => {
    try {
      const q = query(
        collection(db, 'adminNotifications'),
        orderBy('sentAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifHistory(data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const sendNotification = async () => {
    if (!notifTitle || !notifBody) return;
    setSending(true);
    try {
      const functions = getFunctions();
      const sendFn = httpsCallable(functions, 'sendAdminNotification');
      const result = await sendFn({
        title: notifTitle,
        body: notifBody,
        actionUrl: notifUrl,
        targetCountry: notifCountry === 'all' ? null : notifCountry
      });
      alert(`Notificación enviada a ${result.data.sent} dispositivos`);
      setNotifTitle('');
      setNotifBody('');
      loadHistory();
    } catch (e) {
      alert('Error al enviar la notificación');
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('¿Seguro que quieres borrar todo el historial?')) return;
    try {
      const q = query(collection(db, 'adminNotifications'));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setNotifHistory([]);
      alert('Historial borrado');
    } catch (e) {
      alert('Error al borrar el historial');
    }
  };

  return (
    <div className="bg-white px-3 py-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col xl:flex-row gap-6 min-h-[500px]">
      {/* Formulario de Envío */}
      <div className="flex-1 flex flex-col px-1 md:px-0">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#FFD700]" /> Notificaciones Push
          </h2>
          <p className="text-gray-400 font-bold text-sm mt-1">Crea y envía notificaciones en tiempo real</p>
        </div>

        <div className="space-y-5 flex-1">
          {/* Título y País Compactados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Título</label>
                <span className="text-[10px] font-black text-gray-400">{notifTitle.length}/65</span>
              </div>
              <input
                type="text"
                maxLength={65}
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Ej: ¡Nueva Promo!"
                className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3.5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50 placeholder:font-medium placeholder:text-gray-400 transition-shadow"
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                 <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">País Destino</label>
              </div>
              <div 
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className="w-full bg-[#F4F7FE] px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-[#FFD700]/50 transition-shadow hover:bg-[#EEF2FC]"
               >
                 <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                   <span className="text-lg leading-none">{COUNTRIES[notifCountry]?.flag}</span>
                   {COUNTRIES[notifCountry]?.name}
                 </span>
                 <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isCountryOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCountryOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1.5">
                    {Object.entries(COUNTRIES).map(([key, data]) => (
                      <button
                        key={key}
                        onClick={() => { setNotifCountry(key); setIsCountryOpen(false); }}
                        className={`w-full px-4 py-3 text-left text-sm font-bold rounded-xl transition-colors flex items-center justify-between ${notifCountry === key ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                      >
                        <span className="flex items-center gap-2">
                           <span className="text-lg leading-none">{data.flag}</span> 
                           {data.name}
                        </span>
                        {notifCountry === key && <Check className="w-4 h-4 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative">
             <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Cuerpo del mensaje</label>
                <span className="text-[10px] font-black text-gray-400">{notifBody.length}/178</span>
              </div>
            <textarea
              rows="3"
              maxLength={178}
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              placeholder="Ej: Entra ahora y descubre los mejores descuentos en productos seleccionados..."
              className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3.5 rounded-2xl text-sm font-bold outline-none resize-none focus:ring-2 focus:ring-[#FFD700]/50 placeholder:font-medium placeholder:text-gray-400 transition-shadow"
            />
          </div>
          
          <div className="relative">
            <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Acción al tocar (URL)</label>
            </div>
            <input
              type="text"
              value={notifUrl}
              onChange={(e) => setNotifUrl(e.target.value)}
              placeholder="/home"
              className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3.5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50 placeholder:font-medium placeholder:text-gray-400 transition-shadow"
            />
          </div>

        </div>

        <button
          onClick={sendNotification}
          disabled={!notifTitle || !notifBody || sending}
          className="w-full bg-[#FFD700] text-black font-black p-4 rounded-2xl shadow-[0_10px_20px_rgba(255,215,0,0.2)] hover:bg-[#FFE033] active:scale-95 transition-all flex justify-center items-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Enviar Notificación <Send className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>

      {/* Historial Compactado */}
      <div className="flex-1 bg-[#F4F7FE] px-3 py-6 lg:p-8 rounded-[2rem] border border-gray-100 flex flex-col h-[550px] xl:h-auto overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F4F7FE] to-transparent pointer-events-none z-10 opacity-50"></div>
        
        <h3 className="text-base font-black text-gray-800 mb-4 flex items-center justify-between relative z-20">
          <div className="flex flex-col">
            <span>Historial de Envíos</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase">Recientes (Scroll 👇)</span>
          </div>
          <button 
            onClick={clearHistory}
            className="text-[9px] uppercase font-black tracking-wider bg-white text-red-500 px-3 py-1.5 rounded-xl shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
          >
            Borrar todo
          </button>
        </h3>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 relative z-20 pb-4 pr-1 max-h-[380px] md:max-h-none">
          {notifHistory.map((n) => (
            <div key={n.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-50 hover:border-gray-100">
              <div className="flex justify-between items-start mb-1 gap-2">
                <span className="font-black text-sm text-gray-800 line-clamp-1">{n.title}</span>
                <span 
                  onClick={() => n.recipients && setShowRecipients(n)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1.5 border transition-all ${n.recipients ? 'bg-blue-100 text-blue-700 border-blue-200 cursor-pointer hover:scale-105 active:scale-95' : 'bg-blue-50 text-blue-600 border-blue-100 opacity-60'}`}
                >
                  <Send className="w-3 h-3" /> {n.sentTo}
                </span>
              </div>
              <p className="text-[12px] font-medium text-gray-500 line-clamp-2 mb-3 leading-relaxed">{n.body}</p>
              <div className="flex justify-between items-center text-[10px] uppercase font-black border-t border-gray-50 pt-3 text-gray-400">
                <span className="flex items-center gap-1.5 truncate max-w-[60%]">
                  <span className="text-sm leading-none">{n.targetCountry === 'all' ? '🌍' : COUNTRIES[n.targetCountry]?.flag}</span>
                  {n.targetCountry === 'all' ? 'Todos Los Países' : COUNTRIES[n.targetCountry]?.name || n.targetCountry}
                </span>
                <span className="shrink-0 bg-gray-50 px-2 py-1 rounded-lg">
                  {n.sentAt?.toDate ? new Date(n.sentAt.toDate()).toLocaleDateString() + ' ' + new Date(n.sentAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </span>
              </div>
            </div>
          ))}
          {notifHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8 opacity-60">
               <Bell className="w-10 h-10 mb-3 text-gray-300" />
               <p className="font-black text-sm uppercase tracking-wide">No hay envíos recientes</p>
               <p className="text-xs font-medium mt-1">Los envíos aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>
      {/* Modal de Receptores */}
      <AnimatePresence>
        {showRecipients && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRecipients(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-[#FFD700] p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-lg text-black">Pana Receptores</h4>
                  <p className="text-black/60 text-[10px] uppercase font-black tracking-widest">{showRecipients.title}</p>
                </div>
                <button 
                  onClick={() => setShowRecipients(null)}
                  className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                {showRecipients.recipients?.map((user, i) => (
                  <div key={user.uid || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{user.name}</p>
                      <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </p>
                    </div>
                  </div>
                ))}
                {(!showRecipients.recipients || showRecipients.recipients.length === 0) && (
                  <div className="text-center p-8 text-gray-400 italic text-sm">
                    No se guardó el detalle de receptores para esta notificación.
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button 
                  onClick={() => setShowRecipients(null)}
                  className="px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
