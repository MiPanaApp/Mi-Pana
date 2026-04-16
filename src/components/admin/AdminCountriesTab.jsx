import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { useLocationStore } from '../../store/useLocationStore';
import { 
  Plus, Edit2, Trash2, Check, X, 
  MapPin, Globe, Shield, RefreshCw, Save,
  AlertTriangle, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-600 border-green-200',
  suspended: 'bg-orange-50 text-orange-600 border-orange-200',
  hidden: 'bg-gray-50 text-gray-400 border-gray-200'
};

export default function AdminCountriesTab() {
  const { countries, init } = useLocationStore();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    status: 'active', 
    flag: '', 
    config: { level1: 'Región', level2: 'Ciudad' },
    suspendedMessage: '¡Paciencia Pana! Estamos preparando todo para llegar muy pronto.',
    quote: ''
  });

  useEffect(() => {
    const unsubscribe = init();
    return () => unsubscribe();
  }, [init]);

  const handleSave = async (id) => {
    try {
      if (id) {
        await updateDoc(doc(db, 'countries', id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        // Para crear uno nuevo necesitamos un ISO
        const iso = prompt("Introduce el código ISO (ej: MX, VE):")?.toUpperCase();
        if (!iso) return;
        
        await setDoc(doc(db, 'countries', iso), {
          ...formData,
          createdAt: serverTimestamp()
        });
        setIsAdding(false);
      }
      setFormData({ name: '', status: 'active', flag: '', config: { level1: 'Región', level2: 'Ciudad' }, suspendedMessage: '', quote: '' });
    } catch (err) {
      console.error(err);
      alert("Error al guardar país");
    }
  };

  const handleDelete = async () => {
    if (!countryToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'countries', countryToDelete.id));
      setCountryToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el país');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeed = async () => {
    const INITIAL_COUNTRIES = [
      { id: 'ES', name: 'España', flag: '🇪🇸', status: 'active', config: { level1: 'Comunidad Autónoma', level2: 'Ciudad' }, quote: 'El arroz con pollo es mejor que la paella 😂🤣' },
      { id: 'US', name: 'Estados Unidos', flag: '🇺🇸', status: 'active', config: { level1: 'Estado', level2: 'Ciudad' }, quote: 'El “American Dream” está bien… pero el venezolano ya viene con survival mode activado 😂🤣' },
      { id: 'CO', name: 'Colombia', flag: '🇨🇴', status: 'active', config: { level1: 'Departamento', level2: 'Municipio' }, quote: 'La Arepa es Venezolana 😜' },
      { id: 'AR', name: 'Argentina', flag: '🇦🇷', status: 'active', config: { level1: 'Provincia', level2: 'Ciudad' }, quote: 'Argentina tiene historia en el fútbol… pero el venezolano le pone ganas hasta sin historia 💪' },
      { id: 'CL', name: 'Chile', flag: '🇨🇱', status: 'active', config: { level1: 'Región', level2: 'Comuna' }, quote: 'En Chile todo funciona… pero el venezolano hace que pase algo 🤭' },
      { id: 'PE', name: 'Perú', flag: '🇵🇪', status: 'active', config: { level1: 'Departamento', level2: 'Provincia' }, quote: 'Perú tiene historia milenaria… pero el venezolano hace historia donde llega 😉' },
      { id: 'EC', name: 'Ecuador', flag: '🇪🇨', status: 'active', config: { level1: 'Provincia', level2: 'Cantón' }, quote: 'En Ecuador tienen volcanes… pero el Roraima es otra cosa 😍' },
      { id: 'PA', name: 'Panamá', flag: '🇵🇦', status: 'active', config: { level1: 'Provincia', level2: 'Distrito' }, quote: 'En Panamá hay plata… pero el venezolano tiene más calle 😜' },
      { id: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴', status: 'active', config: { level1: 'Provincia', level2: 'Municipio' }, quote: 'El Caribe es de todos… pero el venezolano tiene el combo completo 😃' }
    ];

    if (!window.confirm("¿Seguro que quieres poblar los 9 países iniciales?")) return;

    try {
      const batch = writeBatch(db);
      
      for (const c of INITIAL_COUNTRIES) {
        const countryRef = doc(db, 'countries', c.id);
        batch.set(countryRef, {
          name: c.name,
          flag: c.flag,
          status: c.status,
          config: c.config,
          quote: c.quote,
          suspendedMessage: '¡Paciencia Pana! Estamos preparando todo para llegar muy pronto.',
          createdAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      alert("Países poblados correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al poblar países.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-800">Gestión Global</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Países y Disponibilidad</p>
        </div>
        <div className="flex gap-2">
          {countries.length === 0 && (
            <button onClick={handleSeed} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-100 transition-colors">
              Poblar Países
            </button>
          )}
          <button onClick={() => setIsAdding(true)} className="bg-[#FFD700] p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
            <Plus size={20} className="text-black" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdding && (
            <CountryForm 
              formData={formData} 
              setFormData={setFormData} 
              onSave={() => handleSave(null)} 
              onCancel={() => setIsAdding(false)} 
            />
          )}

          {countries.map((c) => (
            <div key={c.id} className={`bg-white border rounded-3xl p-4 md:p-5 transition-all ${c.status === 'hidden' ? 'opacity-50' : ''} shadow-sm hover:shadow-md border-gray-100 flex flex-col justify-between`}>
              {editingId === c.id ? (
                <CountryForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSave={() => handleSave(c.id)} 
                  onCancel={() => setEditingId(null)} 
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{c.flag}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-gray-800 text-sm md:text-base truncate">
                            {c.name}
                          </h4>
                          <div className={`px-1.5 py-0.5 border rounded-md text-[8px] font-black uppercase shrink-0 ${STATUS_COLORS[c.status]}`}>
                            {c.status}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5.">CÓDIGO: {c.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => { setEditingId(c.id); setFormData(c); }} 
                        className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-blue-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setCountryToDelete(c)} 
                        className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                        title="Eliminar país"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase text-gray-400">Nivel 1</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{c.config?.level1}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-gray-200 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase text-gray-400">Nivel 2</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{c.config?.level2}</p>
                    </div>
                  </div>

                  {c.status === 'suspended' && (
                    <div className="flex items-start gap-2 p-2.5 bg-orange-50 rounded-xl text-[10px] font-bold text-orange-600 border border-orange-100/50">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <p className="line-clamp-2 leading-snug">{c.suspendedMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      <AnimatePresence>
        {countryToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCountryToDelete(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-red-50 px-6 pt-8 pb-6 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">¿Eliminar país?</h3>
                  <p className="text-sm font-bold text-gray-500 mt-1">
                    Estás a punto de eliminar <span className="text-gray-800">{countryToDelete.flag} {countryToDelete.name}</span> permanentemente de la plataforma.
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="px-6 py-4 bg-amber-50 border-y border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 leading-snug">
                  Esta acción es irreversible. El país desaparecerá de los selectores de la app en tiempo real.
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <span className="animate-pulse">Eliminando...</span>
                  ) : (
                    <><Trash2 size={16} /> Sí, eliminar {countryToDelete.name}</>
                  )}
                </button>
                <button
                  onClick={() => setCountryToDelete(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountryForm({ formData, setFormData, onSave, onCancel }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'hidden', label: 'Oculto' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-yellow-600 uppercase">Configuración</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Frase de Bienvenida (Quote)</label>
        <input 
          type="text" 
          value={formData.quote}
          onChange={(e) => setFormData({...formData, quote: e.target.value})}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
          placeholder="Ej: La Arepa es Venezolana 😜"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Nombre del País</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
            placeholder="Ej: Venezuela"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Emoji/Flag</label>
          <input 
            type="text" 
            value={formData.flag}
            onChange={(e) => setFormData({...formData, flag: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
            placeholder="🇻🇪"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Estado</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none flex items-center justify-between text-left"
            >
              <span className="truncate">{statusOptions.find(o => o.value === formData.status)?.label || 'Seleccionar'}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFormData({ ...formData, status: option.value });
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-50 flex items-center justify-between ${
                          formData.status === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                        {formData.status === option.value && <Check size={14} className="text-blue-600" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Etiqueta N1</label>
          <input 
            type="text" 
            value={formData.config?.level1}
            onChange={(e) => setFormData({...formData, config: { ...formData.config, level1: e.target.value }})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
            placeholder="Provincia"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Etiqueta N2</label>
          <input 
            type="text" 
            value={formData.config?.level2}
            onChange={(e) => setFormData({...formData, config: { ...formData.config, level2: e.target.value }})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none"
            placeholder="Municipio"
          />
        </div>
      </div>

      {formData.status === 'suspended' && (
        <div>
          <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Mensaje de Suspensión</label>
          <textarea 
            value={formData.suspendedMessage}
            onChange={(e) => setFormData({...formData, suspendedMessage: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-16 resize-none"
            placeholder="Frase satírica..."
          />
        </div>
      )}

      <button onClick={onSave} className="w-full bg-black text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
        <Save size={14} /> Guardar Cambios
      </button>
    </div>
  );
}
