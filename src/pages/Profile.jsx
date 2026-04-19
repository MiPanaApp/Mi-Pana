import { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, LogOut, ChevronDown, Bell,
  ShieldCheck, Loader2, Camera, Lock, Info, 
  HelpCircle, Cookie, ShieldAlert, Instagram, Facebook, Youtube, Twitter, UserCircle2,
  Package, Edit2, Trash2, PlusCircle, ExternalLink, Eye, EyeOff, X, Calendar, Globe, MoreVertical, CheckCircle2,
  Clock, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, storage, auth } from '../services/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FcGoogle } from 'react-icons/fc';

import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { uploadString } from 'firebase/storage';
import { LegalData } from '../data/LegalData';
import LegalDrawer from '../components/LegalDrawer';
import AvatarCropper from '../components/auth/AvatarCropper';
import { useLocationStore } from '../store/useLocationStore';
import { getCountryNameFromCode, getCountryCodeFromName, LOCATION_DATA } from '../data/locations';
import { usePushNotifications } from '../hooks/usePushNotifications';

const functions = getFunctions(undefined, 'us-central1');


export default function Profile() {
  const { userData, currentUser, userAvatar, logout, isAdmin } = useAuth();
  const { permission, requestPermission } = usePushNotifications();
  const storeUser = useAuthStore((s) => s.user); // Fuente de verdad del UID real
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); 
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeProductMenu, setActiveProductMenu] = useState(null);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNext, setShowPwdNext] = useState(false);
  
  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [legalDocs, setLegalDocs] = useState({ isOpen: false, title: '', content: '' });

  const { countries, getCountryConfig, init: initLocations } = useLocationStore();

  useEffect(() => {
    const unsub = initLocations();
    return () => unsub();
  }, [initLocations]);

  // Resolviendo datos de país para mostrar
  let userCountryCode = userData?.country || 'ES';
  
  // Normalizador para migraciones: Si el country guardado es el NOMBRE largo, sacamos el ISO code
  if (userCountryCode.length > 3 || userCountryCode.includes(' ')) {
    userCountryCode = getCountryCodeFromName(userCountryCode);
  }

  const userCountryInfo = countries.find(c => c.id === userCountryCode);
  const countryDisplayName = userCountryInfo ? `${userCountryInfo.flag} ${userCountryInfo.name}` : getCountryNameFromCode(userCountryCode);
  const regionLabel = getCountryConfig(userCountryCode)?.level1 || 'Comunidad / Región';

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
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (!uid) { alert('No hay sesión activa.'); return; }
    try {
      await setDoc(doc(db, 'users', uid), {
        gender: sexValue,
        updatedAt: new Date()
      }, { merge: true });
      setShowSexModal(false);
    } catch (error) {
      console.error("Error al actualizar sexo:", error);
      alert('Hubo un error al actualizar el sexo.');
    }
  };

  const handleRegionSelect = async (regionName) => {
    const uid = currentUser?.uid || auth.currentUser?.uid;
    if (!uid) { alert('No hay sesión activa.'); return; }
    try {
      await setDoc(doc(db, 'users', uid), {
        region: regionName,
        updatedAt: new Date()
      }, { merge: true });
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error al actualizar ubicación:", error);
      alert('Hubo un error al actualizar la ubicación.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    const user = auth.currentUser;
    if (!user) { setPwdError('No hay sesión activa.'); return; }
    if (pwdForm.next.length < 8) { setPwdError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Las contraseñas no coinciden.'); return; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(pwdForm.next)) {
      setPwdError('Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
      return;
    }
    setPwdLoading(true);
    try {
      const email = user.email || userData?.email;
      const credential = EmailAuthProvider.credential(email, pwdForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwdForm.next);
      setPwdSuccess(true);
      setPwdForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setShowPasswordModal(false); setPwdSuccess(false); }, 1500);
    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwdError('La contraseña actual es incorrecta.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPwdError('Por seguridad, cierra sesión e inicia de nuevo antes de cambiar la contraseña.');
      } else {
        setPwdError('Error al cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setPwdLoading(false);
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
    const product = myProducts.find(p => p.id === id);
    if (!product) return;

    if (window.confirm(`¿Estás seguro de que quieres borrar "${product.name || product.title}" definitivamente?`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        
        // Enviar email de eliminación
        try {
          const sendDeletedEmail = httpsCallable(functions, 'sendProductDeletedEmail');
          await sendDeletedEmail({
            email: currentUser?.email || storeUser?.email || '',
            userName: userData?.name || currentUser?.displayName || 'Pana',
            productName: product.name || product.title
          });
        } catch (e) {
          console.error('Error enviando email de eliminación:', e);
        }
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

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = async (croppedDataUrl) => {
    setIsUploading(true);
    setShowCropper(false);
    try {
      const fileName = `avatar_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${fileName}`);
      
      // Upload base64 string
      await uploadString(storageRef, croppedDataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'users', currentUser.uid), { 
        avatar: downloadURL, 
        updatedAt: new Date() 
      }, { merge: true });
      
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error al subir avatar recortado:", error);
      alert('Error al guardar la foto recortada.');
    } finally {
      setIsUploading(false);
    }
  };

  const openLegal = (key) => {
    const doc = LegalData[key];
    if (doc) {
      setLegalDocs({ isOpen: true, title: doc.title, content: doc.content });
    }
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const toggleProductMenu = (id) => {
    setActiveProductMenu(activeProductMenu === id ? null : id);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeProductMenu && !e.target.closest('.product-menu-container')) {
        setActiveProductMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeProductMenu]);

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

  const displayEmail = userData?.email || currentUser?.email;
  let displayName = 'Pana Dev';
  if (userData?.name) {
    displayName = `${userData.name} ${userData.lastName || ''}`.trim();
  } else if (currentUser?.displayName) {
    displayName = currentUser.displayName;
  }

  const renderAdsContent = (isDesktop = false) => (
    <div className={`space-y-6 ${isDesktop ? "grid grid-cols-2 gap-5 space-y-0 items-start" : ""}`}>
      {/* Categoría: ACTIVOS */}
      <div className={isDesktop ? "bg-white/25 rounded-[28px] p-5 border border-white/60 shadow-[inset_1px_1px_4px_rgba(163,177,198,0.2)]" : ""}>
        <div className={`flex items-center justify-between ${isDesktop ? "mb-3 pb-3 border-b border-white/50" : "mb-4"}`}>
          <h3 className="text-[10px] sm:text-xs font-black text-[#0056B3] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Activos ({activeProducts.length})
          </h3>
          {isDesktop && activeProducts.length > 0 && (
            <span className="text-[10px] font-bold text-[#1A1A3A]/30 uppercase tracking-widest">
              {activeProducts.length} anuncio{activeProducts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className={`${isDesktop ? "space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar scroll-smooth" : "space-y-4"}`}>
          {activeProducts.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">{isDesktop ? <span className="block text-center py-8 opacity-40">No tienes anuncios activos.</span> : 'No tienes anuncios activos.'}</p>
          ) : (
            activeProducts.map(product => (
              <div key={product.id} className={`bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex items-center gap-3 transition-transform hover:scale-[1.01] ${isDesktop ? 'p-3 rounded-2xl' : 'p-3.5 md:p-5 rounded-[1.5rem] md:rounded-[2rem] flex-col sm:flex-row'}`}>
                <div className={isDesktop ? 'contents' : 'flex items-start gap-4 w-full'}>
                  <img 
                    src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                    alt={product.name}
                    className={`rounded-xl object-cover bg-white shadow-sm flex-shrink-0 ${isDesktop ? 'w-12 h-12' : 'w-14 h-14 md:w-16 md:h-16'}`}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className={`flex gap-2 ${isDesktop ? 'items-center justify-between' : 'justify-between items-start'}`}>
                      <span className={`font-black text-[#1A1A3A] leading-tight ${isDesktop ? 'text-sm truncate flex-1' : 'text-sm md:text-base line-clamp-2'}`}>
                        {product.name || product.title}
                      </span>
                      {isDesktop && (
                        <span className="text-sm font-black text-[#0056B3] shrink-0 tabular-nums">
                          {product.price === 'Consultar' ? 'Consultar' : `${Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                        </span>
                      )}
                      {/* Botón de Menú de Tres Puntos */}
                      <div className="relative product-menu-container shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductMenu(product.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center active:scale-90 transition-all text-[#1A1A3A] hover:bg-black/5 rounded-lg"
                        >
                          <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                          {activeProductMenu === product.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                              {/* Opción VER */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); navigate(`/perfil-producto?id=${product.id}`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056B3]">
                                  <ExternalLink size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#1A1A3A]">Ver Anuncio</span>
                              </button>

                              {/* Opción EDITAR */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); navigate(`/anunciar?edit=${product.id}`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#10B981]">
                                  <Edit2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#1A1A3A]">Editar Anuncio</span>
                              </button>

                              {/* Opción SUSPENDER / ACTIVAR */}
                              {product.status === 'inactive' ? (
                                <button 
                                  onClick={() => { setActiveProductMenu(null); handleToggleStatus(product.id, 'inactive'); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#10B981]">
                                    <CheckCircle2 size={16} />
                                  </div>
                                  <span className="text-sm font-bold text-[#1A1A3A]">Reactivar</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setActiveProductMenu(null); handleToggleStatus(product.id, 'active'); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#F59E0B]">
                                    <EyeOff size={16} />
                                  </div>
                                  <span className="text-sm font-bold text-[#1A1A3A]">Suspender</span>
                                </button>
                              )}

                              <div className="mx-4 my-1 h-px bg-gray-100" />

                              {/* Opción BORRAR */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); handleDeleteProduct(product.id); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#D90429]">
                                  <Trash2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#D90429]">Eliminar</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {!isDesktop && (
                      <span className="text-[13px] md:text-sm font-black text-[#0056B3] mt-1">
                        {product.price === 'Consultar' ? 'Consultar' : `${Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Categoría: NO ACTIVOS */}
      <div className={isDesktop ? "bg-white/25 rounded-[28px] p-5 border border-white/60 shadow-[inset_1px_1px_4px_rgba(163,177,198,0.2)]" : ""}>
        <div className={`flex items-center justify-between ${isDesktop ? "mb-3 pb-3 border-b border-white/50" : "mb-4"}`}>
          <h3 className="text-[10px] sm:text-xs font-black text-[#D90429] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#D90429]/60 rounded-full" />
            No Activos ({inactiveProducts.length})
          </h3>
          {isDesktop && inactiveProducts.length > 0 && (
            <span className="text-[10px] font-bold text-[#1A1A3A]/30 uppercase tracking-widest">
              {inactiveProducts.length} suspendido{inactiveProducts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className={`${isDesktop ? "space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar scroll-smooth" : "space-y-4"}`}>
          {inactiveProducts.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">No tienes anuncios suspendidos.</p>
          ) : (
            inactiveProducts.map(product => (
              <div key={product.id} className={`bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex items-center gap-3 opacity-70 transition-transform hover:scale-[1.01] ${isDesktop ? 'p-3 rounded-2xl' : 'p-3.5 md:p-5 rounded-[1.5rem] md:rounded-[2rem] flex-col sm:flex-row'}`}>
                <div className={isDesktop ? 'contents' : 'flex items-start gap-4 w-full'}>
                  <img 
                    src={product.image || product.images?.[0] || 'https://via.placeholder.com/150'} 
                    alt={product.name}
                    className={`rounded-xl object-cover grayscale bg-white shadow-sm flex-shrink-0 ${isDesktop ? 'w-12 h-12' : 'w-14 h-14 md:w-16 md:h-16'}`}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className={`flex gap-2 ${isDesktop ? 'items-center justify-between' : 'justify-between items-start'}`}>
                      <span className={`font-bold text-gray-500 leading-tight ${isDesktop ? 'text-sm truncate flex-1' : 'text-sm md:text-base line-clamp-2'}`}>
                        {product.name || product.title}
                      </span>
                      {isDesktop && (
                        <span className="text-sm font-black text-gray-400 shrink-0 tabular-nums">
                          {product.price === 'Consultar' ? 'Consultar' : `${Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                        </span>
                      )}
                      {/* Botón de Menú de Tres Puntos */}
                      <div className="relative product-menu-container shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductMenu(product.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center active:scale-90 transition-all text-[#1A1A3A] hover:bg-black/5 rounded-lg"
                        >
                          <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                          {activeProductMenu === product.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 overflow-hidden"
                            >
                              {/* Opción VER */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); navigate(`/perfil-producto?id=${product.id}`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056B3]">
                                  <ExternalLink size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#1A1A3A]">Ver Anuncio</span>
                              </button>

                              {/* Opción EDITAR */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); navigate(`/anunciar?edit=${product.id}`); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#10B981]">
                                  <Edit2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#1A1A3A]">Editar Anuncio</span>
                              </button>

                              {/* Opción SUSPENDER / ACTIVAR */}
                              {product.status === 'inactive' ? (
                                <button 
                                  onClick={() => { setActiveProductMenu(null); handleToggleStatus(product.id, 'inactive'); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#10B981]">
                                    <CheckCircle2 size={16} />
                                  </div>
                                  <span className="text-sm font-bold text-[#1A1A3A]">Reactivar</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setActiveProductMenu(null); handleToggleStatus(product.id, 'active'); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#F59E0B]">
                                    <EyeOff size={16} />
                                  </div>
                                  <span className="text-sm font-bold text-[#1A1A3A]">Suspender</span>
                                </button>
                              )}

                              <div className="mx-4 my-1 h-px bg-gray-100" />

                              {/* Opción BORRAR */}
                              <button 
                                onClick={() => { setActiveProductMenu(null); handleDeleteProduct(product.id); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#D90429]">
                                  <Trash2 size={16} />
                                </div>
                                <span className="text-sm font-bold text-[#D90429]">Eliminar</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {!isDesktop && (
                      <span className="text-[13px] md:text-sm font-black text-gray-400 mt-1">
                        {product.price === 'Consultar' ? 'Consultar' : `${Number(product.price).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                      </span>
                    )}
                  </div>
                  {!isDesktop && <span className="px-2 py-0.5 rounded-full bg-[#D90429]/10 text-[9px] font-black text-[#D90429] uppercase tracking-tighter shrink-0 border border-[#D90429]/20 hidden xs:block">Suspendido</span>}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#E0E5EC] pb-32 md:pb-12 pt-[20px] px-6 font-sans">
      <div className="w-full max-w-[1400px] mx-auto md:flex md:gap-8 lg:gap-12 items-start justify-center">

        {/* COLUMNA IZQUIERDA (Perfil) */}
        <div className="w-full max-w-md mx-auto md:mx-0 md:w-[350px] lg:w-[400px] shrink-0">
        
        {/* Cabecera Soft UI Principal */}
        <div className="bg-[#E0E5EC] rounded-[40px] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] flex flex-col items-center mb-10">
          
          {/* Avatar Section */}
          <div className="relative mb-6 flex flex-col items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div 
              onClick={handleEditAvatar}
              className="w-32 h-32 rounded-full p-1.5 bg-[#E0E5EC] shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border-4 border-white cursor-pointer overflow-hidden flex items-center justify-center group"
            >
              {isUploading ? <Loader2 className="animate-spin text-[#0056B3]" /> : 
               userAvatar ? <img src={userAvatar} className="w-full h-full object-cover rounded-full" /> : 
               <User size={60} className="text-gray-300" />}
              {!showCropper && (
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </div>

            {showCropper && photoPreview && (
              <div className="w-full mt-4">
                <AvatarCropper 
                  image={photoPreview} 
                  onApply={handleCropApply} 
                  onCancel={() => { setShowCropper(false); setPhotoPreview(null); }}
                />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-black text-[#1A1A3A] mb-1 flex items-center justify-center gap-2 group cursor-pointer" onClick={() => { 
            const defaultName = userData?.name || (currentUser?.displayName ? currentUser.displayName.split(' ')[0] : '');
            const defaultLastName = userData?.lastName || (currentUser?.displayName ? currentUser.displayName.substring(currentUser.displayName.indexOf(' ') + 1) : '');
            setNewName(defaultName); 
            setNewLastName(defaultLastName === defaultName ? '' : defaultLastName); 
            setShowNameModal(true); 
          }}>
            {displayName}
            {isGoogleLogin && <FcGoogle size={18} className="translate-y-[1px]" title="Conectado con Google" />}
            <Edit2 size={16} className="text-[#1A1A3A]/40 transition-colors hover:text-[#0056B3] ml-1" />
          </h1>
          
          {userData?.verificationStatus === 'approved' ? (
            <div className="flex items-center gap-[6px] bg-[#22a06b] px-[12px] py-[5px] rounded-full mb-6 max-w-fit cursor-help" title="Identidad confirmada">
              <ShieldCheck size={13} color="#ffffff" />
              <span className="text-[11px] font-medium uppercase text-white tracking-[0.8px]">
                Pana Verificado
              </span>
            </div>
          ) : userData?.verificationStatus === 'pending' ? (
            <div className="flex items-center gap-1.5 bg-[#FFB400]/10 px-4 py-1.5 rounded-full mb-6 border border-[#FFB400]/20 cursor-help" title="Estamos revisando tu solicitud">
              <Clock size={14} className="text-[#FFB400]" />
              <span className="text-[10px] font-black uppercase text-[#FFB400] tracking-wider">
                Verificación en proceso
              </span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/verificacion')}
              className="flex items-center gap-1.5 bg-[#1A1A3A] px-4 py-1.5 rounded-full mb-6 active:scale-95 transition-transform shadow-[0_4px_10px_rgba(0,0,0,0.1)] group hover:bg-[#2A2A4A]"
            >
              <Shield size={14} className="text-white group-hover:text-[#FFB400] transition-colors" />
              <span className="text-[10px] font-black uppercase text-white tracking-wider">
                Verificar identidad
              </span>
            </button>
          )}

          {/* User Data List */}
          <div className="w-full space-y-1">
            <HeaderInfoItem 
              icon={Mail} 
              label="Correo Electrónico" 
              value={displayEmail} 
            />
            <HeaderInfoItem 
              icon={Globe} 
              label="País" 
              value={countryDisplayName} 
            />
            <HeaderInfoItem 
              icon={MapPin} 
              label={regionLabel} 
              value={userData?.region} 
              actionLabel="Editar"
              onAction={() => setShowLocationModal(true)} 
            />
            <HeaderInfoItem 
              icon={Calendar} 
              label="Fecha de Nacimiento" 
              value={userData?.birthDate} 
            />
            <HeaderInfoItem 
              icon={User} 
              label="Sexo" 
              value={userData?.gender} 
              actionLabel="Editar"
              onAction={() => setShowSexModal(true)} 
            />
            <HeaderInfoItem 
              icon={Lock} 
              label="Contraseña" 
              isPassword 
              actionLabel={isGoogleLogin ? null : "Cambiar"} 
              onAction={() => { setPwdError(''); setPwdSuccess(false); setPwdForm({ current: '', next: '', confirm: '' }); setShowPasswordModal(true); }} 
            />
            <HeaderInfoItem 
              icon={Bell} 
              label="Notificaciones Push" 
              value={permission === 'granted' ? 'Activadas y Listas' : 'Desactivadas'} 
              actionLabel={permission === 'granted' ? null : "Activar"} 
              onAction={async () => {
                const token = await requestPermission();
                if (token) alert('¡Notificaciones activadas exitosamente!');
                else alert('Por favor, permite el acceso a notificaciones en tu navegador/dispositivo.');
              }} 
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
                
                {/* Módulo Mis Anuncios */}
                {renderAdsContent(false)}
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
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                    detail: { 
                      title: '¿Cómo funciona?', 
                      content: `
                        <div class="space-y-6">
                          <p class="text-lg font-black text-[#0056B3]">¡Sácale el jugo a Mi Pana! Guía paso a paso 🚀</p>
                          <p class="text-sm font-medium text-[#555577] leading-relaxed">Bienvenido a tu nueva herramienta de crecimiento. Usar Mi Pana es tan sencillo como enviar un mensaje, pero aquí te explicamos cómo aprovechar cada rincón de la app.</p>

                          <div class="space-y-4 pt-2">
                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#FFD700] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">1.</span> Encuentra lo que buscas 🔍</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">En la pantalla de Inicio, verás la barra: <b>“¿Qué necesitas, pana?”</b>.<br/><br/><b>Cómo usarla:</b> Escribe una palabra clave (ej. "Cachapas", "Mecánico") y la app te mostrará las mejores opciones cerca de ti.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#0056B3] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">2.</span> Publica tu primer anuncio ➕</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">¿Tienes un talento o un producto? <b>Dale al botón "+" (ANUNCIAR)</b> en el centro del menú inferior.<br/><br/><i class="text-[#0056B3] font-bold">El secreto: Sube fotos claras y describe tu servicio con honestidad. ¡La confianza es la clave!</i></p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#1A1A3A] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">3.</span> Gestiona tu negocio 📋</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Si ya publicaste, busca la sección <b>Mis Anuncios</b> en tu perfil. Allí verás cuántas personas han visto tu publicación y podrás editar el precio o pausarla si te quedaste sin stock.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-red-400 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">4.</span> Guarda tus favoritos ❤️</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Pulsando el <b>Corazón</b> en cualquier anuncio, se guardará automáticamente en tu sección de Favoritos del menú inferior.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-green-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">5.</span> Conecta directo por Mensajes 💬</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Dentro de cualquier anuncio verás un botón para contactar. Se abrirá un <b>Chat Privado</b> donde podrás acordar detalles y entregas de forma segura.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-purple-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">6.</span> Tu Perfil: Tu carta de presentación 👤</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Mantén tu perfil al día y gestiona tu <b>Verificación</b>. Una cuenta verificada vende hasta 3 veces más.</p>
                            </div>
                          </div>

                          <div class="mt-6 p-5 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-[25px] flex items-start gap-4 shadow-sm">
                            <span class="text-2xl">💡</span>
                            <div>
                              <p class="font-black text-[#1A1A3A] text-sm">Consejo Pro:</p>
                              <p class="text-[12px] text-[#555577] mt-1 font-bold">¡La rapidez en responder te hace destacar! Revisa tus notificaciones para no perderte clientes.</p>
                            </div>
                          </div>
                        </div>
                      ` 
                    } 
                  }))}
                  className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
                >
                  <Info size={16}/> ¿Cómo Funciona?
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                    detail: { 
                      title: 'Sobre Mi Pana', 
                      content: `
                        <div class="space-y-4">
                          <p class="text-lg font-black text-[#0056B3]">Mucho más que una App, somos tu Comunidad 🇻🇪</p>
                          <p><b>¿Qué es Mi Pana?</b> Es ese abrazo que te da un paisano cuando llegas a una ciudad nueva. Es la respuesta a la pregunta: “¿Dónde puedo conseguir lo que necesito?” y la oportunidad de decir: “Aquí estoy, esto es lo que sé hacer”.</p>
                          <p>Mi Pana nació de una idea simple pero poderosa: <b>que ningún venezolano en el exterior se sienta solo en su emprendimiento</b>. Somos el punto de encuentro donde el talento que salió de nuestras fronteras se encuentra con quienes quieren apoyarlo.</p>
                          
                          <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#FFD700] my-4 shadow-sm">
                            <p class="font-bold text-[#1A1A3A] mb-1">¿De qué va nuestra plataforma?</p>
                            <p class="text-sm">Aquí no solo intercambiamos productos o servicios; intercambiamos historias de superación.</p>
                          </div>

                          <ul class="space-y-4">
                            <li class="flex gap-3">
                              <span class="text-[#0056B3]">💎</span>
                              <span><b>Es tu vitrina al mundo:</b> Si cocinas con sazón de hogar, si eres el mejor reparando lo que otros dan por perdido, o si ofreces servicios profesionales con sello de excelencia, este es tu lugar para brillar.</span>
                            </li>
                            <li class="flex gap-3">
                              <span class="text-[#0056B3]">🤝</span>
                              <span><b>Es confianza compartida:</b> Creamos un espacio seguro donde saber que, detrás de cada anuncio, hay un "Pana" trabajando duro por sus sueños, igual que tú.</span>
                            </li>
                            <li class="flex gap-3">
                              <span class="text-[#0056B3]">💪</span>
                              <span><b>Es nuestra red de apoyo:</b> Queremos que prosperes. Por eso, nos esfuerzo en conectar tus manos trabajadoras con las necesidades de nuestra gente y de la comunidad que nos recibe.</span>
                            </li>
                          </ul>

                          <div class="mt-8 p-5 bg-[#1A1A3A] rounded-[22px] text-white">
                            <p class="font-black text-lg mb-2">Nuestra Razón de Ser</p>
                            <p class="text-sm leading-relaxed opacity-90">Creemos que el venezolano no solo emigra, sino que lleva a Venezuela consigo. En cada rincón del mundo hay un emprendedor echando pa' lante, y Mi Pana existe para ser el impulso que necesitas.</p>
                          </div>

                          <p class="text-center font-black text-xl text-[#0056B3] mt-8 pt-4 border-t border-gray-100">Mi Pana: ¡Echa pa' lante, aquí estamos contigo!</p>
                        </div>
                      `
                    } 
                  }))}
                  className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
                >
                  <User size={16}/> Sobre Mi Pana
                </button>
                <button 
                  onClick={() => {
                    if (userData?.verificationStatus !== 'approved' && userData?.verificationStatus !== 'pending') {
                      navigate('/verificacion');
                    }
                  }}
                  className={`flex items-center justify-between w-full p-3 text-sm font-bold rounded-xl transition-colors ${
                    userData?.verificationStatus === 'approved' || userData?.verificationStatus === 'pending'
                      ? 'text-[#1A1A3A]/40 cursor-default'
                      : 'text-[#555577] hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16}/> Verificación Mi Pana
                  </div>
                  {userData?.verificationStatus === 'approved' ? (
                    <CheckCircle2 size={16} className="text-[#00C97A]" />
                  ) : userData?.verificationStatus === 'pending' ? (
                    <Clock size={16} className="text-[#FFB400]" />
                  ) : null}
                </button>
              </div>
            )}
          </div>

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
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))}
                className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
              >
                <Phone size={16}/> Contactar
              </button>
                <button 
                  onClick={() => openLegal('terms')}
                  className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
                >
                  <HelpCircle size={16}/> Condiciones de Contratación
                </button>
                <button 
                  onClick={() => openLegal('privacy')}
                  className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
                >
                  <Lock size={16}/> Políticas de Privacidad
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                    detail: { 
                      title: 'Seguridad Mi Pana', 
                      content: `
                        <div class="space-y-6">
                          <p class="text-lg font-black text-[#D90429] flex items-center gap-2">Tu seguridad es nuestra prioridad 🛡️</p>
                          <p class="text-sm font-medium text-[#555577] leading-relaxed">En Mi Pana, trabajamos para construir un entorno confiable, pero la seguridad la hacemos entre todos.</p>

                          <div class="space-y-4 pt-2">
                            <div class="bg-blue-50 p-4 rounded-2xl border-l-4 border-[#0056B3] shadow-sm">
                              <p class="font-black text-[#1A1A3A] text-sm mb-2">1. Consejos para Compradores</p>
                              <ul class="space-y-3 text-[12px] text-[#555577] leading-relaxed">
                                <li><b>Verifica:</b> Prioriza anuncios con el sello de <b>"Verificación Mi Pana"</b>.</li>
                                <li><b>Desconfía:</b> Si un precio es demasiado bajo, investiga más antes de avanzar.</li>
                                <li><b>Pagos:</b> Recomendamos no adelantar dinero sin contacto previo claro por chat.</li>
                              </ul>
                            </div>

                            <div class="bg-orange-50/50 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] text-sm mb-2">2. Consejos para Emprendedores</p>
                              <ul class="space-y-3 text-[12px] text-[#555577] leading-relaxed">
                                <li><b>Protección:</b> Nunca compartas contraseñas o datos bancarios sensibles.</li>
                                <li><b>Entregas:</b> Procura quedar en lugares concurridos y horarios diurnos.</li>
                              </ul>
                            </div>

                            <div class="bg-red-50 p-4 rounded-2xl border-l-4 border-[#D90429] shadow-sm">
                              <p class="font-black text-[#D90429] text-sm mb-2">3. Comportamientos sospechosos 🚩</p>
                              <p class="text-[11px] text-[#555577] font-bold italic mb-2">Mantente alerta si alguien:</p>
                              <ul class="space-y-2 text-[12px] text-[#555577] list-disc ml-4">
                                <li>Te presiona para cerrar el trato fuera de la app inmediatamente.</li>
                                <li>Envía enlaces extraños o solicita códigos de tu teléfono.</li>
                                <li>Su lenguaje es inconsistente o evita preguntas directas.</li>
                              </ul>
                            </div>
                          </div>

                          <div class="mt-6 p-5 bg-[#1A1A3A] rounded-[25px] text-white shadow-clay">
                            <p class="font-black text-lg mb-2">Nuestro compromiso</p>
                            <p class="text-[12px] leading-relaxed opacity-90">Detectamos actividades inusuales, pero tu reporte es vital. Usa el botón <b>"Informar sobre Anuncio"</b> y revisaremos el caso de inmediato.</p>
                          </div>

                          <p class="text-center font-black text-xs text-[#8888AA] mt-8 italic px-4 leading-relaxed">Navega con confianza, pero siempre con sentido común. ¡En Mi Pana nos cuidamos!</p>
                        </div>
                      ` 
                    } 
                  }))}
                  className="flex items-center gap-3 p-3 text-sm font-bold text-[#555577] hover:bg-white/50 rounded-xl transition-colors"
                >
                  <ShieldAlert size={16}/> Seguridad
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Redes Sociales Footer - Solo visibles en Móvil */}
        <div className="md:hidden flex justify-center gap-4 mt-12 mb-8">
          {[
            { icon: FaXTwitter, url: 'https://x.com/mi_pana_app' },
            { icon: FaInstagram, url: 'https://www.instagram.com/mi_pana_app/' },
            { icon: FaFacebookF, url: 'https://www.facebook.com/profile.php?id=61578713983690' },
            { icon: FaYoutube, url: 'https://www.youtube.com/@MiPanaApp' },
            { icon: FaTiktok, url: 'https://www.tiktok.com/@mi_pana_app' }
          ].map((item, i) => (
            <a 
              key={i} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E0E5EC] shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] text-[#1A1A3A] active:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] transition-all"
            >
              <item.icon size={20} />
            </a>
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

      {/* COLUMNA DERECHA: DASHBOARD DESKTOP */}
      <div className="hidden md:flex flex-col flex-1 w-full min-w-0 bg-[#E0E5EC] rounded-[40px] p-8 lg:p-10 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
        <h2 className="text-xl lg:text-2xl font-black text-[#1A1A3A] mb-8 pb-4 border-b border-white/50 flex flex-col gap-1">
          Dashboard de Anuncios
          <span className="text-[11px] lg:text-[13px] font-bold text-gray-400 uppercase tracking-widest">
            Gestión y Rendimiento
          </span>
        </h2>
        
        {renderAdsContent(true)}
      </div>

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
              className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-[#1A1A3A]">{regionLabel}</h3>
                <button onClick={() => setShowLocationModal(false)} className="w-10 h-10 rounded-full bg-[#E0E5EC] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] flex items-center justify-center text-gray-400"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3">
                  {LOCATION_DATA[userCountryCode]?.data ? Object.keys(LOCATION_DATA[userCountryCode].data).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRegionSelect(r)}
                      className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${userData?.region === r ? 'bg-[#1A1A3A] text-white shadow-lg' : 'bg-[#E0E5EC] text-[#1A1A3A] shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] hover:scale-[1.02]'}`}
                    >
                      {r}
                    </button>
                  )) : (
                    <p className="text-sm text-center text-gray-400 p-4 font-bold">No hay regiones configuradas para este país.</p>
                  )}
                </div>
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
                    placeholder="Ej: Pedro"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Apellido (Opcional)</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full p-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                    placeholder="Ej: Pérez"
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
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 -mx-2 space-y-3 pb-4 pt-1">
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

      {/* Modal Cambio de Contraseña */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-[#E0E5EC]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#E0E5EC] rounded-[2rem] p-6 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] relative z-10 flex flex-col"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#E0E5EC] text-[#1A1A3A] hover:text-[#D90429] shadow-[4px_4px_8px_rgba(163,177,198,0.5),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4)] transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-black text-[#1A1A3A] mb-1 pl-1">Cambiar Contraseña</h2>
              <p className="text-xs font-bold text-[#8888AA] mb-5 pl-1">Introduce tu contraseña actual y la nueva.</p>
              
              {pwdSuccess ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck size={28} className="text-green-600" />
                  </div>
                  <p className="font-black text-green-700 text-center">¡Contraseña actualizada!</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Contraseña actual */}
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Contraseña actual</label>
                    <div className="relative">
                      <input
                        type={showPwdCurrent ? 'text' : 'password'}
                        value={pwdForm.current}
                        onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                        required
                        className="w-full p-4 pr-12 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPwdCurrent(!showPwdCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40">
                        {showPwdCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                  {/* Nueva contraseña */}
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Nueva contraseña</label>
                    <div className="relative">
                      <input
                        type={showPwdNext ? 'text' : 'password'}
                        value={pwdForm.next}
                        onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
                        required
                        minLength={8}
                        className="w-full p-4 pr-12 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                        placeholder="Mín. 8 caracteres"
                      />
                      <button type="button" onClick={() => setShowPwdNext(!showPwdNext)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40">
                        {showPwdNext ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                  {/* Confirmar */}
                  <div>
                    <label className="text-[10px] font-black tracking-widest uppercase text-[#1A1A3A] ml-2 mb-1 block">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={pwdForm.confirm}
                      onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                      required
                      className="w-full p-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] text-[#1A1A3A] font-bold outline-none focus:ring-2 focus:ring-[#0056B3]/40 transition-all placeholder:text-[#1A1A3A]/30"
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>
                  {pwdError && (
                    <p className="text-[#D90429] text-xs font-bold text-center px-2">{pwdError}</p>
                  )}
                  <button 
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full mt-2 py-4 rounded-full bg-[#1A1A3A] text-white font-black uppercase text-sm shadow-[0_10px_20px_rgba(26,26,58,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {pwdLoading ? <><Loader2 size={18} className="animate-spin" /> Cambiando...</> : 'Guardar Nueva Contraseña'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LegalDrawer 
        isOpen={legalDocs.isOpen} 
        onClose={() => setLegalDocs({ ...legalDocs, isOpen: false })} 
        title={legalDocs.title} 
        content={legalDocs.content} 
      />
    </div>
  );
}
