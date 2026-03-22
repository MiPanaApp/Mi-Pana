import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, ChevronLeft, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDoc, getDocs, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChevronDown, Tag } from 'lucide-react';
import { FiCoffee, FiPackage, FiSmile, FiMonitor, FiTool, FiShoppingBag, FiBriefcase, FiHeart, FiGift, FiTruck, FiScissors } from 'react-icons/fi';



const COUNTRY_CODES = [
  { code: '+34', flag: '🇪🇸', name: 'España' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+1', flag: '🇩🇴', name: 'Rep. Dom.' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const mainInputRef = useRef(null);
  const carouselInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', category: '', price: '', whatsapp: '', description: '', keywords: '' });
  const [categories, setCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState(COUNTRY_CODES[0]);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [carouselFiles, setCarouselFiles] = useState([]);
  const [carouselPreviews, setCarouselPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);

        if (!isMounted) return;

        let cats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrar duplicados en el cliente por si acaso (evita mostrar repetidos si la DB está sucia)
        const uniqueCats = [];
        const seenNames = new Set();
        cats.forEach(c => {
          if (!seenNames.has(c.name)) {
            seenNames.add(c.name);
            uniqueCats.push(c);
          }
        });
        cats = uniqueCats;

        // Seeding si no hay ninguna
        if (cats.length === 0) {
          const defaultCats = ['Servicios', 'Comida', 'Envíos', 'Belleza', 'Transporte', 'Venta Garaje'];
          const newCats = [];

          for (const name of defaultCats) {
            // Verificamos por si otra instancia ya la creó
            const checkQ = query(collection(db, 'categories'), where('name', '==', name));
            const checkSnap = await getDocs(checkQ);
            if (checkSnap.empty) {
              const docRef = await addDoc(collection(db, 'categories'), { name });
              newCats.push({ id: docRef.id, name });
            }
          }
          if (newCats.length > 0) cats = newCats;
        }

        setCategories(cats);
        if (cats.length > 0) {
          setForm(prev => ({ ...prev, category: cats[0].name }));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // Fetch User Custom Default Country/Prefix
  useEffect(() => {
    if (!user) return;
    const fetchUserCountry = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.country) {
            // "🇪🇸 España" -> match "España"
            const countryName = userData.country.split(' ').slice(1).join(' ');
            const matchedPrefix = COUNTRY_CODES.find(c => c.name === countryName);
            if (matchedPrefix) setSelectedPrefix(matchedPrefix);
          }
        }
      } catch (err) {
        console.error("Error fetching user country:", err);
      }
    };
    fetchUserCountry();
  }, [user]);

  // Función para obtener icono y color según el nombre
  const getCategoryStyle = (name, index) => {
    const iconMap = {
      'Comida': FiCoffee,
      'Envíos': FiPackage,
      'Belleza': FiSmile,
      'Tecnología': FiMonitor,
      'Servicios': FiTool,
      'Ropa': FiShoppingBag,
      'Legal': FiBriefcase,
      'Salud': FiHeart,
      'Transporte': FiTruck,
      'Venta Garaje': FiGift,
      'Otros': Tag
    };

    // Colores de la marca: Azul, Amarillo, Rojo
    const colors = ['#0056B3', '#FFB400', '#D90429'];
    const color = colors[index % 3];
    const Icon = iconMap[name] || Tag;

    return { Icon, color };
  };

  const selectedStyle = getCategoryStyle(form.category, categories.findIndex(c => c.name === form.category));

  const handleMainClick = () => mainInputRef.current.click();
  const handleCarouselClick = () => carouselInputRef.current.click();

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen principal debe pesar menos de 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleCarouselChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = carouselFiles.length + files.length;

    if (totalCount > 10) {
      setError('Puedes subir hasta un máximo de 10 fotos adicionales.');
      return;
    }

    const newFiles = [...carouselFiles];
    const newPreviews = [...carouselPreviews];

    files.forEach(file => {
      if (file.size < 5 * 1024 * 1024) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      } else {
        setError('Alguna imagen del carrusel supera los 5MB y no se añadió.');
      }
    });

    setCarouselFiles(newFiles);
    setCarouselPreviews(newPreviews);
    setError('');
  };

  const removeMainImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const removeCarouselItem = (index) => {
    const newFiles = [...carouselFiles];
    const newPreviews = [...carouselPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setCarouselFiles(newFiles);
    setCarouselPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Sube al menos la foto principal para tu anuncio.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Fucción para subir archivos a Firebase Storage
      const uploadFile = async (file, folder) => {
        const fileExtension = file.name.split('.').pop();
        const randomID = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
        const userId = user?.uid || 'test-user-id';
        const storageRef = ref(storage, `${folder}/${userId}/${randomID}.${fileExtension}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      };

      // 2. Subir imagen principal
      const mainImageURL = await uploadFile(imageFile, 'images');

      // 3. Subir imágenes del carrusel en paralelo
      const carouselURLs = await Promise.all(
        carouselFiles.map(file => uploadFile(file, 'carousel'))
      );

      // 4. Guardar en Firestore
      const newProduct = {
        name: form.title,
        price: form.price,
        category: form.category,
        whatsapp: `${selectedPrefix.code}${form.whatsapp.replace(/\s+/g, '')}`,
        description: form.description,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
        image: mainImageURL,
        carouselImages: carouselURLs, // Array de URLs
        userId: user?.uid || 'test-user-id',
        userName: user?.displayName || 'Usuario de Prueba',
        createdAt: serverTimestamp(),
        rating: 5.0,
        reviewCount: 0,
        premium: false,
        verified: false,
      };

      await addDoc(collection(db, 'products'), newProduct);

      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 2500);

    } catch (err) {
      console.error(err);
      setError('Hubo un error al publicar tu anuncio. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 bg-[#E0E5EC] rounded-full shadow-[inset_9px_9px_18px_rgba(163,177,198,0.7),inset_-9px_-9px_18px_rgba(255,255,255,0.9)] mb-6 text-[#4CAF50]"
        >
          <CheckCircle2 size={64} strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-3xl font-black text-[#1A1A3A] mb-2">¡Anuncio Publicado!</h2>
        <p className="text-[#1A1A3A]/60 font-medium">Tu anuncio ya está visible para todos los Panas.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#E0E5EC] min-h-screen pb-32">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-[#E0E5EC]/80 backdrop-blur-xl px-4 py-4 flex items-center shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-[#E0E5EC] rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-[#1A1A3A]" />
        </button>
        <h1 className="ml-4 text-xl font-black text-[#1A1A3A] tracking-wide">Crear Anuncio</h1>
      </div>

      <div className="max-w-md mx-auto px-5 mt-6">

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-[#D90429]/10 rounded-2xl text-[#D90429] text-sm font-bold shadow-inner"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* UPLOAD IMAGEN PRINCIPAL */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Foto Principal *</span>
            <div
              onClick={handleMainClick}
              className={`relative overflow-hidden w-full h-56 bg-[#E0E5EC] rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-[#E0E5EC] ${imagePreview
                  ? 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                  : 'shadow-[inset_8px_8px_16px_rgba(163,177,198,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.8)]'
                }`}
            >
              <input
                type="file"
                ref={mainInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleMainChange}
                disabled={loading}
              />

              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="absolute top-3 right-3 p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white shadow-lg z-10"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[#1A1A3A]/40">
                  <ImagePlus size={48} strokeWidth={1.5} />
                  <span className="font-bold text-sm">Toca para subir foto</span>
                </div>
              )}
            </div>
          </div>

          {/* FOTOS DEL CARRUSEL (Máx 10) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center ml-2">
              <span className="text-sm font-bold text-[#1A1A3A]/70">Fotos del Carrusel (Max 10)</span>
              <span className="text-[10px] font-black text-[#1A1A3A]/40 uppercase tracking-widest">{carouselFiles.length} / 10</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* Previews del carrusel */}
              <AnimatePresence>
                {carouselPreviews.map((preview, index) => (
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] group"
                  >
                    <img src={preview} alt={`Carousel ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeCarouselItem(index)}
                      className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-full text-white shadow-md z-10 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Botón para añadir más (Solo si < 10) */}
              {carouselFiles.length < 10 && (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCarouselClick}
                  className="aspect-square rounded-2xl bg-[#E0E5EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center cursor-pointer text-[#1A1A3A]/30 hover:text-[#1A1A3A]/50 transition-colors"
                >
                  <ImagePlus size={24} />
                  <input
                    type="file"
                    ref={carouselInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleCarouselChange}
                    disabled={loading}
                  />
                </motion.div>
              )}
            </div>
            <p className="text-[10px] text-[#1A1A3A]/40 font-bold ml-2 italic">* Se recomienda formato cuadrado (1:1) para el carrusel.</p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a3b1c6]/30 to-transparent my-2" />

          {/* TITULO */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Titulo del Aviso (que anuncias) *</span>
            <input
              type="text"
              required
              maxLength={45}
              disabled={loading}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Tequeños caseros 50 uds"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
          </div>

          {/* DESCRIPCION (Movida debajo del título) */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-2">
              <span className="text-sm font-bold text-[#1A1A3A]/70">Descripción del Anuncio *</span>
              <span className={`text-[10px] font-bold tracking-tight ${form.description.length >= 480 ? 'text-red-500' : 'text-[#1A1A3A]/40'}`}>
                {500 - form.description.length} caracteres
              </span>
            </div>
            <textarea
              required
              maxLength={500}
              disabled={loading}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalles sobre lo que ofreces, ubicación, envíos, garantias, etc..."
              className="w-full h-40 p-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all resize-none"
            />
          </div>
          {/* KEYWORDS */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Palabras Clave (opcional)</span>
            <input
              type="text"
              disabled={loading}
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="Ej: venezolano, snack, fiesta, casero"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
            <p className="text-[10px] text-[#1A1A3A]/40 font-bold ml-2 italic">* Separa las palabras con comas para mejorar la búsqueda.</p>
          </div>
          {/* CATEGORIA y PRECIO (Grilla de 2 columnas) */}
          <div className="flex gap-4">
            <div className="flex-col gap-2 flex-1 flex relative">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Categoría *</span>

              {/* Custom Dropdown */}
              <div className="relative">
                <div
                  onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-14 px-5 flex items-center justify-between bg-[#E0E5EC] rounded-2xl cursor-pointer transition-all ${isDropdownOpen
                      ? 'shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]'
                      : 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {form.category && (
                      <selectedStyle.Icon
                        size={18}
                        style={{ color: selectedStyle.color }}
                        className="flex-shrink-0"
                      />
                    )}
                    <span className="text-[#1A1A3A] font-semibold text-base">
                      {form.category || 'Seleccionar...'}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#1A1A3A] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute left-0 right-0 top-full z-[60] mt-2 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
                    >
                      <div className="max-h-68 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                        {categories.length > 0 ? (
                          categories.map((cat, idx) => {
                            const style = getCategoryStyle(cat.name, idx);
                            const isSelected = form.category === cat.name;

                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, category: cat.name });
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between group ${isSelected
                                    ? 'bg-[#1A1A3A] text-white shadow-lg'
                                    : 'text-[#1A1A3A]/70 hover:bg-white/50'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <style.Icon
                                    size={18}
                                    style={{ color: isSelected ? '#fff' : style.color }}
                                    className="transition-colors"
                                  />
                                  {cat.name}
                                </div>
                                {isSelected && (
                                  <CheckCircle2 size={14} className="text-white" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-[#1A1A3A]/40 font-bold italic">
                            Cargando categorías...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-col gap-2 w-[120px] flex">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Precio (€) *</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                disabled={loading}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full h-14 px-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-black placeholder:text-gray-400/70 text-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all text-center"
              />
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">WhatsApp *</span>
            <div className="flex gap-2">
              {/* Prefix Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPrefixOpen(!isPrefixOpen)}
                  className="h-14 px-3 bg-[#E0E5EC] rounded-2xl shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.95)] flex items-center gap-2 font-bold text-[#1A1A3A] hover:bg-white/40 transition-all border border-white/20 active:shadow-inner"
                >
                  <span className="text-xl">{selectedPrefix.flag}</span>
                  <span className="text-sm">{selectedPrefix.code}</span>
                  <ChevronDown size={14} className={`text-[#1A1A3A]/40 transition-transform ${isPrefixOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isPrefixOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 10, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 bottom-full z-[70] w-64 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden mb-1 p-2"
                    >
                      <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {COUNTRY_CODES.map((item) => (
                          <button
                            key={item.name + item.code}
                            type="button"
                            onClick={() => {
                              setSelectedPrefix(item);
                              setIsPrefixOpen(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${selectedPrefix.name === item.name
                                ? 'bg-[#1A1A3A] text-white'
                                : 'text-[#1A1A3A]/70 hover:bg-white/80'
                              }`}
                          >
                            <span className="text-xl">{item.flag}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{item.code}</span>
                              <span className="text-sm font-bold opacity-80">{item.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="tel"
                required
                disabled={loading}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                placeholder="600 000 000"
                className="flex-1 h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
              />
            </div>
          </div>



          {/* BOTON SUBMIT */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            type="submit"
            className="w-full h-16 mt-4 bg-[#1A1A3A] text-white font-black text-xl tracking-wide rounded-2xl shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-75 disabled:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              'Publicar Anuncio 🚀'
            )}
          </motion.button>

        </form>
      </div>
    </div>
  );
}
