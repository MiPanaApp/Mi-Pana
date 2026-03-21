import { useState, useRef, useEffect } from "react";
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
    country: "🇪🇸 España",
    city: "Madrid",
    birthDate: "",
    gender: ""
  });
  const [errorMsg, setErrorMsg] = useState("");

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
    if (!formData.name || !formData.lastName || !formData.country || !formData.city || !formData.birthDate || !formData.gender) {
      setErrorMsg("Por favor, completa todos los campos.");
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

  return (
    <>
      <div className={`bs-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`bs-sheet ${isOpen ? "open" : ""}`}>
        <div className="w-[44px] h-[5px] bg-[#E8E8F0] rounded-[3px] mx-auto mb-[18px] shadow-[inset_1px_1px_3px_rgba(180,180,210,0.5),inset_-1px_-1px_3px_rgba(255,255,255,0.9)]" />
        
        <div className="mb-6">
          <h2 className="text-[18px] font-black text-[#1A1A3A]">¡Ya casi, pana! 🎉</h2>
          <p className="text-[12px] font-bold text-[#8888AA]">Completa tus datos para empezar</p>
        </div>

        <div className="mb-6 text-center">
          <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-3">Foto de perfil</label>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          
          <div 
            className="w-[86px] h-[86px] bg-[#E8E8F0] rounded-full mx-auto shadow-[6px_6px_14px_rgba(180,180,210,0.7),-6px_-6px_14px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview && !showCropper ? (
              <img src={photoPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-[26px] opacity-40">📷</span>
                <span className="text-[9px] text-[#AAAACC] mt-1 font-bold">Subir foto</span>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#E8E8F0] shadow-[6px_6px_14px_rgba(180,180,210,0.4),-6px_-6px_14px_rgba(255,255,255,0.8)] rounded-xl font-[11px] font-bold text-[#8888AA] px-3 py-2 flex items-center gap-1">
              📁 Fototeca
            </button>
            <button onClick={handleCamera} className="bg-[#E8E8F0] shadow-[6px_6px_14px_rgba(180,180,210,0.4),-6px_-6px_14px_rgba(255,255,255,0.8)] rounded-xl font-[11px] font-bold text-[#8888AA] px-3 py-2 flex items-center gap-1">
              📸 Cámara
            </button>
            {photoPreview && (
              <button onClick={() => setShowCropper(!showCropper)} className="bg-[#E8E8F0] shadow-[6px_6px_14px_rgba(180,180,210,0.4),-6px_-6px_14px_rgba(255,255,255,0.8)] rounded-xl font-[11px] font-bold text-[#8888AA] px-3 py-2 flex items-center gap-1">
                ✂️ Recortar
              </button>
            )}
          </div>
          
          {showCropper && photoPreview && (
            <AvatarCropper image={photoPreview} onApply={handleCropApply} />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">Nombres</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="José" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">Apellidos</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Rodríguez" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">País de residencia</label>
            <div className="bg-[#E8E8F0] rounded-[14px] shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] px-4">
              <select name="country" value={formData.country} onChange={handleChange} className="w-full bg-transparent py-3 outline-none border-none appearance-none text-[14px] font-bold text-[#1A1A3A]">
                <option>🇪🇸 España</option>
                <option>🇺🇸 Estados Unidos</option>
                <option>🇨🇴 Colombia</option>
                <option>🇨🇱 Chile</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Madrid" className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">Fecha de nacimiento</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-4 py-3 bg-[#E8E8F0] rounded-[14px] outline-none border-none shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] text-[14px] font-bold text-[#1A1A3A]" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-[#AAAACC] block mb-[5px]">Sexo</label>
            <div className="flex gap-2">
              {['Hombre', 'Mujer', 'Otro'].map((g) => {
                const isActive = formData.gender === g;
                return (
                  <button 
                    key={g}
                    onClick={() => handleGenderSelect(g)}
                    className={`flex-1 py-3 rounded-[14px] text-[12px] font-bold transition-all ${isActive ? 'bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] text-white shadow-[3px_3px_8px_rgba(20,20,60,0.3)]' : 'bg-[#E8E8F0] shadow-[4px_4px_9px_rgba(180,180,210,0.4),-4px_-4px_9px_rgba(255,255,255,0.9)] text-[#8888AA]'}`}
                  >
                    {g === 'Hombre' ? '♂' : g === 'Mujer' ? '♀' : '⚧'} {g}
                  </button>
                )
              })}
            </div>
          </div>
          
          {errorMsg && <p className="text-[#D90429] text-[12px] font-bold text-center">{errorMsg}</p>}

          <button 
            onClick={handleSubmit} 
            className="w-full mt-4 bg-gradient-to-r from-[#FFB400] to-[#FF9000] rounded-[20px] py-[15px] font-black text-[15px] text-white shadow-[5px_5px_14px_rgba(200,120,0,0.35),-2px_-2px_8px_rgba(255,220,100,0.2)]"
          >
            ¡Listo! Entrar a Mi Pana 🚀
          </button>
          
          <p className="text-[10px] text-[#AAAACC] text-center mt-3">
            Al registrarte aceptas nuestros <span className="underline cursor-pointer">términos de uso</span> y <span className="underline cursor-pointer">política de privacidad</span>
          </p>
        </div>
      </div>
    </>
  );
}
