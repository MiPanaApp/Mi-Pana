import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useLocationStore } from '../../store/useLocationStore';
import { 
  Plus, Edit2, Trash2, Check, X, 
  MapPin, Globe, Shield, RefreshCw, Save,
  AlertTriangle, Eye, EyeOff
} from 'lucide-react';

const STATUS_COLORS = {
  active: 'bg-green-50 text-green-600 border-green-200',
  suspended: 'bg-orange-50 text-orange-600 border-orange-200',
  hidden: 'bg-gray-50 text-gray-400 border-gray-200'
};

export default function AdminCountriesTab() {
  const { countries, init } = useLocationStore();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
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
      for (const c of INITIAL_COUNTRIES) {
        await setDoc(doc(db, 'countries', c.id), {
          name: c.name,
          flag: c.flag,
          status: c.status,
          config: c.config,
          quote: c.quote,
          suspendedMessage: '¡Paciencia Pana! Estamos preparando todo para llegar muy pronto.',
          createdAt: serverTimestamp()
        });
      }
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
            <div key={c.id} className={`bg-white border rounded-[2rem] p-6 transition-all ${c.status === 'hidden' ? 'opacity-50' : ''} shadow-sm hover:shadow-md border-gray-100`}>
              {editingId === c.id ? (
                <CountryForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSave={() => handleSave(c.id)} 
                  onCancel={() => setEditingId(null)} 
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.flag}</span>
                      <div>
                        <h4 className="font-black text-gray-800 flex items-center gap-2">
                          {c.name} <span className="text-[10px] text-gray-400">({c.id})</span>
                        </h4>
                        <div className={`mt-1 px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase inline-block ${STATUS_COLORS[c.status]}`}>
                          {c.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(c.id); setFormData(c); }} className="p-2 hover:bg-gray-50 rounded-xl text-blue-500 transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Nivel 1:</span>
                      <span className="text-gray-600">{c.config?.level1}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Nivel 2:</span>
                      <span className="text-gray-600">{c.config?.level2}</span>
                    </div>
                  </div>

                  {c.status === 'suspended' && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-2xl text-[10px] font-bold text-orange-600">
                      <AlertTriangle size={14} className="shrink-0" />
                      <p className="line-clamp-2">{c.suspendedMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountryForm({ formData, setFormData, onSave, onCancel }) {
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
          <select 
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
          >
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="hidden">Oculto</option>
          </select>
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
