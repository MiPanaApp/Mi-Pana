import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MessageSquare, Send, Loader2, CheckCircle2, Headphones, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoFull from '../assets/solotexto.png';

function ChevronDown({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    phonePrefix: '+34',
    subject: 'Consulta General',
    message: '',
    honeypot: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);

  const countries = [
    { code: '+34', iso: 'ES', name: 'España' },
    { code: '+57', iso: 'CO', name: 'Colombia' },
    { code: '+1', iso: 'US', name: 'USA' },
    { code: '+593', iso: 'EC', name: 'Ecuador' },
    { code: '+507', iso: 'PA', name: 'Panamá' },
    { code: '+51', iso: 'PE', name: 'Perú' },
    { code: '+1', iso: 'DO', name: 'Rep. Dom.' },
    { code: '+54', iso: 'AR', name: 'Argentina' },
    { code: '+56', iso: 'CL', name: 'Chile' },
  ];

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.honeypot) return;

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Por favor, rellena los campos obligatorios.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('El formato del correo no es válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://sendcontactemail-6c5p6jkkyq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: `${formData.phonePrefix} ${formData.phone}`,
          subject: formData.subject,
          message: formData.message
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) throw new Error('Error en el servidor');

      setSuccess(true);
    } catch (err) {
      console.error("Error enviando email:", err);
      setError('Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoFull} alt="Mi Pana" className="h-14 md:h-24 object-contain" />
          </div>
          <button
            onClick={() => navigate('/home')}
            className="text-sm font-bold text-[#1A1A3A]/70 hover:text-[#1A1A3A] transition-colors"
          >
            Volver a Mi Pana
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-14 w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 flex-shrink-0 rounded-[16px] bg-[#E0E5EC] flex items-center justify-center shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]">
              <Headphones size={20} className="text-[#D90429]" />
            </div>
            <h1 className="text-3xl font-semibold text-[#1A1A3A] tracking-tight">Centro de Soporte</h1>
          </div>
          <p className="text-base text-[#555577] font-medium max-w-xl mx-auto leading-relaxed">
            Estamos aquí para ayudarte, pana. Te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#E0E5EC] rounded-[28px] p-6 shadow-[10px_10px_20px_#b8b9be,-10px_-10px_20px_#ffffff] space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Mail size={20} className="text-[#0056B3]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A3A] text-base mb-0.5">Correo directo</h3>
                  <p className="text-sm text-[#555577] font-medium leading-relaxed">
                    Respondemos todos los mensajes por email en un plazo breve.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/60" />

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Clock size={20} className="text-[#FFB400]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A3A] text-base mb-0.5">Tiempo de respuesta</h3>
                  <p className="text-sm text-[#555577] font-medium leading-relaxed">
                    Revisamos y respondemos en horario laboral.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/60" />

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <ShieldCheck size={20} className="text-[#00C97A]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A3A] text-base mb-0.5">Seguridad y confianza</h3>
                  <p className="text-sm text-[#555577] font-medium leading-relaxed">
                    Escríbenos también para reportar anuncios o cuentas sospechosas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {success ? (
              <div className="bg-[#E0E5EC] rounded-[32px] p-10 flex flex-col items-center text-center shadow-[10px_10px_20px_#b8b9be,-10px_-10px_20px_#ffffff] h-full justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-5 shadow-[inset_4px_4px_8px_rgba(0,128,0,0.1)]"
                >
                  <CheckCircle2 size={32} className="text-green-500" />
                </motion.div>
                <h2 className="text-xl font-black text-[#1A1A3A] mb-2">¡Mensaje Enviado!</h2>
                <p className="text-[13px] text-[#555577] font-bold leading-relaxed px-4">
                  ¡Pana, tu mensaje se envió con éxito!<br />Te responderemos pronto.
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="mt-6 bg-gradient-to-r from-[#FFB400] to-[#FF9000] text-white font-black px-6 py-3 rounded-2xl hover:brightness-110 transition-all shadow-[0_4px_14px_rgba(255,180,0,0.3)]"
                >
                  Volver a Mi Pana
                </button>
              </div>
            ) : (
              <div className="bg-[#E0E5EC] rounded-[32px] p-8 shadow-[10px_10px_20px_#b8b9be,-10px_-10px_20px_#ffffff]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex="-1" value={formData.honeypot} onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-[#555577] ml-2 flex items-center gap-1.5">
                        <User size={11} className="text-[#0056B3]" /> Nombre Completo <span className="text-[#D90429] ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ej: Pedro Perez"
                        className="w-full p-3.5 bg-[#E0E5EC] rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-base transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-[#555577] ml-2 flex items-center gap-1.5">
                        <Mail size={11} className="text-[#0056B3]" /> Correo Electrónico <span className="text-[#D90429] ml-0.5">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tu@email.com"
                        className="w-full p-3.5 bg-[#E0E5EC] rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-base transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-[#555577] ml-2 flex items-center gap-1.5">
                        <Phone size={11} className="text-[#0056B3]" /> Teléfono
                      </label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsPrefixOpen(!isPrefixOpen)}
                            className="h-full px-3 bg-[#E0E5EC] rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent flex items-center gap-1.5 font-bold text-[#1A1A3A] text-xs"
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden border border-[#003366]/20 bg-white flex-shrink-0 relative">
                              <img
                                src={`https://flagcdn.com/w80/${countries.find(c => c.code === formData.phonePrefix)?.iso.toLowerCase() || 'es'}.png`}
                                alt="flag"
                                className="w-full h-full object-cover absolute inset-0"
                              />
                            </div>
                            <span>{formData.phonePrefix}</span>
                          </button>

                          <AnimatePresence>
                            {isPrefixOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 mt-1.5 bg-white/95 backdrop-blur-xl rounded-[18px] shadow-[15px_15px_30px_rgba(0,0,0,0.1)] border border-white/50 p-1 z-[100] w-[160px] h-[200px] overflow-y-auto custom-scrollbar"
                              >
                                {countries.map((c) => (
                                  <button
                                    key={c.iso}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, phonePrefix: c.code });
                                      setIsPrefixOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between ${formData.phonePrefix === c.code ? 'bg-[#0056B3] text-white' : 'text-[#1A1A3A] hover:bg-black/5'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full overflow-hidden border border-[#003366]/20 bg-white flex-shrink-0 relative">
                                        <img
                                          src={`https://flagcdn.com/w80/${c.iso.toLowerCase()}.png`}
                                          alt={c.name}
                                          className="w-full h-full object-cover absolute inset-0"
                                        />
                                      </div>
                                      <span>{c.name}</span>
                                    </div>
                                    <span className="opacity-60">{c.code}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Número"
                          className="flex-1 p-3.5 bg-[#E0E5EC] rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-base transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-sm font-semibold text-[#555577] ml-2 flex items-center gap-1.5">
                        <MessageSquare size={11} className="text-[#0056B3]" /> Asunto
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSelectOpen(!isSelectOpen)}
                          className="w-full p-3.5 bg-[#E0E5EC] rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-xs text-left flex items-center justify-between transition-all"
                        >
                          {formData.subject}
                          <div className={`text-gray-400 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`}>
                            <ChevronDown size={12} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isSelectOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-xl rounded-[18px] shadow-[15px_15px_30px_rgba(0,0,0,0.1)] border border-white/50 p-1 z-[100] overflow-hidden"
                            >
                              {['Consulta General', 'Problemas con mi cuenta', 'Denunciar un anuncio', 'Sugerencias', 'Otro'].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, subject: opt });
                                    setIsSelectOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${formData.subject === opt ? 'bg-[#0056B3] text-white shadow-lg' : 'text-[#1A1A3A] hover:bg-black/5'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#555577] ml-2 flex items-center gap-1.5">
                      <MessageSquare size={11} className="text-[#0056B3]" /> Mensaje <span className="text-[#D90429] ml-0.5">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      className="w-full p-3.5 bg-[#E0E5EC] rounded-[18px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-base resize-none transition-all"
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[11px] font-bold text-[#D90429] ml-2">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full py-4 rounded-[20px] font-black text-white uppercase tracking-widest text-[13px] transition-all active:scale-[0.98] overflow-hidden
                      ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#1A1A3A] to-[#2D2D4E] hover:brightness-110 shadow-[0_8px_16px_rgba(26,26,58,0.3)]'}
                    `}
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Enviar Mensaje</>}
                    </div>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm font-medium text-[#555577]">
        © 2026 Mi Pana. Todos los derechos reservados.
      </footer>
    </div>
  );
}
