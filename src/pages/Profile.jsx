import { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, LogOut, ChevronDown, 
  ShieldCheck, Loader2, Camera, Lock, Info, 
  HelpCircle, Cookie, ShieldAlert, Instagram, Facebook, Youtube, Twitter, UserCircle2,
  Package, Edit2, Trash2, PlusCircle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';

export default function Profile() {
  const { userData, currentUser, userAvatar, logout, isAdmin } = useAuth();
  const storeUser = useAuthStore((s) => s.user); // Fuente de verdad del UID real
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); 
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

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
    if (window.confirm('¿Estás seguro de que quieres borrar este anuncio?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) {
        console.error(e);
      }
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
          className="ml-2 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-[#E0E5EC] text-[#0056B3] shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] transition-all"
        >
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

          <h1 className="text-2xl font-black text-[#1A1A3A] mb-1">
            {userData?.name ? `${userData.name} ${userData?.lastName || ''}` : 'Pana Dev'}
          </h1>
          
          <div className="flex items-center gap-1 mb-6 px-4 py-1.5 bg-[#0056B3]/10 rounded-full border border-[#0056B3]/20 text-[#0056B3] text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck size={14} /> Pana Verificado Nivel {userData?.verificationLevel || 1}
          </div>

          {/* User Data List */}
          <div className="w-full space-y-1">
            <HeaderInfoItem icon={Mail} label="Correo Electrónico" value={userData?.email} actionLabel="Verificar" onAction={() => alert('Email enviado')} />
            <HeaderInfoItem icon={MapPin} label="Ubicación" value={userData?.region} />
            <HeaderInfoItem icon={Lock} label="Contraseña" isPassword actionLabel="Cambiar" onAction={() => alert('Link enviado')} />
            <HeaderInfoItem icon={User} label="Sexo" value={userData?.gender} />
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
                        <div key={product.id} className="bg-[#E0E5EC] p-3 rounded-xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img 
                              src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-200 flex-shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1A1A3A] truncate">{product.name || product.title}</span>
                              <span className="text-[11px] font-black text-[#0056B3]">{Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => navigate(`/perfil-producto?id=${product.id}`)} className="p-2 bg-white/50 rounded-lg text-gray-600 hover:text-blue-600 transition-colors shadow-sm" title="Ver anuncio">
                              <ExternalLink size={14} />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-white/50 rounded-lg text-red-400 hover:text-red-600 transition-colors shadow-sm" title="Eliminar">
                              <Trash2 size={14} />
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
                      <div key={product.id} className="bg-[#E0E5EC]/50 p-3 rounded-xl border border-dashed border-gray-300 flex items-center justify-between gap-3 opacity-70">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img 
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover grayscale flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-500 truncate">{product.name || product.title}</span>
                            <span className="text-[11px] font-black text-gray-400">{Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleDeleteProduct(product.id)} className="p-2 rounded-lg text-red-300 hover:text-red-600 transition-colors">
                            <Trash2 size={14} />
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
    </div>
  );
}
