import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCategoryStore, getIconComponent } from '../../store/useCategoryStore';
import { 
  Plus, Edit2, Trash2, Check, X, GripVertical, 
  Eye, EyeOff, Search, Save, RefreshCcw 
} from 'lucide-react';
import * as FiIcons from 'react-icons/fi';
import * as LuIcons from 'lucide-react';
import * as IoIcons from 'react-icons/io5';

// Lista predefinida de iconos sugeridos
const SUGGESTED_ICONS = [
  // Comida y Bebida
  { name: 'Coffee', lib: 'Lu' }, { name: 'Utensils', lib: 'Lu' }, { name: 'Pizza', lib: 'Lu' }, { name: 'Beer', lib: 'Lu' }, { name: 'IceCream', lib: 'Lu' },
  // Comercio y Logística
  { name: 'Package', lib: 'Lu' }, { name: 'ShoppingBag', lib: 'Lu' }, { name: 'ShoppingCart', lib: 'Lu' }, { name: 'Truck', lib: 'Lu' }, { name: 'Store', lib: 'Lu' },
  // Servicios y Herramientas
  { name: 'Tool', lib: 'Lu' }, { name: 'Wrench', lib: 'Lu' }, { name: 'Hammer', lib: 'Lu' }, { name: 'Settings', lib: 'Lu' }, { name: 'Briefcase', lib: 'Lu' },
  // Salud y Deporte
  { name: 'Heart', lib: 'Lu' }, { name: 'Activity', lib: 'Lu' }, { name: 'Stethoscope', lib: 'Lu' }, { name: 'Dumbbell', lib: 'Lu' }, { name: 'Trophy', lib: 'Lu' },
  // Motor y Viajes
  { name: 'Car', lib: 'Lu' }, { name: 'Bike', lib: 'Lu' }, { name: 'Plane', lib: 'Lu' }, { name: 'MapPin', lib: 'Lu' }, { name: 'Ship', lib: 'Lu' },
  // Inmuebles y Hogar
  { name: 'Home', lib: 'Lu' }, { name: 'Building', lib: 'Lu' }, { name: 'Bed', lib: 'Lu' }, { name: 'Key', lib: 'Lu' }, { name: 'Lamp', lib: 'Lu' },
  // Tecnología y Electrónica
  { name: 'Smartphone', lib: 'Lu' }, { name: 'Laptop', lib: 'Lu' }, { name: 'Tv', lib: 'Lu' }, { name: 'Headphones', lib: 'Lu' }, { name: 'Camera', lib: 'Lu' },
  // Estilo de Vida y Otros
  { name: 'Baby', lib: 'Lu' }, { name: 'Palette', lib: 'Lu' }, { name: 'Music', lib: 'Lu' }, { name: 'Zap', lib: 'Lu' }, { name: 'Star', lib: 'Lu' },
  { name: 'Smile', lib: 'Lu' }, { name: 'Sprout', lib: 'Lu' }, { name: 'Book', lib: 'Lu' }, { name: 'Scissors', lib: 'Lu' }, { name: 'Ghost', lib: 'Lu' }
];

export default function AdminCategoriesTab() {
  const { categories, fetchAllForAdmin } = useCategoryStore();
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ label: '', icon: 'CirclePlus', order: 0, active: true });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = fetchAllForAdmin();
    return () => unsubscribe();
  }, [fetchAllForAdmin]);

  const handleSave = async (id) => {
    try {
      if (id) {
        await updateDoc(doc(db, 'categories', id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        setIsAdding(false);
      }
      setFormData({ label: '', icon: 'CirclePlus', order: 0, active: true });
    } catch (err) {
      console.error("Error saving category:", err);
      alert("Error al guardar la categoría");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ label: cat.label, icon: cat.icon, order: cat.order, active: cat.active });
  };

  const filteredCategories = categories.filter(c => 
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeed = async () => {
    const STATIC_CATEGORIES = [
      { id: "Comida", label: "Comida", icon: "Coffee", active: true, order: 1 },
      { id: "Envios", label: "Envíos", icon: "Package", active: true, order: 2 },
      { id: "Inmobiliaria", label: "Inmobiliaria", icon: "Home", active: true, order: 3 },
      { id: "Formacion", label: "Formación", icon: "BookCheck", active: true, order: 4 },
      { id: "Deporte", label: "Deporte", icon: "Dumbbell", active: true, order: 5 },
      { id: "Empleo", label: "Empleo", icon: "Briefcase", active: true, order: 6 },
      { id: "Servicios", label: "Servicios", icon: "Tool", active: true, order: 7 },
      { id: "Ventas", label: "Ventas", icon: "ShoppingBag", active: true, order: 8 },
      { id: "Legal", label: "Legal", icon: "Scale", active: true, order: 9 },
      { id: "Salud", label: "Salud", icon: "Heart", active: true, order: 10 },
      { id: "Otros", label: "Otros", icon: "CirclePlus", active: true, order: 11 },
    ];

    if (!window.confirm("¿Deseas poblar la base de datos con las categorías iniciales?")) return;

    try {
      for (const cat of STATIC_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
          ...cat,
          createdAt: serverTimestamp()
        });
      }
      alert("Categorías sembradas con éxito. Las verás en unos segundos.");
    } catch (err) {
      console.error(err);
      alert("Error al sembrar categorías.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800">Gestión de Categorías</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Desacopladas y Dinámicas</p>
            {categories.length === 0 && (
              <button 
                onClick={handleSeed}
                className="text-[10px] font-black bg-blue-50 text-blue-500 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors uppercase"
              >
                Poblar iniciales
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-gray-50 rounded-2xl flex items-center px-4 py-2 border border-gray-100 flex-1 md:w-64">
            <Search size={16} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-600 w-full"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#FFD700] p-3 rounded-2xl shadow-lg shadow-yellow-200 active:scale-95 transition-all"
          >
            <Plus size={20} className="text-black" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Add Category Form */}
          {isAdding && (
            <div className="bg-[#F8FAFC] border-2 border-dashed border-[#FFD700] rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-yellow-600 uppercase">Nueva Categoría</span>
                <button onClick={() => setIsAdding(false)}><X size={18} /></button>
              </div>
              <CategoryForm 
                formData={formData} 
                setFormData={setFormData} 
                onSave={() => handleSave(null)} 
                onCancel={() => setIsAdding(false)} 
              />
            </div>
          )}

          {/* Categories List */}
          {filteredCategories.map((cat) => (
            <div key={cat.id} className={`bg-white border rounded-3xl p-5 transition-all ${cat.active ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
              {editingId === cat.id ? (
                <CategoryForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSave={() => handleSave(cat.id)} 
                  onCancel={() => setEditingId(null)} 
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shadow-inner">
                      {(() => {
                        const IconComp = getIconComponent(cat.icon);
                        return <IconComp className="w-6 h-6 text-gray-700" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800">{cat.label}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Orden: {cat.order}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="p-2 bg-gray-50 text-blue-500 rounded-xl hover:bg-blue-50">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 bg-gray-50 text-red-500 rounded-xl hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryForm({ formData, setFormData, onSave, onCancel }) {
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const filteredIcons = SUGGESTED_ICONS.filter(i => 
      i.name.toLowerCase().includes(iconSearch.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block px-1">Etiqueta</label>
          <input 
            type="text" 
            value={formData.label}
            onChange={(e) => setFormData({...formData, label: e.target.value})}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#FFD700]"
            placeholder="Ej: Inmobiliaria"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block px-1">Icono</label>
            <button 
              type="button" // Evitar submit
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {(() => {
                  const IconComp = getIconComponent(formData.icon);
                  return <IconComp size={16} />;
                })()}
                {formData.icon}
              </span>
              <RefreshCcw size={14} className={showIconPicker ? 'rotate-180 transition-transform text-[#FFD700]' : ''} />
            </button>
            
            {showIconPicker && (
              <div 
                className="absolute top-[105%] left-0 w-[280px] bg-white/95 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[20px_20px_60px_rgba(0,0,0,0.1)] z-[500] p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center gap-2 bg-gray-100/50 rounded-xl px-3 py-2">
                  <Search size={14} className="text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar icono..."
                    className="bg-transparent border-none outline-none text-[10px] font-bold w-full"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto grid grid-cols-4 gap-2 pr-1 custom-scrollbar">
                  {filteredIcons.map(i => {
                    const IconComp = getIconComponent(i.name);
                    const isSelected = formData.icon === i.name;
                    return (
                      <button 
                        key={i.name}
                        type="button"
                        onClick={() => { 
                          setFormData({...formData, icon: i.name}); 
                          setShowIconPicker(false);
                          setIconSearch('');
                        }}
                        className={`h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-[#FFD700] text-black shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]' : 'bg-gray-50 text-gray-500 hover:bg-white hover:shadow-sm'}`}
                        title={i.name}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-4 py-4 text-center text-[10px] text-gray-400 font-bold uppercase">No hay iconos</div>
                  )}
                </div>
              </div>
            )}
          </div>

        <div className="w-24">
          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block px-1">Orden</label>
          <input 
            type="number" 
            value={formData.order}
            onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#FFD700]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 px-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div 
            onClick={() => setFormData({...formData, active: !formData.active})}
            className={`w-10 h-6 rounded-full transition-all relative ${formData.active ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.active ? 'left-5' : 'left-1'}`} />
          </div>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{formData.active ? 'Activa' : 'Inactiva'}</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button 
          onClick={onSave}
          className="flex-1 bg-black text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save size={16} /> Guardar
        </button>
        <button 
          onClick={onCancel}
          className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
