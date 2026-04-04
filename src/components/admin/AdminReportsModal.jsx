import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Mail, CheckCircle, AlertTriangle, User, Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function AdminReportsModal({ isOpen, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (reportId, e) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved'
      });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (error) {
      console.error("Error resolviendo reporte:", error);
    }
  };

  const deleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Estás seguro de eliminar este informe permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error("Error eliminando informe:", error);
    }
  };

  const deleteAllReports = async () => {
    if (reports.length === 0) return;
    if (!window.confirm("🚨 PELIGRO: ¿Estás completamente seguro de borrar TODOS los informes de seguridad? Esta acción es irreversible.")) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      reports.forEach(r => {
        batch.delete(doc(db, 'reports', r.id));
      });
      await batch.commit();
      setReports([]);
    } catch (error) {
      console.error("Error eliminando todos los informes:", error);
    } finally {
      setLoading(false);
      setExpandedId(null);
    }
  };

  const filteredReports = reports.filter(r => 
    (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.reporterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.productId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="bg-[#F4F7FE] w-full max-w-4xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          {/* Header */}
          <div className="bg-black text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden gap-4 shrink-0">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#FFD700] rounded-full blur-3xl opacity-20"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Auditoría de Seguridad</h2>
                <p className="text-sm text-gray-400 font-medium">{reports.length} Informes Registrados</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
              <button 
                onClick={deleteAllReports}
                disabled={reports.length === 0 || loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors font-bold text-sm disabled:opacity-50 flex-1 sm:flex-auto justify-center"
              >
                <Trash2 className="w-4 h-4" /> Borrar Todos
              </button>
              <button 
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toolbar (Buscador) */}
          <div className="bg-white border-b border-gray-100 p-4 px-6 relative z-0 flex items-center gap-3 shrink-0">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 flex items-center focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por anuncio, usuario o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-700"
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F4F7FE]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-10 h-10 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold">Cargando base de datos...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-20">
                <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-800">Nada por aquí</h3>
                <p className="text-gray-500 font-medium">No se encontraron informes con esos términos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredReports.map((report) => {
                  const isExpanded = expandedId === report.id;
                  
                  return (
                    <div 
                      key={report.id} 
                      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm ${isExpanded ? 'border-gray-200 shadow-md ring-4 ring-gray-50' : 'border-transparent hover:border-gray-200'} ${report.status === 'resolved' ? 'opacity-70' : ''}`}
                    >
                      {/* Compact Row */}
                      <div 
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4 transition-colors ${isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <AlertTriangle className={`w-5 h-5 shrink-0 ${report.status === 'resolved' ? 'text-green-500' : 'text-red-500'}`} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-black text-gray-800 text-sm truncate">{report.productName}</span>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                              <span className="truncate">Reporta: {report.reporterName}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"/>
                              <span className="whitespace-nowrap">{report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString('es-ES') : new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          {report.status === 'resolved' && (
                            <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle className="w-3 h-3"/> Resuelto
                            </span>
                          )}
                          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                             {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100 bg-white"
                          >
                            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Motivos */}
                              <div className="bg-red-50/40 p-5 rounded-2xl border border-red-50">
                                <p className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-3">Motivos de la Denuncia</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {(report.reasons || []).map((reason, idx) => (
                                    <span key={idx} className="bg-white border border-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t border-red-100/50">
                                  {report.status !== 'resolved' && (
                                    <button 
                                      onClick={(e) => markAsResolved(report.id, e)}
                                      className="flex-1 bg-black text-white py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                                    >
                                      ✓ Marcar Resuelto
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => deleteReport(report.id, e)}
                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                  </button>
                                </div>
                              </div>

                              {/* Info Involucrados */}
                              <div className="space-y-3">
                                {/* Reportador */}
                                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Denunciante</p>
                                    <p className="font-bold text-gray-800 text-sm truncate">{report.reporterName || 'Usuario'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500 truncate">{report.reporterEmail || 'N/A'}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1 truncate" title={report.reporterId}>ID: {report.reporterId}</p>
                                  </div>
                                </div>

                                {/* Reportado */}
                                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-0.5">Vendedor (Anuncio)</p>
                                    <p className="font-bold text-gray-800 text-sm truncate">{report.sellerName || 'Desconocido'}</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1 break-all" title={report.productId}>Anuncio: {report.productId}</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate" title={report.sellerId}>Propietario: {report.sellerId}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
