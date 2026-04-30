import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PartyPopper, 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  ChevronDown, 
  Calendar, 
  User, 
  Rocket, 
  Scissors, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { Camera } from "@capacitor/camera";
import { auth, db, storage } from "../../services/firebase";
import { 
  createUserWithEmailAndPassword, 
  updateEmail, 
  updateProfile 
} from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { translateFirebaseError } from "../../utils/authErrors";

import { LOCATION_DATA } from "../../data/locations";
import { useLocationStore } from "../../store/useLocationStore";
import { useStore } from "../../store/useStore";
import AvatarCropper from "./AvatarCropper";

import InfoModal from "../InfoModal";
import { LegalData } from "../../data/LegalData";
import EmailVerificationModal from "./EmailVerificationModal";

const functions = getFunctions(undefined, 'us-central1');


export default function ProfileBottomSheet({ isOpen, onClose, authUser }) {
  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: "", content: "" });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const handleOpenLegal = (key) => {
    const doc = LegalData[key];
    if (doc) {
      // Formatear texto plano a HTML simple para InfoModal (saltos de línea)
      const formattedContent = doc.content.replace(/\n/g, '<br/>');
      setInfoModal({
        isOpen: true,
        title: doc.title,
        content: formattedContent
      });
    }
  };

  const { selectedCountry } = useStore();
  const { countries, getCountryConfig, init: initLocations } = useLocationStore();

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: selectedCountry || "ES"
  });

  useEffect(() => {
    const unsub = initLocations();
    return () => unsub();
  }, [initLocations, isOpen]); // Re-init when open to ensure fresh data

  // Si cambia el país seleccionado en el store global ANTES de enviarse, lo reflejamos
  useEffect(() => {
    if (selectedCountry) {
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
    if (!formData.name || !formData.lastName || !formData.email || !formData.password || !formData.country) {
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

      // Guardar datos completos en Firestore
      const uid = user.uid;
      await setDoc(doc(db, "users", uid), {
        name: formData.name,
        lastName: formData.lastName,
        email: user.email, // ✅ Siempre usar el email de Firebase Auth, no el del formulario
        country: formData.country, // Guardamos CÓDIGO ISO (ej: ES, US)
        // Inicializar memoria de país
        lastViewedCountry: formData.country,
        lastViewedAt: new Date(),
        phone: user.phoneNumber || "",
        verificationLevel: 1,
        profileComplete: false,
        updatedAt: new Date(),
      }, { merge: true });

      setRegisteredUser(user);
      
      // Enviar código de verificación
      try {
        if (!user?.email) {
          console.warn('[ProfileBottomSheet] No hay email de usuario, saltando verificación');
          onClose();
          navigate("/home");
          return;
        }
        const sendCode = httpsCallable(functions, 'sendVerificationCode');
        await sendCode({
          email: user.email,
          userName: formData.name || 'Pana'
        });
        setShowVerificationModal(true);
      } catch (e) {
        console.error('[ProfileBottomSheet] Error enviando código de verificación:', e);
        // Si falla el email, igual cerramos y vamos a home para no bloquear
        onClose();
        navigate("/home");
      }
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
        
        <div className="mb-4 text-center">
          <h2 className="text-[18px] font-black text-[#1A1A3A] flex items-center justify-center gap-2">
            ¡Ya casi, pana! <PartyPopper size={20} className="text-[#FFB400]" />
          </h2>
          <p className="text-[12px] font-bold text-[#8888AA]">Completa tus datos para empezar</p>
        </div>

        <div className="mb-6 text-center">
          {/* Foto de perfil removida para Progressive Profiling */}
        </div>

        <div className="space-y-[12px]">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Nombres</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Pedro" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">Apellidos</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Ej: Pérez" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
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

          <div className="mb-6">
            <div className="relative">
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[5px]">País</label>
                <div 
                  onClick={() => { setShowCountrySelect(!showCountrySelect); }}
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
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#EDEDF5] rounded-[18px] shadow-[6px_6px_20px_rgba(180,180,210,0.6),-6px_-6px_20px_rgba(255,255,255,0.9)] z-[250] max-h-[180px] overflow-y-auto p-2 scrollbar-hide border border-white/50 animate-[fadeIn_0.2s_ease-out]">
                    {countries.map((c) => (
                      <div 
                        key={c.id}
                        onClick={() => { 
                          setFormData({...formData, country: c.id}); 
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
            Al registrarte aceptas nuestras <span onClick={() => handleOpenLegal('terms')} className="underline cursor-pointer text-[#1A1A3A]">condiciones de contratación</span> y <span onClick={() => handleOpenLegal('privacy')} className="underline cursor-pointer text-[#1A1A3A]">política de privacidad</span>
          </p>
        </div>
      </div>

      <InfoModal 
        isOpen={infoModal.isOpen} 
        onClose={() => setInfoModal({ ...infoModal, isOpen: false })} 
        title={infoModal.title} 
        content={infoModal.content} 
      />

      <EmailVerificationModal
        isOpen={showVerificationModal}
        email={registeredUser?.email}
        onVerified={() => {
          setShowVerificationModal(false);
          onClose();
          navigate("/home");
        }}
        onResend={async () => {
          if (!registeredUser) return;
          const sendCode = httpsCallable(functions, 'sendVerificationCode');
          await sendCode({
            email: registeredUser.email,
            userName: formData.name || 'Pana'
          }).catch((err) => console.error('Resend error:', err));
        }}
      />
    </>
  );
}
