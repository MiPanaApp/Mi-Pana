import { useEffect, useState } from "react";
import { getAdditionalUserInfo, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../services/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";


import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useStore } from "../../store/useStore";
import { translateFirebaseError } from "../../utils/authErrors";
import logoFull from "../../assets/Logo_Mi_pana.png";
import "../../styles/auth.css";

const functions = getFunctions();


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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailInput = email || prompt('Ingresa tu email, pana:');
    if (!emailInput) return;

    try {
      setLoading(true);
      const sendResetEmail = httpsCallable(functions, 'sendPasswordResetEmail');
      await sendResetEmail({ email: emailInput });
      alert('Te enviamos un email para recuperar tu contraseña. ¡Revisa tu bandeja, pana! 🤝');
    } catch (e) {
      console.error('Error reset pass:', e);
      if (e.code === 'functions/not-found') {
        alert('No encontramos una cuenta con ese email.');
      } else {
        alert('Error al enviar el email. Inténtalo de nuevo.');
      }
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
          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="clay-btn-google w-full flex items-center justify-center gap-[10px] text-[13px] font-bold text-[#1A1A3A] mb-6 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.2727C23.52 11.4218 23.4436 10.6036 23.3018 9.81816H12V14.4545H18.4582C18.18 15.9545 17.3345 17.2363 16.0527 18.0927V21.1036H19.9364C22.2055 19.0145 23.52 15.9272 23.52 12.2727Z" fill="#4285F4"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0001 24.0001C15.2401 24.0001 17.9674 22.9256 19.9365 21.1037L16.0528 18.0928C14.9892 18.8074 13.6146 19.2274 12.0001 19.2274C8.87464 19.2274 6.22373 17.1165 5.27464 14.2801H1.26013V17.3946C3.23467 21.3165 7.28195 24.0001 12.0001 24.0001Z" fill="#34A853"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M5.27451 14.2799C5.03451 13.5599 4.89814 12.7908 4.89814 11.9999C4.89814 11.209 5.02906 10.4399 5.27451 9.71992V6.60535H1.26001C0.458195 8.20353 0 9.9981 0 11.9999C0 14.0017 0.458195 15.7963 1.26001 17.3945L5.27451 14.2799Z" fill="#FBBC05"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12.0001 4.77273C13.7619 4.77273 15.3382 5.37818 16.5819 6.56727L20.0237 3.12545C17.9619 1.19455 15.2346 0 12.0001 0C7.28195 0 3.23467 2.68364 1.26013 6.60545L5.27464 9.72C6.22373 6.88364 8.87464 4.77273 12.0001 4.77273Z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>


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
            <a 
              href="#" 
              onClick={handleForgotPassword}
              className="text-[12px] font-bold text-[#2D2D5E] underline opacity-70 hover:opacity-100 transition-opacity"
            >
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
