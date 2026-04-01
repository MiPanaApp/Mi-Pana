import { translateFirebaseError } from "../../utils/authErrors";
import { LOCATION_DATA } from "../../data/locations";
import { useLocationStore } from "../../store/useLocationStore";
import { useStore } from "../../store/useStore";

export default function ProfileBottomSheet({ isOpen, onClose, authUser }) {
  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { selectedCountry } = useStore();
  const { countries, getCountryConfig, init: initLocations } = useLocationStore();

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: selectedCountry || "ES",
    region: "",
    birthDate: "",
    gender: ""
  });

  useEffect(() => {
    const unsub = initLocations();
    return () => unsub();
  }, [initLocations, isOpen]); // Re-init when open to ensure fresh data

  // Si cambia el país seleccionado en el store global ANTES de enviarse, lo reflejamos
  useEffect(() => {
    if (selectedCountry && !formData.region) {
      setFormData(prev => ({ ...prev, country: selectedCountry }));
    }
  }, [selectedCountry]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showRegionSelect, setShowRegionSelect] = useState(false);

  const selectedCountryData = countries.find(c => c.id === formData.country);
  
  // Obtener regiones de locations.js (que tiene la data pesada) usando el ISO code
  const countryRegionsArr = LOCATION_DATA[formData.country]?.data ? Object.keys(LOCATION_DATA[formData.country].data) : [];
  const level1Label = getCountryConfig(formData.country)?.level1 || "Región";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderSelect = (val) => {
    setFormData({ ...formData, gender: val });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCamera = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: "dataUrl"
      });
      setPhotoPreview(image.dataUrl);
      setShowCropper(true);
    } catch (e) {
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const handleCropApply = (croppedDataUrl) => {
    setPhotoPreview(croppedDataUrl);
    setShowCropper(false);
  };

  const handleSubmit = async () => {
    if (!photoPreview) {
      setErrorMsg("Por favor, sube una foto de perfil.");
      return;
    }
    if (!formData.name || !formData.lastName || !formData.email || !formData.password || !formData.country || !formData.region || !formData.birthDate || !formData.gender) {
      setErrorMsg("Por favor, completa todos los campos del formulario.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setErrorMsg("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setErrorMsg("");

    try {
      let user = auth.currentUser;

      // Si ya hay sesión (ej: Google), usamos ese usuario
      // Si NO hay sesión, creamos una cuenta nueva con email/password
      if (!user) {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = result.user;
      } else {
        // Usuario existente (Google) — actualizar email si es diferente
        if (user.email !== formData.email) {
          try {
            await updateEmail(user, formData.email);
          } catch (emailErr) {
            console.warn("No se pudo actualizar el email:", emailErr.code);
          }
        }
      }

      // Actualizar displayName en Firebase Auth
      await updateProfile(user, { displayName: `${formData.name} ${formData.lastName}` });

      // Subir avatar
      let avatarUrl = "";
      const uid = user.uid;
      if (photoPreview) {
        const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
        await uploadString(storageRef, photoPreview, "data_url");
        avatarUrl = await getDownloadURL(storageRef);
        // Actualizar photoURL en Auth también
        await updateProfile(user, { photoURL: avatarUrl });
      }

      // Guardar datos completos en Firestore
      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        country: formData.country, // Guardamos CÓDIGO ISO (ej: ES, US)
        region: formData.region,
        // Inicializar memoria de país/región con la de residencia
        lastViewedCountry: formData.country,
        lastViewedRegion: formData.region,
        lastViewedAt: new Date(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        avatar: avatarUrl,
        phone: user.phoneNumber || "",
        verificationLevel: 1,
        createdAt: new Date(),
      }, { merge: true });

      onClose();
      navigate("/onboarding");
    } catch (err) {
      if (err.code) {
        setErrorMsg(translateFirebaseError(err.code));
      } else {
        setErrorMsg(err.message || "Error guardando el perfil. Intenta de nuevo.");
      }
      console.error(err);
    }
  };

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showGenderSelect, setShowGenderSelect] = useState(false);
  const [showDateSelect, setShowDateSelect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dateParts, setDateParts] = useState({ day: "1", month: "Ene", year: "2000" });

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);

  const applyDate = () => {
    const mFormat = (months.indexOf(dateParts.month) + 1).toString().padStart(2, '0');
    const dFormat = dateParts.day.toString().padStart(2, '0');
    setFormData({ ...formData, birthDate: `${dateParts.year}-${mFormat}-${dFormat}` });
    setShowDateSelect(false);
  };

  return (
    <>
      <div className={`bs-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`bs-sheet ${isOpen ? "open" : ""}`}>
        <div className="w-[44px] h-[5px] bg-[#E8E8F0] rounded-[3px] mx-auto mb-[12px] shadow-[inset_1px_1px_3px_rgba(180,180,210,0.5),inset_-1px_-1px_3px_rgba(255,255,255,0.9)]" />
        
        <div className="mb-2">
          <h2 className="text-[18px] font-black text-[#1A1A3A] flex items-center gap-2">
            ¡Ya casi, pana! <PartyPopper size={20} className="text-[#FFB400]" />
          </h2>
          <p className="text-[12px] font-bold text-[#8888AA]">Completa tus datos para empezar</p>
        </div>

        <div className="mb-2 text-center">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          
          <div 
            className="w-[84px] h-[84px] bg-[#E8E8F0] rounded-full mx-auto shadow-[6px_6px_14px_rgba(180,180,210,0.7),-6px_-6px_14px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-2 border-4 border-white"
            onClick={() => setShowPhotoOptions(!showPhotoOptions)}
          >
            {photoPreview && !showCropper ? (
              <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-[#1A1A3A] opacity-80">
                <CameraIcon size={24} strokeWidth={2.5} />
                <span className="text-[10px] mt-1 font-black">Subir foto</span>
              </div>
            )}
          </div>

          <div className={`flex flex-row gap-2 max-w-[280px] mx-auto transition-all duration-300 ${showPhotoOptions ? 'opacity-100 scale-100 h-auto mb-3' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
            <button 
              onClick={() => { fileInputRef.current?.click(); setShowPhotoOptions(false); }} 
              className="flex-1 bg-[#EDEDF5] shadow-[4px_4px_10px_rgba(180,180,210,0.5),-4px_-4px_10px_rgba(255,255,255,0.9)] rounded-[14px] py-2.5 text-[11px] font-bold text-[#1A1A3A] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ImageIcon size={14} /> Buscar archivo
            </button>
            <button 
              onClick={() => { handleCamera(); setShowPhotoOptions(false); }} 
              className="flex-1 bg-[#EDEDF5] shadow-[4px_4px_10px_rgba(180,180,210,0.5),-4px_-4px_10px_rgba(255,255,255,0.9)] rounded-[14px] py-2.5 text-[11px] font-bold text-[#1A1A3A] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CameraIcon size={14} /> Tomar foto
            </button>
          </div>
          
          {photoPreview && !showPhotoOptions && (
            <button 
              onClick={() => setShowCropper(!showCropper)} 
              className="mt-1 text-[#2D2D5E] text-[11px] font-black underline flex items-center gap-1 mx-auto mb-2"
            >
              <Scissors size={13} /> Ajustar recorte
            </button>
          )}

          {showCropper && photoPreview && (
            <AvatarCropper 
              image={photoPreview} 
              onApply={handleCropApply} 
              onCancel={() => setShowCropper(false)}
            />
          )}
        </div>

        <div className="space-y-[12px]">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Nombres</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="José" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Apellidos</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Rodríguez" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Correo Electrónico</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ejemplo@mipana.com" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A] pr-10" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-[#1A1A3A] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Repetir Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A] pr-10" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-[#1A1A3A] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">País</label>
                <div 
                  onClick={() => { setShowCountrySelect(!showCountrySelect); setShowRegionSelect(false); }}
                  className="w-full bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] px-3 py-3 flex justify-between items-center cursor-pointer overflow-hidden border border-white/40"
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedCountryData && (
                      <span className="text-lg">{selectedCountryData.flag}</span>
                    )}
                    <span className="text-[13px] font-bold text-[#1A1A3A] truncate">
                      {selectedCountryData?.name || "Seleccionar país"}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-[#8888AA] transition-transform flex-shrink-0 ${showCountrySelect ? 'rotate-180' : ''}`} />
                </div>
              {showCountrySelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#EDEDF5] rounded-[18px] shadow-[6px_6px_20px_rgba(180,180,210,0.6),-6px_-6px_20px_rgba(255,255,255,0.9)] z-[250] max-h-[180px] overflow-y-auto p-2 scrollbar-hide border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                    {countries.map((c) => (
                      <div 
                        key={c.id}
                        onClick={() => { 
                          setFormData({...formData, country: c.id, region: ""}); 
                          setShowCountrySelect(false); 
                        }}
                        className={`px-4 py-2.5 hover:bg-[#E8E8F0] rounded-[12px] text-[13px] font-bold text-[#1A1A3A] flex items-center gap-3 cursor-pointer transition-colors ${formData.country === c.id ? 'bg-[#1A1A3A]/10' : ''}`}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">
                {level1Label}
              </label>
              <div 
                onClick={() => { if(selectedCountryData) setShowRegionSelect(!showRegionSelect); setShowCountrySelect(false); }}
                className={`w-full bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] px-3 py-3 flex justify-between items-center cursor-pointer border border-white/40 ${!selectedCountryData ? 'opacity-40' : ''}`}
              >
                <span className="text-[13px] font-bold text-[#1A1A3A] truncate">{formData.region || "Seleccionar"}</span>
                <ChevronDown size={16} className={`text-[#8888AA] transition-transform flex-shrink-0 ${showRegionSelect ? 'rotate-180' : ''}`} />
              </div>
              {showRegionSelect && selectedCountryData && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#EDEDF5] rounded-[18px] shadow-[6px_6px_20px_rgba(180,180,210,0.6),-6px_-6px_20px_rgba(255,255,255,0.9)] z-[250] max-h-[180px] overflow-y-auto p-2 scrollbar-hide border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                  {countryRegionsArr.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No hay regiones disponibles</div>
                  ) : (
                    countryRegionsArr.map((r) => (
                      <div 
                        key={r}
                        onClick={() => { setFormData({...formData, region: r}); setShowRegionSelect(false); }}
                        className="px-4 py-2.5 hover:bg-[#E8E8F0] rounded-[12px] text-[13px] font-bold text-[#1A1A3A] cursor-pointer"
                      >
                        {r}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Nacimiento</label>
              <div 
                onClick={() => { setShowDateSelect(!showDateSelect); setShowGenderSelect(false); setShowCountrySelect(false); setShowRegionSelect(false); }}
                className="w-full bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] px-3 py-3 flex justify-between items-center cursor-pointer border border-white/40"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar size={14} className="text-[#8888AA]" />
                  <span className="text-[13px] font-bold text-[#1A1A3A] truncate">
                    {formData.birthDate ? formData.birthDate.split('-').reverse().join('/') : "DD/MM/AAAA"}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-[#8888AA] transition-transform flex-shrink-0 ${showDateSelect ? 'rotate-180' : ''}`} />
              </div>
              
              {showDateSelect && (
                <div className="absolute bottom-full left-0 w-[240px] md:w-[280px] mb-2 bg-[#EDEDF5] rounded-[24px] shadow-[10px_10px_40px_rgba(163,177,198,0.8),-10px_-10px_40px_rgba(255,255,255,0.95)] z-[270] p-4 border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex gap-2 justify-between mb-4">
                    {/* Dia */}
                    <div className="flex-1 bg-[#E8E8F0] shadow-[inset_2px_2px_5px_rgba(180,180,210,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] rounded-[12px] h-[160px] overflow-y-auto scrollbar-hide py-2">
                       {days.map(d => (
                         <div key={d} onClick={() => setDateParts({...dateParts, day: d.toString()})} className={`text-center py-2 text-[13px] font-bold cursor-pointer transition-colors ${dateParts.day === d.toString() ? 'bg-[#1A1A3A] text-white shadow-md mx-2 rounded-[8px]' : 'text-[#8888AA] hover:text-[#1A1A3A]'}`}>
                           {d.toString().padStart(2, '0')}
                         </div>
                       ))}
                    </div>
                    {/* Mes */}
                    <div className="flex-1 bg-[#E8E8F0] shadow-[inset_2px_2px_5px_rgba(180,180,210,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] rounded-[12px] h-[160px] overflow-y-auto scrollbar-hide py-2">
                       {months.map(m => (
                         <div key={m} onClick={() => setDateParts({...dateParts, month: m})} className={`text-center py-2 text-[13px] font-bold cursor-pointer transition-colors ${dateParts.month === m ? 'bg-[#1A1A3A] text-white shadow-md mx-2 rounded-[8px]' : 'text-[#8888AA] hover:text-[#1A1A3A]'}`}>
                           {m}
                         </div>
                       ))}
                    </div>
                    {/* Año */}
                    <div className="flex-1 bg-[#E8E8F0] shadow-[inset_2px_2px_5px_rgba(180,180,210,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] rounded-[12px] h-[160px] overflow-y-auto scrollbar-hide py-2">
                       {years.map(y => (
                         <div key={y} onClick={() => setDateParts({...dateParts, year: y.toString()})} className={`text-center py-2 text-[13px] font-bold cursor-pointer transition-colors ${dateParts.year === y.toString() ? 'bg-[#1A1A3A] text-white shadow-md mx-2 rounded-[8px]' : 'text-[#8888AA] hover:text-[#1A1A3A]'}`}>
                           {y}
                         </div>
                       ))}
                    </div>
                  </div>
                  <button onClick={applyDate} type="button" className="w-full bg-[#1A1A3A] text-white font-black text-[13px] py-3 rounded-[14px] shadow-[4px_4px_10px_rgba(0,0,0,0.2)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)] transition-all">
                    Confirmar fecha
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Sexo</label>
              <div 
                onClick={() => { setShowGenderSelect(!showGenderSelect); setShowCountrySelect(false); setShowRegionSelect(false); }}
                className="w-full bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] px-3 py-3 flex justify-between items-center cursor-pointer border border-white/40"
              >
                <div className="flex items-center gap-2 truncate">
                  <User size={14} className="text-[#8888AA]" />
                  <span className="text-[13px] font-bold text-[#1A1A3A] truncate">{formData.gender || "Sexo"}</span>
                </div>
                <ChevronDown size={16} className={`text-[#8888AA] transition-transform flex-shrink-0 ${showGenderSelect ? 'rotate-180' : ''}`} />
              </div>
              {showGenderSelect && (
                <div className="absolute top-0 right-0 left-0 -translate-y-full mb-2 bg-[#EDEDF5] rounded-[18px] shadow-[6px_6px_20px_rgba(180,180,210,0.6),-6px_-6px_20px_rgba(255,255,255,0.9)] z-[270] max-h-[180px] overflow-y-auto p-2 scrollbar-hide border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                  {['Hombre', 'Mujer', 'Otro'].map((g) => (
                    <div 
                      key={g}
                      onClick={() => { setFormData({...formData, gender: g}); setShowGenderSelect(false); }}
                      className="px-4 py-2.5 hover:bg-[#E8E8F0] rounded-[12px] text-[13px] font-bold text-[#1A1A3A] cursor-pointer"
                    >
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {errorMsg && (
            <div className="mt-4 p-4 rounded-2xl bg-[#FFE5E5] border border-[#FFCCCC] shadow-[inset_2px_2px_5px_rgba(255,0,0,0.1)] transition-all animate-in fade-in zoom-in duration-300 mb-2">
              <p className="text-sm font-bold text-[#D90429] text-center leading-tight">
                {errorMsg}
              </p>
            </div>
          )}

          <button 
            onClick={handleSubmit} 
            className="w-full mt-3 bg-gradient-to-r from-[#FFB400] to-[#FF9000] rounded-[20px] py-[14px] font-black text-[15px] text-white shadow-[5px_5px_14px_rgba(200,120,0,0.35),-2px_-2px_8px_rgba(255,220,100,0.2)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            ¡Listo! Entrar a Mi Pana <Rocket size={20} />
          </button>
          
          <p className="text-[10px] font-bold text-[#555577] text-center mt-2 mb-2">
            Al registrarte aceptas nuestros <span className="underline cursor-pointer text-[#1A1A3A]">términos de uso</span> y <span className="underline cursor-pointer text-[#1A1A3A]">política de privacidad</span>
          </p>
        </div>
      </div>
    </>
  );
}
