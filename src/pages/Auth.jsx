import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import logoTexto from '../assets/solotexto.png';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, loading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    clearError();
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (mode === 'login') {
      result = await login(form.email, form.password);
    } else {
      result = await register(form.name, form.email, form.password);
    }
    if (result.success) navigate('/home');
  };

  const handleGoogle = async () => {
    const result = await loginWithGoogle();
    if (result.success) navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoTexto} alt="Mi Pana" className="h-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]" />
        </div>

        {/* Card */}
        <div className="bg-[#E0E5EC] rounded-[2.5rem] shadow-[20px_20px_40px_rgba(163,177,198,0.7),-20px_-20px_40px_rgba(255,255,255,0.9)] p-8">
          
          {/* Tabs: Login / Registro */}
          <div className="flex bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] p-1 mb-7">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); clearError(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black tracking-wide transition-all duration-300 ${
                  mode === tab
                    ? 'bg-[#1A1A3A] text-white shadow-[4px_4px_8px_rgba(0,0,0,0.2)]'
                    : 'text-gray-400'
                }`}
              >
                {tab === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 bg-[#D90429]/10 rounded-xl text-[#D90429] text-xs font-bold text-center"
              >
                {error.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Campo Nombre (solo en Registro) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/20 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full h-12 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/20 transition-all"
            />

            {/* Contraseña */}
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full h-12 px-5 bg-[#E0E5EC] rounded-2xl shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A] font-semibold placeholder:text-gray-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A3A]/20 transition-all"
            />

            {/* Botón principal */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="w-full h-14 bg-[#1A1A3A] text-white font-black text-base rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)] transition-all mt-2 disabled:opacity-60"
            >
              {loading ? 'Cargando...' : mode === 'login' ? '¡Entrar, pana! 🚀' : '¡Unirme a Mi Pana!'}
            </motion.button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-300/60" />
            <span className="text-xs text-gray-400 font-semibold">o continúa con</span>
            <div className="flex-1 h-px bg-gray-300/60" />
          </div>

          {/* Botón Google */}
          <motion.button
            onClick={handleGoogle}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full h-12 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] flex items-center justify-center gap-3 font-bold text-sm text-[#1A1A3A] transition-all active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
