import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send, ArrowRight } from "lucide-react";
import useOtpVerification from "../../hooks/useOtpVerification";
import PhonePrefixSelect from "../../components/auth/PhonePrefixSelect";
import OtpInput from "../../components/auth/OtpInput";
import ProfileBottomSheet from "../../components/auth/ProfileBottomSheet";
import logoTexto from "../../assets/Logo_Mi_pana_solo_texto_.png";
import "../../styles/auth.css";

export default function RegisterScreen() {
  const [prefix, setPrefix] = useState("+34");
  const [phoneLine, setPhoneLine] = useState("");
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const navigate = useNavigate();

  const { status, error, countdown, sendOtpSms, verifyOtp, resendOtp } = useOtpVerification();

  const handleSend = () => {
    if (phoneLine.length >= 6) {
      sendOtpSms(`${prefix}${phoneLine}`);
    }
  };

  const handleVerify = async (code) => {
    if (code.length === 6) {
      try {
        const user = await verifyOtp(code);
        setAuthUser(user);
        setShowProfileSheet(true);
      } catch (err) {
        // Error is handled in hook
      }
    }
  };

  return (
    <div className="auth-bg">
      <button 
        onClick={() => navigate("/login")}
        className="absolute top-[54px] left-[22px] w-[38px] h-[38px] bg-[#EDEDF5] shadow-[6px_6px_14px_rgba(180,180,210,0.7),-6px_-6px_14px_rgba(255,255,255,0.95)] rounded-[12px] flex items-center justify-center font-bold text-[#1A1A3A] z-20"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-6 pt-[78px]">
        
        <div className="mb-[24px] text-center">
          <img src={logoTexto} alt="miPana" style={{ height: "200px", objectFit: "contain", mixBlendMode: "multiply" }} className="mx-auto" />
        </div>

        <h1 className="text-[20px] font-black text-[#1A1A3A] text-center mb-2 -mt-3">Crea tu cuenta</h1>
        <p className="text-[12px] font-bold text-black text-center leading-[1.6] max-w-[280px] mb-8">
          Ingresa tu número de teléfono. Te enviaremos un código de verificación.
        </p>

        <div className="clay-card-auth w-full max-w-sm mb-8">
          
          <div className="flex gap-[10px] mb-4">
            <PhonePrefixSelect value={prefix} onChange={setPrefix} />
            <div className="flex-1">
              <input 
                type="tel" 
                inputMode="numeric"
                placeholder="612 345 678" 
                value={phoneLine}
                onChange={(e) => setPhoneLine(e.target.value.replace(/\D/g, ''))}
                className="clay-input-auth w-full py-[13px] px-[14px] text-[14px] font-bold text-[#1A1A3A] outline-none placeholder:text-[#AAAACC]"
                disabled={status === "sent" || status === "verifying" || status === "verified"}
              />
            </div>
          </div>

          {!["sent", "verifying", "verified"].includes(status) && (
            <>
              <p className="text-[11px] font-bold text-[#666688] text-center mb-[16px]">
                Recibirás un SMS con un código de 6 dígitos. Pueden aplicar tarifas de mensajería.
              </p>
              
              <button 
                onClick={handleSend}
                disabled={phoneLine.length < 6 || status === "sending"}
                className="clay-btn-auth w-full py-[12px] font-black text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "sending" ? (
                  <>Enviando... <Loader2 size={18} className="animate-spin" /></>
                ) : "Enviar código por SMS"}
              </button>
            </>
          )}

          {["sent", "verifying", "verified"].includes(status) && (
            <div className="mt-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-[#E8E8F0] shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] rounded-[16px] p-4 text-center mb-4">
                <p className="text-[12px] font-bold text-[#8888AA] mb-1 flex items-center justify-center gap-2">
                  <Send size={16} /> Código enviado a {prefix} {phoneLine}
                </p>
                <p className="text-[12px] font-bold text-[#8888AA]">Introdúcelo a continuación</p>
              </div>

              <div className="mb-4 flex justify-center">
                <OtpInput length={6} onComplete={handleVerify} />
              </div>

              <div className="text-center mb-4">
                <span 
                  className={`text-[12px] font-bold underline flex items-center justify-center gap-1 ${countdown === 0 ? "text-[#2D2D5E] cursor-pointer" : "text-[#8888AA]"}`}
                  onClick={() => countdown === 0 && resendOtp(`${prefix}${phoneLine}`)}
                >
                  {countdown === 0 ? (
                    <>¿No llegó el código? Reenviar <ArrowRight size={14} /></>
                  ) : `Reenviar en ${countdown}s`}
                </span>
              </div>

              {status === "verifying" && (
                <button className="w-full py-[12px] bg-[#E8E8F0] text-[#8888AA] rounded-[18px] font-black text-[14px] flex items-center justify-center gap-2">
                  Verificando... <Loader2 size={18} className="animate-spin" />
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="text-[#D90429] text-[12px] font-bold text-center mt-3">{error}</p>
          )}

        </div>

        <div className="text-center pb-8">
          <span className="text-[12px] font-bold text-black">¿Ya tienes cuenta? </span>
          <span className="text-[12px] font-black text-black underline cursor-pointer" onClick={() => navigate("/login")}>
            Iniciar sesión
          </span>
        </div>

      </div>

      <div id="recaptcha-container"></div>

      <ProfileBottomSheet 
        isOpen={showProfileSheet} 
        onClose={() => setShowProfileSheet(false)} 
        authUser={authUser} 
      />
    </div>
  );
}
