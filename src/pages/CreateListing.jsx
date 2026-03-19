import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, ChevronLeft, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIAS = [
  { id: 1, name: 'Servicios' },
  { id: 2, name: 'Comida' },
  { id: 3, name: 'Envíos' },
  { id: 4, name: 'Belleza' },
  { id: 5, name: 'Transporte' }
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({ title: '', category: 1, price: '', whatsapp: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleImageClick = () => fileInputRef.current.click();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('La imagen debe pesar menos de 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Sube al menos una foto para tu anuncio.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Subir la imagen a Firebase Storage
      // Ruta: images/userId/randomString-filename.jpg
      const fileExtension = imageFile.name.split('.').pop();
      const randomID = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
      const storageRef = ref(storage, `images/${user.uid}/${randomID}.${fileExtension}`);
      
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Guardar el documento en Firestore
      const newProduct = {
        name: form.title,
        price: form.price,
        category: Number(form.category),
        whatsapp: form.whatsapp,
        description: form.description,
        image: downloadURL,
        userId: user.uid,
        userName: user.displayName || 'Pana',
        createdAt: serverTimestamp(),
        // Datos iniciales de un anuncio nuevo
        rating: 5.0,
        reviewCount: 0,
        premium: false,
        verified: false,
      };

      await addDoc(collection(db, 'products'), newProduct);

      // ¡Éxito!
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
          
          {/* UPLOAD IMAGEN (Claymorphism gigante) */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Foto Principal *</span>
            <div 
              onClick={handleImageClick}
              className={`relative overflow-hidden w-full h-56 bg-[#E0E5EC] rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-[#E0E5EC] ${
                imagePreview 
                  ? 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
                  : 'shadow-[inset_8px_8px_16px_rgba(163,177,198,0.6),inset_-8px_-8px_16px_rgba(255,255,255,0.8)]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
                disabled={loading}
              />
              
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removeImage}
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

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a3b1c6]/30 to-transparent my-2" />

          {/* TITULO */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">¿Qué anuncias? *</span>
            <input
              type="text"
              required
              maxLength={45}
              disabled={loading}
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Ej: Tequeños caseros 50 uds"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
          </div>

          {/* CATEGORIA y PRECIO (Grilla de 2 columnas) */}
          <div className="flex gap-4">
            <div className="flex-col gap-2 flex-1 flex">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Categoría *</span>
              <div className="relative">
                <select
                  required
                  disabled={loading}
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full h-14 px-5 appearance-none bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {/* Arrow down icon */}
                <div className="absolute right-4 top-5 pointer-events-none opacity-50">
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-col gap-2 w-[120px] flex">
              <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Precio (€) *</span>
              <input
                type="number"
                required
                min="0"
                disabled={loading}
                value={form.price}
                onChange={(e) => setForm({...form, price: e.target.value})}
                placeholder="0.00"
                className="w-full h-14 px-4 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-black placeholder:text-gray-400/70 text-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all text-center"
              />
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">WhatsApp de Contacto *</span>
            <input
              type="tel"
              required
              disabled={loading}
              value={form.whatsapp}
              onChange={(e) => setForm({...form, whatsapp: e.target.value})}
              placeholder="+34 600 000 000"
              className="w-full h-14 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-base focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all"
            />
          </div>

          {/* DESCRIPCION */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-[#1A1A3A]/70 ml-2">Descripción Corta</span>
            <textarea
              disabled={loading}
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Detalles sobre lo que ofreces, ubicación, envíos, etc..."
              className="w-full h-32 p-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/10 transition-all resize-none"
            />
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
