import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { CalendarClock, Plus, Pencil, Trash2, Clock, Users, ArrowLeft, Send, ExternalLink, ChevronDown } from 'lucide-react';

const PRELOAD_TEMPLATES = [
  {
    name: "Anuncio sin visitas (7 días)",
    title: "Tu anuncio necesita atención 👀",
    body: "{{productName}} lleva 7 días sin visitas. ¡Actualízalo para aparecer primero!",
    trigger: "product_inactive",
    delayHours: 168,
    targetSegment: "sellers",
    targetCountry: "all",
    active: false,
    actionUrl: ''
  },
  {
    name: "Recordatorio valoración (1 hora)",
    title: "¿Qué tal el pana? 🌟",
    body: "¿Cómo te fue con {{productName}}? ¡Tu opinión ayuda a la comunidad!",
    trigger: "product_inactive",
    delayHours: 1,
    targetSegment: "buyers",
    targetCountry: "all",
    active: false,
    actionUrl: ''
  },
  {
    name: "Usuario inactivo (14 días)",
    title: "¡Te echamos de menos, {{userName}}! 🤝",
    body: "Han llegado nuevos panas a Mi Pana. ¡Entra y descubre lo que ofrecen!",
    trigger: "user_inactive",
    delayHours: 336,
    targetSegment: "all",
    targetCountry: "all",
    active: false,
    actionUrl: ''
  },
  {
    name: "Perfil incompleto (2 horas)",
    title: "Falta poco, pana 👋",
    body: "Completa tu perfil para que otros panas puedan encontrarte fácilmente.",
    trigger: "incomplete_profile",
    delayHours: 2,
    targetSegment: "all",
    targetCountry: "all",
    active: false,
    actionUrl: ''
  }
];

const TRIGGERS = {
  new_user: "Nuevo usuario registrado",
  product_inactive: "Anuncio sin actividad",
  product_expiring: "Anuncio próximo a expirar",
  user_inactive: "Usuario inactivo",
  incomplete_profile: "Perfil incompleto"
};

const CustomSelect = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wide ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-[#F4F7FE] border-2 transition-all duration-200 px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-between outline-none ${
            isOpen ? 'border-[#FFD700] bg-white shadow-lg' : 'border-transparent text-gray-700 hover:bg-[#EEF2FD]'
          }`}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-4 h-4 ${isOpen ? 'text-[#FFD700]' : 'text-gray-400'}`} />}
            <span>{selectedOption.label}</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-[100] mt-2 w-full bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-sm font-bold flex items-center justify-between transition-colors ${
                      value === option.value 
                        ? 'bg-[#FFD700]/10 text-[#FFD700]' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                    {value === option.value && <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function AdminScheduledNotifsTab() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    body: '',
    trigger: 'product_inactive',
    delayHours: 168,
    targetSegment: 'sellers',
    targetCountry: 'all',
    active: true,
    actionUrl: ''
  });

  const loadTemplates = async () => {
    try {
      const snap = await getDocs(collection(db, 'notificationTemplates'));
      if (snap.empty) {
        for (const t of PRELOAD_TEMPLATES) {
          await addDoc(collection(db, 'notificationTemplates'), {
            ...t,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || 'system'
          });
        }
        const newSnap = await getDocs(collection(db, 'notificationTemplates'));
        setTemplates(newSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) {
      console.error("Error loading templates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const saveTemplate = async () => {
    if (!formData.name || !formData.title || !formData.body) return;
    try {
      if (editingTemplate) {
        await updateDoc(doc(db, 'notificationTemplates', editingTemplate.id), {
          ...formData,
          delayHours: Number(formData.delayHours),
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'notificationTemplates'), {
          ...formData,
          delayHours: Number(formData.delayHours),
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid
        });
      }
      setShowForm(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (e) {
      alert("Error al guardar la plantilla");
      console.error(e);
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await deleteDoc(doc(db, 'notificationTemplates', id));
      loadTemplates();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar");
    }
  };

  const toggleActive = async (template) => {
    try {
      const newStatus = !template.active;
      await updateDoc(doc(db, 'notificationTemplates', template.id), {
        active: newStatus,
        updatedAt: serverTimestamp()
      });
      setTemplates(templates.map(t => t.id === template.id ? { ...t, active: newStatus } : t));
    } catch (e) {
      alert("Error actualizando el estado");
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + variable
    }));
  };

  if (showForm) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 max-w-4xl max-h-[80vh] overflow-y-auto m-auto mt-4">
        <button 
          onClick={() => { setShowForm(false); setEditingTemplate(null); }}
          className="flex items-center gap-2 text-gray-500 font-bold mb-6 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Volver a Plantillas
        </button>

        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          {editingTemplate ? <Pencil className="w-6 h-6 text-[#FFD700]" /> : <Plus className="w-6 h-6 text-[#FFD700]" />}
          {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        </h3>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Nombre Interno</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Promo usuarios sin vistas"
              className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            />
          </div>

          <div>
             <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Título ({formData.title.length}/65)</label>
            </div>
            <input
              type="text"
              maxLength={65}
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-1.5 ml-1 mr-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Cuerpo del mensaje ({formData.body.length}/178)</label>
            </div>
            <textarea
              rows="3"
              maxLength={178}
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              className="w-full bg-[#F4F7FE] border-none text-gray-700 p-4 rounded-2xl text-sm font-bold outline-none resize-none focus:ring-2 focus:ring-[#FFD700]/50"
            />
            <div className="flex gap-2 mt-2">
              {['{{productName}}', '{{userName}}', '{{days}}'].map(v => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  className="text-[10px] uppercase font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomSelect
              label="Evento (Trigger)"
              value={formData.trigger}
              options={Object.entries(TRIGGERS).map(([value, label]) => ({ value, label }))}
              onChange={(val) => setFormData({ ...formData, trigger: val })}
              icon={Send}
            />
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">Tiempo de espera (Horas)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.delayHours}
                  onChange={e => setFormData({ ...formData, delayHours: e.target.value })}
                  className="w-full bg-[#F4F7FE] border-none text-gray-700 px-4 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">
                  {Math.floor(formData.delayHours / 24)} días
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CustomSelect
              label="Segmento"
              value={formData.targetSegment}
              options={[
                { value: 'sellers', label: 'Vendedores' },
                { value: 'buyers', label: 'Compradores' },
                { value: 'all', label: 'Todos' }
              ]}
              onChange={(val) => setFormData({ ...formData, targetSegment: val })}
              icon={Users}
            />
            <CustomSelect
              label="País"
              value={formData.targetCountry}
              options={[
                { value: 'all', label: 'Todos los países' },
                { value: 'España', label: 'España 🇪🇸' },
                { value: 'US', label: 'Estados Unidos 🇺🇸' },
                { value: 'Colombia', label: 'Colombia 🇨🇴' },
                { value: 'Ecuador', label: 'Ecuador 🇪🇨' },
                { value: 'Panamá', label: 'Panamá 🇵🇦' },
                { value: 'Perú', label: 'Perú 🇵🇪' },
                { value: 'DO', label: 'República Dominicana 🇩🇴' },
                { value: 'Chile', label: 'Chile 🇨🇱' },
                { value: 'Argentina', label: 'Argentina 🇦🇷' }
              ]}
              onChange={(val) => setFormData({ ...formData, targetCountry: val })}
            />
          </div>
          
          <div>
            <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1.5 ml-1">URL de Acción (opcional)</label>
            <div className="relative">
              <input
                type="url"
                value={formData.actionUrl || ''}
                onChange={e => setFormData({...formData, actionUrl: e.target.value})}
                placeholder="https://google.com/..."
                className="w-full bg-[#F4F7FE] border-none text-gray-700 pl-4 pr-20 py-3 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              />
              <span className="absolute right-4 top-3 text-[10px] font-black text-gray-400 uppercase">
                Opcional
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1 ml-1">
              Si se especifica, al pulsar la notificación se abrirá esta URL. Útil para valoraciones en tiendas de apps.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F4F7FE] rounded-2xl">
            <span className="text-sm font-extrabold text-gray-700">Estado de Plantilla</span>
            <button 
              onClick={() => setFormData({ ...formData, active: !formData.active })}
              className={`w-12 h-6 flex items-center rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <button
            onClick={saveTemplate}
            disabled={!formData.name || !formData.title || !formData.body}
            className="w-full bg-[#FFD700] text-black font-black p-4 rounded-2xl shadow-sm hover:bg-[#FFE033] mt-6 disabled:opacity-50"
          >
            Guardar Plantilla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center shrink-0">
            <CalendarClock className="w-6 h-6 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-none mb-1">
              Automáticas
            </h2>
            <p className="text-[12px] md:text-sm font-bold text-gray-400 leading-tight">
              Disparadores y plantillas programadas
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setFormData({
              name: '',
              title: '',
              body: '',
              trigger: 'product_inactive',
              delayHours: 168,
              targetSegment: 'sellers',
              targetCountry: 'all',
              active: true,
              actionUrl: ''
            });
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-black text-[#FFD700] px-5 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>Nueva Plantilla</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center font-bold text-gray-400">Cargando plantillas...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-[1.5rem] p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
              {/* FILA 1: Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-black text-sm text-gray-800 leading-tight">{t.name}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="bg-indigo-50 text-indigo-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-indigo-100">
                      {TRIGGERS[t.trigger]}
                    </span>
                    <span className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-gray-100 flex items-center gap-1">
                      <Clock size={9} /> {Math.floor(t.delayHours/24)}d
                    </span>
                    <span className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-gray-100 flex items-center gap-1 text-nowrap">
                      <Users size={9} /> {t.targetSegment}
                    </span>
                    {t.actionUrl && (
                      <a 
                        href={t.actionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg"
                      >
                        <ExternalLink size={9} /> Ver enlace
                      </a>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => toggleActive(t)}
                  className={`shrink-0 px-2 py-0.5 text-[9px] font-black uppercase rounded-md border flex items-center gap-1.5 transition-colors ${t.active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                >
                  <span className={`w-1 h-1 rounded-full ${t.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {t.active ? 'Activa' : 'Pausada'}
                </button>
              </div>

              {/* FILA 2: Preview del mensaje */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-[11px] font-black text-[#1A1A3A] truncate block">{t.title}</span>
                <div className="border-b border-gray-200/50 my-1.5" />
                <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{t.body}</p>
              </div>

              {/* FILA 3: Acciones */}
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => { setEditingTemplate(t); setFormData(t); setShowForm(true); }}
                  className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                  title="Editar"
                >
                  <Pencil size={13} />
                </button>
                <button 
                  onClick={() => deleteTemplate(t.id)}
                  className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-100 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
