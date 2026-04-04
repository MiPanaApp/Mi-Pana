import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MessageSquare, Send, Loader2, CheckCircle2, Headphones } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
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

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
      setIsSelectOpen(false);
      setIsPrefixOpen(false);
      setFormData({
        fullName: '',
        email: '',
        phonePrefix: '+34',
        phone: '',
        subject: 'Consulta General',
        message: '',
        honeypot: ''
      });
    }
  }, [isOpen]);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.honeypot) return onClose(); // Bloqueo silencioso de bots

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
      // 🛠️ INTEGRACIÓN CON TU URL REAL DE FIREBASE
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
      setTimeout(() => onClose(), 3500);
    } catch (err) {
      console.error("Error enviando email:", err);
      setError('Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full md:max-w-[800px] bg-white rounded-[32px] overflow-hidden shadow-[20px_20px_60px_rgba(163,177,198,0.5),-20px_-20px_60px_rgba(255,255,255,0.8)] border border-white/40"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-[#D90429] shadow-[4px_4px_10px_rgba(163,177,198,0.3),-4px_-4px_10px_rgba(255,255,255,0.8)] active:scale-90 transition-all z-10"
            >
              <X size={16} />
            </button>

            {success ? (
              <div className="p-8 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5 shadow-[inset_4px_4px_8px_rgba(0,128,0,0.1)]"
                >
                  <CheckCircle2 size={32} className="text-green-500" />
                </motion.div>
                <h2 className="text-xl font-black text-[#1A1A3A] mb-2">¡Mensaje Enviado!</h2>
                <p className="text-[13px] text-[#8888AA] font-bold leading-relaxed px-4">
                  ¡Pana, tu mensaje se envió con éxito!<br />Te responderemos pronto.
                </p>
                <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[14px] bg-red-50 flex items-center justify-center shadow-sm">
                    <Headphones size={24} className="text-[#D90429]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1A1A3A] leading-tight">Contactar Soporte</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex="-1" value={formData.honeypot} onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#8888AA] ml-2 tracking-widest flex items-center gap-1.5">
                        <User size={11} className="text-[#0056B3]" /> Nombre Completo <span className="text-[#D90429] ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Ej: Pedro Perez"
                        className="w-full p-3 bg-white rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-[13px] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#8888AA] ml-2 tracking-widest flex items-center gap-1.5">
                        <Mail size={11} className="text-[#0056B3]" /> Correo Electrónico <span className="text-[#D90429] ml-0.5">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tu@email.com"
                        className="w-full p-3 bg-white rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-[13px] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-[#8888AA] ml-2 tracking-widest flex items-center gap-1.5">
                        <Phone size={11} className="text-[#0056B3]" /> Teléfono
                      </label>
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsPrefixOpen(!isPrefixOpen)}
                            className="h-full px-3 bg-white rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent flex items-center gap-1.5 font-bold text-[#1A1A3A] text-xs"
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden border border-[#003366]/20 bg-[#E0E5EC] flex-shrink-0 relative">
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
                                className="absolute top-full left-0 mt-1.5 bg-white/95 backdrop-blur-xl rounded-[18px] shadow-[15px_15px_30px_rgba(0,0,0,0.1)] border border-white/50 p-1 z-[10002] w-[160px] h-[200px] overflow-y-auto custom-scrollbar"
                              >
                                {countries.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, phonePrefix: c.code });
                                      setIsPrefixOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between ${formData.phonePrefix === c.code ? 'bg-[#0056B3] text-white' : 'text-[#1A1A3A] hover:bg-black/5'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full overflow-hidden border border-[#003366]/20 bg-[#E0E5EC] flex-shrink-0 relative">
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
                          className="flex-1 p-3 bg-white rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-xs transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-[11px] font-black text-[#8888AA] ml-2 tracking-widest flex items-center gap-1.5">
                        <MessageSquare size={11} className="text-[#0056B3]" /> Asunto
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSelectOpen(!isSelectOpen)}
                          className="w-full p-3 bg-white rounded-[15px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-xs text-left flex items-center justify-between transition-all"
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
                              className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-xl rounded-[18px] shadow-[15px_15px_30px_rgba(0,0,0,0.1)] border border-white/50 p-1 z-[10001] overflow-hidden"
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
                    <label className="text-[11px] font-black text-[#8888AA] ml-2 tracking-widest flex items-center gap-1.5">
                      <MessageSquare size={11} className="text-[#0056B3]" /> Mensaje <span className="text-[#D90429] ml-0.5">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      className="w-full p-3 bg-white rounded-[18px] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] border border-transparent focus:border-[#0056B3]/20 outline-none font-bold text-[#1A1A3A] text-xs resize-none transition-all"
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-bold text-[#D90429] ml-2">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`group relative w-full py-4 rounded-[20px] font-black text-white uppercase tracking-widest text-[13px] transition-all active:scale-[0.98] overflow-hidden
                      ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1A1A3A] hover:bg-[#000000] shadow-[0_8px_16px_rgba(26,26,58,0.3),inset_-2px_-4px_8px_rgba(0,0,0,0.2),inset_2px_4px_8px_rgba(255,255,255,0.2)]'}
                    `}
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Enviar Mensaje</>}
                    </div>
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ChevronDown({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}