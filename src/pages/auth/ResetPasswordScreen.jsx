import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const oobCode = searchParams.get('oobCode');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('verifying'); // verifying | ready | success | invalid

  useEffect(() => {
    if (!oobCode) {
      setStatus('invalid');
      setErrorMsg('No se proporcionó un código válido o el enlace ha expirado.');
      return;
    }
    
    // Verificar que el código es válido antes de dejar setear
    verifyPasswordResetCode(auth, oobCode)
      .then((emailFromCode) => {
        setEmail(emailFromCode);
        setStatus('ready');
      })
      .catch((err) => {
        console.error(err);
        setStatus('invalid');
        setErrorMsg('El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.');
      });
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF5] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-5%] left-[-10%] w-64 h-64 bg-[#E0E5EC] rounded-full blur-2xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#E0E5EC] rounded-full blur-3xl opacity-60 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#E8E8F0] shadow-[10px_10px_20px_rgba(180,180,210,0.4),-10px_-10px_20px_rgba(255,255,255,1)] rounded-[32px] p-8 z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1A1A3A] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
            🔐
          </div>
          <h2 className="text-[24px] font-black text-[#1A1A3A] mb-2 leading-tight">
            Restablecer<br/>Contraseña
          </h2>
          {email && (
            <p className="text-[13px] font-bold text-[#8888AA]">
              para <span className="text-[#1A1A3A]">{email}</span>
            </p>
          )}
        </div>

        {status === 'verifying' && (
          <div className="flex justify-center p-4">
            <span className="text-[#8888AA] font-bold animate-pulse text-[14px]">Verificando enlace...</span>
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <div className="bg-[#FFE5E5] p-4 rounded-[16px] mb-6 shadow-[inset_2px_2px_5px_rgba(255,0,0,0.1)]">
              <AlertTriangle className="text-[#D90429] w-8 h-8 mx-auto mb-2" />
              <p className="text-[#D90429] text-[13px] font-bold leading-snug">{errorMsg}</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="font-bold text-[#1A1A3A] hover:text-[#555577] transition-colors"
            >
              Volver al Login
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="bg-[#E5F5E5] p-6 rounded-[20px] mb-6 shadow-[inset_3px_3px_6px_rgba(0,180,0,0.1)] border border-[#CCEECC]">
              <CheckCircle className="text-[#00B400] w-10 h-10 mx-auto mb-3" />
              <h3 className="text-[#00B400] text-[18px] font-black mb-1">¡Listo, pana!</h3>
              <p className="text-[#00B400]/80 text-[13px] font-bold leading-snug">Tu contraseña ha sido actualizada correctamente.</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-[#1A1A3A] text-white font-black text-[15px] py-[15px] rounded-[18px] shadow-[4px_6px_14px_rgba(26,26,58,0.2)] active:scale-95 transition-all"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[6px] ml-1">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-[14px] bg-[#E8E8F0] rounded-[18px] outline-none border-none shadow-[inset_4px_4px_8px_rgba(180,180,210,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-[15px] font-bold text-[#1A1A3A] focus:shadow-[inset_4px_4px_8px_rgba(180,180,210,0.7),inset_-4px_-4px_8px_rgba(255,255,255,1),0_0_0_2px_#FFB400_inset]" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-[#1A1A3A] active:scale-90 transition-all focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-[#666688] block mb-[6px] ml-1">Repetir Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-[14px] bg-[#E8E8F0] rounded-[18px] outline-none border-none shadow-[inset_4px_4px_8px_rgba(180,180,210,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-[15px] font-bold text-[#1A1A3A] focus:shadow-[inset_4px_4px_8px_rgba(180,180,210,0.7),inset_-4px_-4px_8px_rgba(255,255,255,1),0_0_0_2px_#FFB400_inset]" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-[#1A1A3A] active:scale-90 transition-all focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-[#FFE5E5] px-4 py-3 rounded-[16px] shadow-[inset_2px_2px_5px_rgba(255,0,0,0.1)] border border-[#FFCCCC]">
                <p className="text-[12px] font-bold text-[#D90429] leading-tight text-center">
                  {errorMsg}
                </p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-br from-[#FFB400] to-[#FF9000] text-white font-black text-[16px] py-[15px] rounded-[18px] shadow-[4px_6px_14px_rgba(255,160,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.5)] active:scale-95 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              disabled={loading}
              className="w-full mt-2 font-bold text-[13px] text-[#8888AA] hover:text-[#1A1A3A] transition-colors"
            >
              Cancelar
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
