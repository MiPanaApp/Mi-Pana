import { useEffect, useState } from "react";
import { getAdditionalUserInfo, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../services/firebase";

import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useStore } from "../../store/useStore";
import { translateFirebaseError } from "../../utils/authErrors";
import logoFull from "../../assets/Logo_Mi_pana.png";
import "../../styles/auth.css";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Usamos el store Zustand directamente (fuente de verdad)
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const { hasChosenCountry } = useStore();

  // Cargar email recordado al montar
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_me_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Verificar si es un usuario nuevo
      if (result) {
        const additionalInfo = getAdditionalUserInfo(result);
        if (additionalInfo?.isNewUser) {
          navigate("/register", { state: { isGoogleUser: true, user: result.user } });
          return;
        }
      }
      const fetchPrefs = useAuthStore.getState().fetchUserPreferences;
      const { hasPrefs } = await fetchPrefs(result.user.uid);
      if (hasPrefs || hasChosenCountry) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      console.error("Error Google Auth:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        // El usuario cerró la ventana, no mostrar error
        return;
      }
      setError("No se pudo iniciar sesión con Google. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider)
      const additionalInfo = getAdditionalUserInfo(result)
      if (additionalInfo?.isNewUser) {
        navigate("/register", {
          state: { isGoogleUser: true, user: result.user }
        })
      } else {
        navigate("/home")
      }
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') return
      if (error.code === 
          'auth/account-exists-with-different-credential') {
        alert("Ya tienes cuenta con ese email. " +
              "Usa Google o email/contraseña.")
        return
      }
      alert("No se pudo iniciar sesión con Facebook.")
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos, pana.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password, rememberMe);
      const user = useAuthStore.getState().user;
      const fetchPrefs = useAuthStore.getState().fetchUserPreferences;
      const { hasPrefs } = await fetchPrefs(user.uid);
      if (hasPrefs || hasChosenCountry) {
        navigate("/home");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(translateFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="absolute top-[-100px] left-[-50px] w-[300px] h-[300px] rounded-[60%_40%_70%_40%] bg-[#FFB400] opacity-20 blur-xl" />
      <div className="absolute bottom-[-100px] right-[-50px] w-[250px] h-[250px] rounded-[40%_60%_50%_70%] bg-[#1A1A3A] opacity-10 blur-xl" />
      
      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pt-[52px]">
        
        <div className="mb-[24px] text-center">
          <img src={logoFull} alt="miPana" style={{ height: "220px", objectFit: "contain" }} className="mx-auto" />
          <p className="font-sans text-[24px] font-bold text-black -mt-4">Juntos somos más</p>
        </div>

        <form onSubmit={handleEmailLogin} className="clay-card-auth w-full max-w-sm">
          {/* BOTÓN GOOGLE ARRIBA DEL TODO */}
          {/* Google + Facebook Social Buttons */}
          <div className="flex gap-3 mb-5">

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex-1 flex items-center justify-center
                         gap-2 py-3 rounded-2xl font-bold
                         text-[13px] text-[#1A1A3A]
                         bg-[#EDEDF5]
                         shadow-[5px_5px_12px_rgba(180,180,210,0.7),
                         -5px_-5px_12px_rgba(255,255,255,0.9)]
                         active:shadow-[inset_2px_2px_4px_rgba(180,180,210,0.6)]
                         transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M23.52 12.27C23.52 11.42 23.44 10.6 23.3 
                     9.82H12v4.45h6.46c-.28 1.4-1.04 2.53-2.21 
                     3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.08z"
                  fill="#4285F4"/>
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M12 24c3.24 0 5.97-.98 7.96-2.66l-3.57-2.77c-1 
                     .67-2.37 1.08-4.39 1.08-3.13 0-5.78-1.93-6.73 
                     -4.53H1.26v2.84C3.23 21.53 7.28 24 12 24z"
                  fill="#34A853"/>
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M5.27 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43 
                     .35-2.09V7.07H1.26C.46 8.55 0 10.22 0 12s.46 
                     3.45 1.26 4.93l4.01-2.84z"
                  fill="#FBBC05"/>
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M12 4.77c1.76 0 3.34.56 4.58 1.64l3.15-3.15C17.95 
                     2.09 15.24 1 12 1 7.28 1 3.23 3.47 1.26 7.07l4.01 
                     2.84C6.22 7.31 8.87 4.77 12 4.77z"
                  fill="#EA4335"/>
              </svg>
              Google
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={handleFacebookSignIn}
              className="flex-1 flex items-center justify-center
                         gap-2 py-3 rounded-2xl font-bold
                         text-[13px] text-[#1A1A3A]
                         bg-[#EDEDF5]
                         shadow-[5px_5px_12px_rgba(180,180,210,0.7),
                         -5px_-5px_12px_rgba(255,255,255,0.9)]
                         active:shadow-[inset_2px_2px_4px_rgba(180,180,210,0.6)]
                         transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"
                   fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 
                  5.373-12 12c0 5.99 4.388 10.954 10.125 
                  11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 
                  1.792-4.669 4.533-4.669 1.312 0 2.686.235 
                  2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 
                  1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 
                  23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>

          </div>


          {/* DIVIDER ENTRE GOOGLE Y CAMPOS */}
          <div className="flex items-center gap-3 mb-6 opacity-60">
            <div className="h-[1px] flex-1 bg-[#b4b4d2]" />
            <span className="text-[12px] font-bold text-[#1a1a3a]">O continúa con</span>
            <div className="h-[1px] flex-1 bg-[#b4b4d2]" />
          </div>

          <div className="mb-4 relative">
            <div className="relative">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 opacity-50 text-[#1A1A3A]">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clay-input-auth w-full py-[13.5px] pr-[14px] pl-[44px] text-[14px] font-bold text-[#1A1A3A] outline-none" 
              />
            </div>
          </div>

          <div className="mb-5 relative">
            <div className="relative">
              <span className="absolute left-[14px] top-1/2 -translate-y-1/2 opacity-50 text-[#1A1A3A]">
                <Lock size={18} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="clay-input-auth w-full py-[13.5px] pr-[44px] pl-[44px] text-[14px] font-bold text-[#1A1A3A] outline-none" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-[14px] top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90 outline-none text-[#1A1A3A]"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div 
                className={`w-[40px] h-[22px] rounded-[11px] p-[3px] transition-all shadow-[inset_2px_2px_4px_rgba(180,180,210,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] 
                ${rememberMe ? 'bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E]' : 'bg-[#E8E8F0]'}`}
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`w-[16px] h-[16px] bg-white rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm ${rememberMe ? 'translate-x-[18px]' : 'translate-x-0'}`} />
              </div>
              <span className="text-[12px] font-bold text-[#8888AA]">Recuérdame</span>
            </label>
            <a href="#" className="text-[12px] font-bold text-[#2D2D5E] underline opacity-70 hover:opacity-100 transition-opacity">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <p className="text-[#D90429] text-[12px] font-bold text-center mb-4">{error}</p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="clay-btn-auth w-full py-[15px] font-black text-[15px] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>Entrando... <Loader2 size={18} className="animate-spin" /></>
            ) : (
              <>¡Entrar, pana! <Rocket size={20} /></>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-3">
          <p className="text-[12px] font-bold text-[#1A1A3A] opacity-50">¿Aún no tienes cuenta?</p>
          <button 
            onClick={() => navigate("/register")} 
            className="bg-[#EDEDF5] rounded-[14px] px-[20px] py-[8px] text-[13px] font-bold text-[#1A1A3A] shadow-[4px_4px_10px_rgba(180,180,210,0.5),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center gap-2 transition-all active:scale-95"
          >
            Registrarse <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
