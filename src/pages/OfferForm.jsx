import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { sortCategories } from '../data/categories';
import { useCategoryStore } from '../store/useCategoryStore';

export default function OfferForm() {
  const [step, setStep] = useState(1);
  const { categories } = useCategoryStore();

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: JSON.parse(localStorage.getItem('mipana-draft')) || {}
  });

  const formValues = watch();

  // Auto-save every 30s or when values change (simplified for UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('mipana-draft', JSON.stringify(formValues));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formValues]);

  const processSearchData = (formData) => {
    const searchSet = new Set();
    
    if (formData.keywords) {
       const manualKeywords = formData.keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
       manualKeywords.forEach(k => searchSet.add(k));
    }
    
    // Aplicamos prefijos al nombre de la oferta para búsqueda predictiva
    getWords(formData.name).forEach(w => {
       generateSubstrings(w).forEach(sub => searchSet.add(sub));
    });
    
    getWords(formData.category).forEach(w => searchSet.add(w));
    getWords(formData.description).forEach(w => searchSet.add(w));
    getWords(formData.shortDesc).forEach(w => searchSet.add(w));
    
    if (formData.country) getWords(formData.country).forEach(w => searchSet.add(w));
    if (formData.province) getWords(formData.province).forEach(w => searchSet.add(w));
    if (formData.municipality) getWords(formData.municipality).forEach(w => searchSet.add(w));
    if (formData.location) {
       if (formData.location.country) getWords(formData.location.country).forEach(w => searchSet.add(w));
       if (formData.location.level1) getWords(formData.location.level1).forEach(w => searchSet.add(w));
       if (formData.location.level2) getWords(formData.location.level2).forEach(w => searchSet.add(w));
    }
    
    return Array.from(searchSet);
  };

  const onSubmit = (data) => {
    console.log("Submitting to Firebase...", data);
    
    const search_indexes = processSearchData(data);
    const finalData = { ...data, search_indexes };
    
    console.log("Data ready to save with search_indexes:", finalData);
    // Here we would upload to Firebase Storage & Firestore using finalData
    
    localStorage.removeItem('mipana-draft');
    alert("¡Oferta publicada exitosamente! 🎉");
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-pana-blue">Paso 1: Categoría</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(c => (
                <div 
                   key={c.id}
                   onClick={() => setValue('category', c.label)}
                   className={`p-4 rounded-xl border-2 text-center font-bold transition-all cursor-pointer ${formValues.category === c.label ? 'border-pana-yellow bg-pana-gold/20 text-pana-blue' : 'border-gray-200 text-gray-500 bg-white'}`}
                >
                   {c.label}
                </div>
              ))}
            </div>
            {errors.category && <span className="text-red-500 text-xs">Selecciona una categoría</span>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-pana-blue">Paso 2: Información Básica</h3>
            
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Título de la Oferta</label>
              <input {...register("name", { required: true })} className="w-full h-12 px-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-pana-yellow outline-none font-medium" placeholder="Ej: Tequeños caseros..." />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción Corta (Max 120)</label>
              <input {...register("shortDesc", { required: true, maxLength: 120 })} className="w-full h-12 px-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-pana-yellow outline-none font-medium" placeholder="Resumen atractivo..." />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Descripción Detallada</label>
              <textarea {...register("description", { required: true })} className="w-full p-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-pana-yellow outline-none font-medium h-32 resize-none" placeholder="Explica tu servicio al detalle..." />
            </div>
          </div>
        );
      case 3:
        return (
           <div className="space-y-4">
            <h3 className="text-xl font-black text-pana-blue">Paso 3: Fotos (Max 10)</h3>
            <div className="w-full h-40 border-2 border-dashed border-pana-yellow rounded-2xl bg-pana-gold/5 flex flex-col items-center justify-center text-pana-blue cursor-pointer">
              <Upload className="w-8 h-8 mb-2" />
              <span className="font-bold">Sube tus mejores fotos</span>
              <span className="text-xs text-gray-500 mt-1">La primera será la de portada</span>
            </div>
            {/* Mock preview of uploaded photos */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
               {[1,2,3].map(i => <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 animate-pulse"></div>)}
            </div>
          </div>
        );
      case 4:
         return (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-pana-blue">Paso 4: Contacto</h3>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">WhatsApp (+34...)</label>
              <input {...register("whatsapp", { required: true })} className="w-full h-12 px-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-pana-yellow outline-none font-medium" type="tel" placeholder="+34 600..." />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Keywords (separadas por coma)</label>
              <input {...register("keywords")} className="w-full h-12 px-4 rounded-xl bg-gray-50 focus:ring-2 focus:ring-pana-yellow outline-none font-medium" placeholder="tequeños, arepas, comida..." />
            </div>
          </div>
        );
      case 5:
         return (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-pana-blue">Paso 5: Resumen</h3>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
              <p><strong>Categoría:</strong> {formValues.category || 'No seleccionada'}</p>
              <p><strong>Título:</strong> {formValues.name || 'Sin título'}</p>
              <p><strong>WhatsApp:</strong> {formValues.whatsapp || 'Sin especificar'}</p>
            </div>
            
            <div className="flex items-start gap-2 bg-[#E8FFF2] p-4 rounded-xl border border-[#A7E9C4]">
               <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
               <p className="text-xs text-green-800 font-medium">Al publicar, aceptas los Términos y Condiciones de MiPana. Tu oferta pasará por nuestro sistema de calidad.</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-pana-bg pt-24 pb-32 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-pana-blue">Publica tu Oferta</h1>
        
        {/* Progress Bar UX */}
        <div className="flex justify-between mt-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-200 -translate-y-1/2 rounded-full z-0"></div>
          <div className="absolute top-1/2 left-0 h-1.5 bg-pana-yellow -translate-y-1/2 rounded-full z-0 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
          
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${step >= i ? 'bg-pana-yellow text-pana-blue shadow-md' : 'bg-gray-200 text-gray-400'}`}>
              {i}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-neumorphic-soft rounded-3xl p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 pb-safe-bottom z-30 flex gap-4">
        {step > 1 && (
          <button onClick={prevStep} className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center shadow-inner active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {step < 5 ? (
          <button onClick={nextStep} className="flex-grow h-14 bg-pana-blue text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 shadow-md">
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSubmit(onSubmit)} className="flex-grow h-14 bg-pana-yellow text-pana-blue rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_15px_rgba(255,180,0,0.4)]">
            <CheckSquare className="w-5 h-5" /> Publicar Ahora
          </button>
        )}
      </div>
    </div>
  );
}
