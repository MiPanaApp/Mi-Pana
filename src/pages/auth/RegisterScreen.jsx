import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProfileBottomSheet from "../../components/auth/ProfileBottomSheet";
import logoFull from "../../assets/Logo_Mi_pana.png";
import "../../styles/auth.css";

export default function RegisterScreen() {
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si viene de Google Login y es nuevo, abrimos el formulario de perfil directamente
    if (location.state?.isGoogleUser && location.state?.user) {
      setAuthUser(location.state.user);
      setShowProfileSheet(true);
    } else {
      // Para cualquier otro caso, abrir el formulario directamente
      setShowProfileSheet(true);
    }
  }, [location]);

  return (
    <div className="auth-bg">
      <button 
        onClick={() => navigate("/login")}
        className="absolute top-[54px] left-[22px] w-[38px] h-[38px] bg-[#EDEDF5] shadow-[6px_6px_14px_rgba(180,180,210,0.7),-6px_-6px_14px_rgba(255,255,255,0.95)] rounded-[12px] flex items-center justify-center font-bold text-[#1A1A3A] z-20"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pt-[78px]">
        
        <div className="mb-[20px] text-center">
          <img src={logoFull} alt="miPana" style={{ height: "180px", objectFit: "contain" }} className="mx-auto" />
        </div>

        <h1 className="text-[20px] font-black text-[#1A1A3A] text-center mb-2 -mt-3">Crea tu cuenta</h1>
        <p className="text-[12px] font-bold text-black text-center leading-[1.6] max-w-[280px] mb-8">
          Completa tus datos para unirte a la comunidad Mi Pana.
        </p>

        <div className="text-center pb-8">
          <span className="text-[12px] font-bold text-black">¿Ya tienes cuenta? </span>
          <span className="text-[12px] font-black text-black underline cursor-pointer" onClick={() => navigate("/login")}>
            Iniciar sesión
          </span>
        </div>

      </div>

      <ProfileBottomSheet 
        isOpen={showProfileSheet} 
        onClose={() => setShowProfileSheet(false)} 
        authUser={authUser} 
      />
    </div>
  );
}
