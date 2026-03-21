import { useState, useRef, useEffect } from "react";
import { Camera as CameraIcon, Image as ImageIcon, Scissors, User, Rocket, PartyPopper, ChevronDown, Calendar } from "lucide-react";
import { Camera } from "@capacitor/camera";
import AvatarCropper from "./AvatarCropper";
import { storage, db } from "../../services/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ProfileBottomSheet({ isOpen, onClose, authUser }) {
  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    country: "Seleccionar país",
    region: "",
    birthDate: "",
    gender: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showRegionSelect, setShowRegionSelect] = useState(false);

  const countries = [
    { name: "España", flag: "🇪🇸", regionLabel: "Comunidad", regions: ["Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunidad Valenciana", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "País Vasco", "La Rioja", "Ceuta", "Melilla"] },
    { name: "Estados Unidos", flag: "🇺🇸", regionLabel: "Estado", regions: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"] },
    { name: "Colombia", flag: "🇨🇴", regionLabel: "Departamento", regions: ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"] },
    { name: "Chile", flag: "🇨🇱", regionLabel: "Región", regions: ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"] },
    { name: "Panamá", flag: "🇵🇦", regionLabel: "Provincia", regions: ["Bocas del Toro", "Chiriquí", "Coclé", "Colón", "Darién", "Herrera", "Los Santos", "Panamá", "Veraguas", "Panamá Oeste", "Guna Yala", "Emberá-Wounaan", "Ngäbe-Buglé"] },
    { name: "República Dominicana", flag: "🇩🇴", regionLabel: "Provincia", regions: ["Azua", "Baoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte", "El Seibo", "Elias Piña", "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia", "Puerto Plata", "Samaná", "Sánchez Ramírez", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís", "Santiago", "Santiago Rodríguez", "Santo Domingo", "Valverde"] },
    { name: "Argentina", flag: "🇦🇷", regionLabel: "Provincia", regions: ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Ciudad de Buenos Aires", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"] }
  ];

  const selectedCountryData = countries.find(c => `${c.flag} ${c.name}` === formData.country);

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

  const handleCropApply = () => {
    setShowCropper(false);
  };

  const handleSubmit = async () => {
    if (!photoPreview) {
      setErrorMsg("Por favor, sube una foto de perfil.");
      return;
    }
    if (!formData.name || !formData.lastName || formData.country === "Seleccionar país" || !formData.region || !formData.birthDate || !formData.gender) {
      setErrorMsg("Por favor, completa todos los campos del formulario.");
      return;
    }
    setErrorMsg("");

    try {
      let avatarUrl = "";
      const uid = authUser?.uid || "test-001";
      if (photoPreview) {
        const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
        await uploadString(storageRef, photoPreview, "data_url");
        avatarUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "users", uid), {
        ...formData,
        avatar: avatarUrl,
        phone: authUser?.phoneNumber || "",
        phoneVerified: true,
        verificationLevel: 1,
        createdAt: new Date(),
        role: "buyer"
      }, { merge: true });

      onClose();
      navigate("/home");
    } catch (err) {
      setErrorMsg("Error guardando el perfil. Intenta de nuevo.");
      console.error(err);
    }
  };

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });
  const [showDaySelect, setShowDaySelect] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);

  const handleDatePartSelect = (part, val) => {
    const newParts = { ...dateParts, [part]: val };
    setDateParts(newParts);
    if (newParts.day && newParts.month && newParts.year) {
      const monthIdx = months.indexOf(newParts.month) + 1;
      const formattedMonth = monthIdx < 10 ? `0${monthIdx}` : monthIdx;
      const formattedDay = parseInt(newParts.day) < 10 ? `0${newParts.day}` : newParts.day;
      setFormData({ ...formData, birthDate: `${newParts.year}-${formattedMonth}-${formattedDay}` });
    }
  };

  return (
    <>
      <div className={`bs-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`bs-sheet ${isOpen ? "open" : ""}`}>
        <div className="w-[44px] h-[5px] bg-[#E8E8F0] rounded-[3px] mx-auto mb-[18px] shadow-[inset_1px_1px_3px_rgba(180,180,210,0.5),inset_-1px_-1px_3px_rgba(255,255,255,0.9)]" />
        
        <div className="mb-4">
          <h2 className="text-[18px] font-black text-[#1A1A3A] flex items-center gap-2">
            ¡Ya casi, pana! <PartyPopper size={20} className="text-[#FFB400]" />
          </h2>
          <p className="text-[12px] font-bold text-[#8888AA]">Completa tus datos para empezar</p>
        </div>

        <div className="mb-4 text-center">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          
          <div 
            className="w-[110px] h-[110px] bg-[#E8E8F0] rounded-full mx-auto shadow-[6px_6px_14px_rgba(180,180,210,0.7),-6px_-6px_14px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-3 border-4 border-white"
            onClick={() => setShowPhotoOptions(!showPhotoOptions)}
          >
            {photoPreview && !showCropper ? (
              <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-[#1A1A3A] opacity-80">
                <CameraIcon size={34} strokeWidth={2.5} />
                <span className="text-[11px] mt-1 font-black">Subir foto</span>
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
            <AvatarCropper image={photoPreview} onApply={handleCropApply} />
          )}
        </div>

        <div className="space-y-3">
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

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">País</label>
              <div 
                onClick={() => { setShowCountrySelect(!showCountrySelect); setShowRegionSelect(false); }}
                className="w-full bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] px-3 py-3 flex justify-between items-center cursor-pointer overflow-hidden border border-white/40"
              >
                <span className="text-[13px] font-bold text-[#1A1A3A] truncate">{formData.country}</span>
                <ChevronDown size={16} className={`text-[#8888AA] transition-transform flex-shrink-0 ${showCountrySelect ? 'rotate-180' : ''}`} />
              </div>
              {showCountrySelect && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#EDEDF5] rounded-[18px] shadow-[6px_6px_20px_rgba(180,180,210,0.6),-6px_-6px_20px_rgba(255,255,255,0.9)] z-[250] max-h-[180px] overflow-y-auto p-2 scrollbar-hide border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                  {countries.map((c) => (
                    <div 
                      key={c.name}
                      onClick={() => { 
                        setFormData({...formData, country: `${c.flag} ${c.name}`, region: ""}); 
                        setShowCountrySelect(false); 
                      }}
                      className="px-4 py-2.5 hover:bg-[#E8E8F0] rounded-[12px] text-[13px] font-bold text-[#1A1A3A] flex items-center gap-3 cursor-pointer transition-colors"
                    >
                      <span className="text-[16px]">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">
                {selectedCountryData ? selectedCountryData.regionLabel : "Ciudad"}
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
                  {selectedCountryData.regions.map((r) => (
                    <div 
                      key={r}
                      onClick={() => { setFormData({...formData, region: r}); setShowRegionSelect(false); }}
                      className="px-4 py-2.5 hover:bg-[#E8E8F0] rounded-[12px] text-[13px] font-bold text-[#1A1A3A] cursor-pointer"
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Fecha de nacimiento</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div onClick={() => { setShowDaySelect(!showDaySelect); setShowMonthSelect(false); setShowYearSelect(false); }} className="w-full px-2 py-3 bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] text-[13px] font-bold text-[#1A1A3A] text-center cursor-pointer border border-white/40">
                  {dateParts.day || "Día"}
                </div>
                {showDaySelect && (
                  <div className="absolute top-0 left-0 right-0 -translate-y-full mb-2 bg-[#EDEDF5] rounded-[18px] shadow-2xl z-[260] max-h-[150px] overflow-y-auto p-1 border border-white/50 scrollbar-hide animate-[fadeIn_0.2s_ease-out]">
                    {days.map(d => <div key={d} onClick={() => { handleDatePartSelect('day', d); setShowDaySelect(false); }} className="py-2.5 text-center text-[13px] font-bold text-[#1A1A3A] hover:bg-[#E8E8F0] rounded-lg cursor-pointer transition-colors">{d}</div>)}
                  </div>
                )}
              </div>
              <div className="relative flex-[1.5]">
                <div onClick={() => { setShowMonthSelect(!showMonthSelect); setShowDaySelect(false); setShowYearSelect(false); }} className="w-full px-2 py-3 bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] text-[13px] font-bold text-[#1A1A3A] text-center cursor-pointer border border-white/40">
                  {dateParts.month || "Mes"}
                </div>
                {showMonthSelect && (
                  <div className="absolute top-0 left-0 right-0 -translate-y-full mb-2 bg-[#EDEDF5] rounded-[18px] shadow-2xl z-[260] max-h-[150px] overflow-y-auto p-1 border border-white/50 scrollbar-hide animate-[fadeIn_0.2s_ease-out]">
                    {months.map(m => <div key={m} onClick={() => { handleDatePartSelect('month', m); setShowMonthSelect(false); }} className="py-2.5 text-center text-[13px] font-bold text-[#1A1A3A] hover:bg-[#E8E8F0] rounded-lg cursor-pointer transition-colors">{m}</div>)}
                  </div>
                )}
              </div>
              <div className="relative flex-[1.2]">
                <div onClick={() => { setShowYearSelect(!showYearSelect); setShowDaySelect(false); setShowMonthSelect(false); }} className="w-full px-2 py-3 bg-[#E8E8F0] rounded-[14px] shadow-[inset_3px_3px_7px_rgba(180,180,210,0.5),inset_-3px_-3px_7px_rgba(255,255,255,0.9)] text-[13px] font-bold text-[#1A1A3A] text-center cursor-pointer border border-white/40">
                  {dateParts.year || "Año"}
                </div>
                {showYearSelect && (
                  <div className="absolute top-0 left-0 right-0 -translate-y-full mb-2 bg-[#EDEDF5] rounded-[18px] shadow-2xl z-[260] max-h-[150px] overflow-y-auto p-1 border border-white/50 scrollbar-hide animate-[fadeIn_0.2s_ease-out]">
                    {years.map(y => <div key={y} onClick={() => { handleDatePartSelect('year', y); setShowYearSelect(false); }} className="py-2.5 text-center text-[13px] font-bold text-[#1A1A3A] hover:bg-[#E8E8F0] rounded-lg cursor-pointer transition-colors">{y}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Sexo</label>
            <div className="flex gap-2">
              {['Hombre', 'Mujer', 'Otro'].map((g) => {
                const isActive = formData.gender === g;
                return (
                  <button 
                    key={g}
                    type="button"
                    onClick={() => handleGenderSelect(g)}
                    className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-bold transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] text-white shadow-[3px_3px_8px_rgba(20,20,60,0.3)] border-none' : 'bg-[#E8E8F0] shadow-[4px_4px_9px_rgba(180,180,210,0.4),-4px_-4px_9px_rgba(255,255,255,0.9)] text-[#8888AA] border border-white/40'}`}
                  >
                    <User size={14} className={isActive ? 'text-white' : 'text-[#8888AA]'} />
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
          
          {errorMsg && <p className="text-[#D90429] text-[11px] font-bold text-center">{errorMsg}</p>}

          <button 
            onClick={handleSubmit} 
            className="w-full mt-3 bg-gradient-to-r from-[#FFB400] to-[#FF9000] rounded-[20px] py-[14px] font-black text-[15px] text-white shadow-[5px_5px_14px_rgba(200,120,0,0.35),-2px_-2px_8px_rgba(255,220,100,0.2)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            ¡Listo! Entrar a Mi Pana <Rocket size={20} />
          </button>
          
          <p className="text-[9px] text-[#AAAACC] text-center mt-2 mb-4">
            Al registrarte aceptas nuestros <span className="underline cursor-pointer">términos de uso</span> y <span className="underline cursor-pointer">política de privacidad</span>
          </p>
        </div>
      </div>
    </>
  );
}
