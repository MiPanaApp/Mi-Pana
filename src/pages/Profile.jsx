import { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, LogOut, ChevronDown, 
  ShieldCheck, Loader2, Camera, Lock, Info, 
  HelpCircle, Cookie, ShieldAlert, Instagram, Facebook, Youtube, Twitter, UserCircle2,
  Package, Edit2, Trash2, PlusCircle, ExternalLink, Eye, EyeOff, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import { useStore } from '../store/useStore';
import { LOCATION_DATA } from '../data/locations';

export default function Profile() {
  const { userData, currentUser, userAvatar, logout, isAdmin } = useAuth();
  const storeUser = useAuthStore((s) => s.user); // Fuente de verdad del UID real
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); 
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  const { selectedCountry } = useStore();

  const isGoogleLogin = currentUser?.providerData?.some(provider => provider.providerId === 'google.com');

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: newName.trim(),
        lastName: newLastName.trim(),
        updatedAt: new Date()
      });
      setShowNameModal(false);
    } catch (error) {
      console.error("Error al actualizar nombre:", error);
      alert('Hubo un error al actualizar tu nombre.');
    }
  };

  const handleSexSelect = async (sexValue) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        gender: sexValue,
        updatedAt: new Date()
      });
      setShowSexModal(false);
    } catch (error) {
      console.error("Error al actualizar sexo:", error);
      alert('Hubo un error al actualizar el sexo.');
    }
  };

  const handleRegionSelect = async (regionName) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        region: regionName,
        updatedAt: new Date()
      });
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert('Hubo un error al actualizar la ubicación.');
    }
  };

  // Cargar Anuncios del Usuario
  useEffect(() => {
    // Usamos el UID del store (fuente de verdad) o del currentUser como fallback
    const uid = storeUser?.uid || currentUser?.uid;
    if (!uid) return;
    console.log('[Profile] Buscando productos para UID:', uid);
    const q = query(collection(db, 'products'), where('userId', '==', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log('[Profile] Productos encontrados:', prods.length);
      setMyProducts(prods);
      setProductsLoading(false);
    }, (err) => {
      console.error('[Profile] Error en query de productos:', err);
      setProductsLoading(false);
    });
    return () => unsubscribe();
  }, [storeUser?.uid, currentUser?.uid]);

  const activeProducts = myProducts.filter(p => !p.status || p.status === 'active');
  const inactiveProducts = myProducts.filter(p => p.status === 'inactive' || p.status === 'sold');

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este anuncio definitivamente?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        console.error("Error al borrar el producto:", e);
        alert("No se pudo borrar el anuncio.");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await updateDoc(doc(db, 'products', id), {
        status: newStatus
      });
    } catch (e) {
      console.error("Error al cambiar el estado:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleEditAvatar = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) return alert('Selecciona una imagen válida.');
    if (file.size > 5 * 1024 * 1024) return alert('Máximo 5MB.');

    setIsUploading(true);
    try {
      const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await setDoc(doc(db, 'users', currentUser.uid), { avatar: downloadURL, updatedAt: new Date() }, { merge: true });
    } catch (error) {
      console.error(error);
      alert('Error al subir foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  // Sub-componente para los items de la cabecera
  const HeaderInfoItem = ({ icon: Icon, label, value, actionLabel, onAction, isPassword }) => (
    <div className="w-full flex items-center justify-between py-3 border-b border-white/20 last:border-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="min-w-[36px] h-[36px] rounded-xl flex items-center justify-center bg-[#E0E5EC] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-[#1A1A3A]">
          <Icon size={18} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-black text-[#8888AA] uppercase">{label}</span>
          <span className="text-sm font-bold text-[#1A1A3A] truncate">
            {isPassword ? '••••••••' : (value || 'No especificado')}
          </span>
        </div>
      </div>
      {actionLabel && (
        <button 
          onClick={onAction}
          className="ml-2 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-[#E0E5EC] text-[#0056B3] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] transition-all flex items-center gap-1"
        >
          {actionLabel === 'Editar' && <Edit2 size={10} />}
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E0E5EC] pb-32 md:pb-0 pt-[20px] px-6 font-sans">
      <div className="max-w-md mx-auto">
        
        {/* Cabecera Soft UI Principal */}
        <div className="bg-[#E0E5EC] rounded-[40px] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] flex flex-col items-center mb-10">
          
          {/* Avatar Section */}
          <div className="relative mb-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div 
              onClick={handleEditAvatar}
              className="w-32 h-32 rounded-full p-1.5 bg-[#E0E5EC] shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border-4 border-white cursor-pointer overflow-hidden flex items-center justify-center group"
            >
              {isUploading ? <Loader2 className="animate-spin text-[#0056B3]" /> : 
               userAvatar ? <img src={userAvatar} className="w-full h-full object-cover rounded-full" /> : 
               <User size={60} className="text-gray-300" />}
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black text-[#1A1A3A] mb-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={() => { setNewName(userData?.name || ''); setNewLastName(userData?.lastName || ''); setShowNameModal(true); }}>
            {userData?.name ? `${userData.name} ${userData?.lastName || ''}` : 'Pana Dev'}
            {isGoogleLogin && <FcGoogle size={18} className="translate-y-[1px]" title="Conectado con Google" />}
            <Edit2 size={16} className="text-[#1A1A3A]/40 transition-colors hover:text-[#0056B3] ml-1" />
          </h1>
          
          <div className="flex items-center gap-1 mb-6 px-4 py-1.5 bg-[#0056B3]/10 rounded-full border border-[#0056B3]/20 text-[#0056B3] text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck size={14} /> Pana Verificado Nivel {userData?.verificationLevel || 1}
          </div>

          {/* User Data List */}
          <div className="w-full space-y-1">
            <HeaderInfoItem 
              icon={Mail} 
              label="Correo Electrónico" 
              value={userData?.email} 
              actionLabel={isGoogleLogin ? null : "Verificar"} 
              onAction={() => alert('Email enviado')} 
            />
            <HeaderInfoItem 
              icon={MapPin} 
              label="Ubicación" 
              value={userData?.region} 
              actionLabel="Editar"
              onAction={() => setShowLocationModal(true)} 
            />
            <HeaderInfoItem 
              icon={Lock} 
              label="Contraseña" 
              isPassword 
              actionLabel={isGoogleLogin ? null : "Cambiar"} 
              onAction={() => alert('Link enviado para cambiar contraseña')} 
            />
            <HeaderInfoItem 
              icon={User} 
              label="Sexo" 
              value={userData?.gender} 
              actionLabel="Editar"
              onAction={() => setShowSexModal(true)} 
            />
          </div>
        </div>

        {/* ACCESO AL DASHBOARD (Solo si es Admin) */}
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full mb-8 p-5 bg-[#1A1A3A] text-white rounded-[2rem] flex items-center justify-between group active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(26,26,58,0.2)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD700] rounded-2xl flex items-center justify-center shadow-[0_5px_15px_rgba(255,215,0,0.3)]">
                <ShieldAlert className="text-[#1A1A3A] w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block font-black text-sm uppercase tracking-widest text-[#FFD700]">Staff Mi Pana</span>
                <span className="text-xs font-bold text-white/60">Acceder al Panel de Control</span>
              </div>
            </div>
            <ChevronDown className="w-6 h-6 text-white/40 -rotate-90 group-hover:text-[#FFD700] transition-colors" />
          </button>
        )}

        {/* Desplegables (Claymorphism Style) - Solo visibles en Móvil */}
        <div className="md:hidden space-y-6">
          
          {/* MIS ANUNCIOS */}
          <div className="group">
            <button 
              onClick={() => toggleMenu('mis-anuncios')}
              className="w-full flex items-center justify-between p-5 bg-[#E0E5EC] rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] text-[#1A1A3A] font-bold active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <span>Mis Anuncios</span>
                <span className="ml-2 px-2 py-0.5 bg-[#0056B3]/10 text-[#0056B3] text-[10px] rounded-full">
                  {myProducts.length}
                </span>
              </div>
              <ChevronDown size={20} className={`transition-transform duration-300 ${openMenu === 'mis-anuncios' ? 'rotate-180' : ''}`} />
            </button>
            
            {openMenu === 'mis-anuncios' && (
              <div className="mt-2 mx-2 p-4 bg-white/30 rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3)] space-y-6">
                
                {/* Categoría: ACTIVOS */}
                <div>
                  <h3 className="text-[10px] font-black text-[#0056B3] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Activos ({activeProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {activeProducts.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No tienes anuncios activos.</p>
                    ) : (
                      activeProducts.map(product => (
                        <div key={product.id} className="bg-[#E0E5EC] p-3.5 rounded-[1.5rem] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex flex-col gap-3">
                          <div className="flex items-center gap-4">
                            <img 
                              src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                              alt={product.name}
                              className="w-14 h-14 rounded-2xl object-cover bg-white shadow-sm flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-black text-[#1A1A3A] truncate">{product.name || product.title}</span>
                              <span className="text-[13px] font-black text-[#0056B3]">{Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                            </div>
                          </div>
                          
                          {/* Botones Debajo */}
                          <div className="flex items-center gap-3 pt-1">
                            <button 
                              onClick={() => navigate(`/perfil-producto?id=${product.id}`)} 
                              className="flex-1 py-2 bg-white/60 rounded-xl text-[#1A1A3A] font-bold text-[10px] uppercase shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <ExternalLink size={14} /> Ver
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(product.id, 'active')} 
                              className="flex-1 py-2 bg-white/60 rounded-xl text-amber-600 font-bold text-[10px] uppercase shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <EyeOff size={14} /> Suspender
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)} 
                              className="flex-1 py-2 bg-white/60 rounded-xl text-red-500 font-bold text-[10px] uppercase shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <Trash2 size={14} /> Borrar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Categoría: NO ACTIVOS */}
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    No Activos ({inactiveProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {inactiveProducts.map(product => (
                      <div key={product.id} className="bg-[#E0E5EC] p-3.5 rounded-[1.5rem] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex flex-col gap-3 opacity-80 backdrop-grayscale-[0.5]">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                            alt={product.name}
                            className="w-14 h-14 rounded-2xl object-cover grayscale shadow-sm flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-gray-500 truncate">{product.name || product.title}</span>
                            <span className="text-[13px] font-black text-gray-400">{Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-tighter">Suspendido</span>
                        </div>

                        {/* Botones Debajo En Inactivos */}
                        <div className="flex items-center gap-3 pt-1">
                          <button 
                            onClick={() => handleToggleStatus(product.id, 'inactive')} 
                            className="flex-1 py-2 bg-[#0056B3] rounded-xl text-white font-bold text-[10px] uppercase shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Eye size={14} /> Mostrar
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)} 
                            className="flex-1 py-2 bg-white/60 rounded-xl text-red-500 font-bold text-[10px] uppercase shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Trash2 size={14} /> Borrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón rápido Crear Anuncio */}
                <button 
                  onClick={() => navigate('/anunciar')}
                  className="w-full py-3 flex items-center justify-center gap-2 text-[11px] font-black text-[#0056B3] bg-[#E0E5EC] rounded-xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] uppercase tracking-wider"
                >
                  <PlusCircle size={16} /> Crear Nuevo Post
                </button>
              </div>
            )}
          </div>

          {/* Plataforma Mi Pana */}
          <div className="group">
            <button 
              onClick={() => toggleMenu('plataforma')}
              className="w-full flex items-center justify-between p-5 bg-[#E0E5EC] rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] text-[#1A1A3A] font-bold active:scale-[0.98] transition-all"
            >
              <span>Plataforma Mi Pana</span>
              <ChevronDown size={20} className={`transition-transform duration-300 ${openMenu === 'plataforma' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'plataforma' && (
              <div className="mt-2 mx-2 p-2 bg-white/30 rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3)] flex flex-col gap-1">
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><Info size={16}/> ¿Cómo Funciona?</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><User size={16}/> Sobre Mi Pana</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><ShieldCheck size={16}/> Verificación Mi Pana</button>
              </div>
            )}
          </div>

          {/* Soporte Mi Pana */}
          <div className="group">
            <button 
              onClick={() => toggleMenu('soporte')}
              className="w-full flex items-center justify-between p-5 bg-[#E0E5EC] rounded-2xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] text-[#1A1A3A] font-bold active:scale-[0.98] transition-all"
            >
              <span>Soporte Mi Pana</span>
              <ChevronDown size={20} className={`transition-transform duration-300 ${openMenu === 'soporte' ? 'rotate-180' : ''}`} />
            </button>
            {openMenu === 'soporte' && (
              <div className="mt-2 mx-2 p-2 bg-white/30 rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.3)] flex flex-col gap-1">
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><Phone size={16}/> Contactar</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><HelpCircle size={16}/> Centro de Ayuda</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><Lock size={16}/> Políticas de Privacidad</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><Cookie size={16}/> Gestión de Cookies</button>
                <button className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"><ShieldAlert size={16}/> Seguridad</button>
              </div>
            )}
          </div>
        </div>

        {/* Redes Sociales Footer - Solo visibles en Móvil */}
        <div className="md:hidden flex justify-center gap-4 mt-12 mb-8">
          {[Twitter, Instagram, Facebook, Youtube, UserCircle2].map((Icon, i) => (
            <button key={i} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E0E5EC] shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] text-[#1A1A3A] active:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] transition-all">
              <Icon size={20} />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-5 px-6 mb-10 md:mb-[20px] bg-[#E0E5EC] text-[#D90429] font-black rounded-3xl shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] active:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5)] transition-all border border-white/40"
        >
          <LogOut size={22} /> Cerrar Sesión
        </button>

      </div>

      {/* Modal Neumórfico para Selector de Ubicación */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setShowLocationModal(false)}
                className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A] hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-black text-[#1A1A3A] mb-1 pl-1">Selecciona Ubicación</h2>
              <p className="text-xs font-bold text-[#8888AA] mb-5 pl-1">
                Según el país seleccionado ({selectedCountry})
              </p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-2">
                {Object.keys((LOCATION_DATA[selectedCountry] || LOCATION_DATA['ES']).data).map((regionName) => (
                  <button
                    key={regionName}
                    onClick={() => handleRegionSelect(regionName)}
                    className="w-full flex items-center justify-between p-4 bg-[#E0E5EC] rounded-2xl shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold transition-all text-sm group"
                  >
                    {regionName}
                    <div className="w-2 h-2 rounded-full bg-[#0056B3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Neumórfico para Nombre y Apellido */}
      <AnimatePresence>
        {showNameModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNameModal(false)}
              className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col"
            >
              <button 
                onClick={() => setShowNameModal(false)}
                className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A] hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-black text-[#1A1A3A] mb-1 pl-1">Actualizar Nombre</h2>
              <p className="text-xs font-bold text-[#8888AA] mb-5 pl-1">¿Cómo quieres que te llamen los Panas?</p>
              
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full p-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                    placeholder="Tu nombre..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Apellido (Opcional)</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full p-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                    placeholder="Tu apellido..."
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full mt-2 py-4 rounded-full bg-[#1A1A3A] text-white font-black uppercase text-sm shadow-[0_10px_20px_rgba(26,26,58,0.3)] active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Neumórfico para Selector de Sexo */}
      <AnimatePresence>
        {showSexModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSexModal(false)}
              className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col"
            >
              <button 
                onClick={() => setShowSexModal(false)}
                className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A] hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-black text-[#1A1A3A] mb-1 pl-1">Identidad de Sexo</h2>
              <p className="text-xs font-bold text-[#8888AA] mb-5 pl-1">
                Completa tu perfil
              </p>
              
              <div className="flex-1 overflow-y-auto space-y-3 pb-2">
                {['Hombre', 'Mujer', 'Otro'].map((genderOption) => (
                  <button
                    key={genderOption}
                    onClick={() => handleSexSelect(genderOption)}
                    className="w-full flex items-center justify-between p-4 bg-[#E0E5EC] rounded-2xl shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold transition-all text-sm group"
                  >
                    {genderOption}
                    <div className="w-2 h-2 rounded-full bg-[#0056B3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
