import { useState } from 'react';
import { FaInstagram, FaTwitter, FaFacebookF, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { IconPana } from './ui/IconPana';
import { LegalData } from '../data/LegalData';
import LegalDrawer from './LegalDrawer';

const Footer = ({ onContactClick }) => {
  const [legalDocs, setLegalDocs] = useState({ isOpen: false, title: '', content: '' });

  const openLegal = (key) => {
    const doc = LegalData[key];
    if (doc) {
      setLegalDocs({ isOpen: true, title: doc.title, content: doc.content });
    }
  };

  return (
    <footer className="relative z-10 w-full pt-16 pb-12 px-6 bg-white/50 backdrop-blur-sm mt-12 md:mt-0">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h3 className="text-4xl font-black text-pana-blue tracking-tighter">Mi Pana</h3>
            <p className="text-gray-500 max-w-sm leading-relaxed font-medium">
              Conectando a la diáspora venezolana con servicios y productos de confianza. 
              Calidad y comunidad en un solo lugar.
            </p>
            <div className="flex gap-4 pt-2">
              {[
                { icon: FaXTwitter, label: 'x', color: 'hover:text-black' },
                { icon: FaInstagram, label: 'Instagram', color: 'hover:text-pink-500' },
                { icon: FaFacebookF, label: 'Facebook', color: 'hover:text-blue-600' },
                { icon: FaYoutube, label: 'Youtube', color: 'hover:text-red-600' },
                { icon: FaTiktok, label: 'tiktok', color: 'hover:text-black' }
              ].map((item, i) => (
                <button key={i} className={`transition-all duration-300 ${item.color}`} title={item.label}>
                  <IconPana icon={item.icon} size={20} className="w-12 h-12 bg-white shadow-clay-icon border-white/50" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-black text-pana-blue uppercase text-xs tracking-widest mb-8 text-nowrap">Plataforma Mi Pana</h4>
            <ul className="space-y-4 text-gray-500 font-bold text-sm">
              <li><button onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                detail: { 
                  title: 'Sobre Mi Pana', 
                  content: `
                    <div class="space-y-4">
                        <p class="text-lg font-black text-[#0056B3]">Mucho más que una App, somos tu Comunidad 🇻🇪</p>
                        <p><b>¿Qué es Mi Pana?</b> Es ese abrazo que te da un paisano cuando llegas a una ciudad nueva. Es la respuesta a la pregunta: “¿Dónde puedo conseguir lo que necesito?” y la oportunidad de decir: “Aquí estoy, esto es lo que sé hacer”.</p>
                        <p>Mi Pana nació de una idea simple pero poderosa: <b>que ningún venezolano en el exterior se sienta solo en su emprendimiento</b>. Somos el punto de encuentro donde el talento que salió de nuestras fronteras se encuentra con quienes quieren apoyarlo.</p>
                        
                        <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#FFD700] my-4 shadow-sm">
                          <p class="font-bold text-[#1A1A3A] mb-1">¿De qué va nuestra plataforma?</p>
                          <p class="text-sm">Aquí no solo intercambiamos productos o servicios; intercambiamos historias de superación.</p>
                        </div>

                        <ul class="space-y-4">
                          <li class="flex gap-3">
                            <span class="text-[#0056B3]">💎</span>
                            <span><b>Es tu vitrina al mundo:</b> Si cocinas con sazón de hogar, si eres el mejor reparando lo que otros dan por perdido, o si ofreces servicios profesionales con sello de excelencia, este es tu lugar para brillar.</span>
                          </li>
                          <li class="flex gap-3">
                            <span class="text-[#0056B3]">🤝</span>
                            <span><b>Es confianza compartida:</b> Creamos un espacio seguro donde saber que, detrás de cada anuncio, hay un "Pana" trabajando duro por sus sueños, igual que tú.</span>
                          </li>
                          <li class="flex gap-3">
                            <span class="text-[#0056B3]">💪</span>
                            <span><b>Es nuestra red de apoyo:</b> Queremos que prosperes. Por eso, nos esfuerzos en conectar tus manos trabajadoras con las necesidades de nuestra gente y de la comunidad que nos recibe.</span>
                          </li>
                        </ul>

                        <div class="mt-8 p-5 bg-[#1A1A3A] rounded-[22px] text-white">
                          <p class="font-black text-lg mb-2">Nuestra Razón de Ser</p>
                          <p class="text-sm leading-relaxed opacity-90">Creemos que el venezolano no solo emigra, sino que lleva a Venezuela consigo. En cada rincón del mundo hay un emprendedor echando pa' lante, y Mi Pana existe para ser el impulso que necesitas.</p>
                        </div>

                        <p class="text-center font-black text-xl text-[#0056B3] mt-8 pt-4 border-t border-gray-100">Mi Pana: ¡Echa pa' lante, aquí estamos contigo!</p>
                      </div>
                  `
                } 
              }))} className="hover:text-pana-yellow transition-colors text-left font-bold">Sobre Mi Pana</button></li>
              <li><button onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                detail: { 
                  title: '¿Cómo funciona?', 
                  content: `
                    <div class="space-y-6">
                          <p class="text-lg font-black text-[#0056B3]">¡Sácale el jugo a Mi Pana! Guía paso a paso 🚀</p>
                          <p class="text-sm font-medium text-[#555577] leading-relaxed">Bienvenido a tu nueva herramienta de crecimiento. Usar Mi Pana es tan sencillo como enviar un mensaje, pero aquí te explicamos cómo aprovechar cada rincón de la app.</p>

                          <div class="space-y-4 pt-2">
                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#FFD700] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">1.</span> Encuentra lo que buscas 🔍</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">En la pantalla de Inicio, verás la barra: <b>“¿Qué necesitas, pana?”</b>.<br/><br/><b>Cómo usarla:</b> Escribe una palabra clave (ej. "Cachapas", "Mecánico") y la app te mostrará las mejores opciones cerca de ti.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#0056B3] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">2.</span> Publica tu primer anuncio ➕</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">¿Tienes un talento o un producto? <b>Dale al botón "+" (ANUNCIAR)</b> en el centro del menú inferior.<br/><br/><i class="text-[#0056B3] font-bold">El secreto: Sube fotos claras y describe tu servicio con honestidad. ¡La confianza es la clave!</i></p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-[#1A1A3A] shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">3.</span> Gestiona tu negocio 📋</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Si ya publicaste, busca la sección <b>Mis Anuncios</b> en tu perfil. Allí verás cuántas personas han visto tu publicación y podrás editar el precio o pausarla si te quedaste sin stock.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-red-400 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">4.</span> Guarda tus favoritos ❤️</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Pulsando el <b>Corazón</b> en cualquier anuncio, se guardará automáticamente en tu sección de Favoritos del menú inferior.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-green-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">5.</span> Conecta directo por Mensajes 💬</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Dentro de cualquier anuncio verás un botón para contactar. Se abrirá un <b>Chat Privado</b> donde podrás acordar detalles y entregas de forma segura.</p>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-2xl border-l-4 border-purple-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] flex items-center gap-2 mb-1.5"><span class="text-lg text-[#0056B3]">6.</span> Tu Perfil: Tu carta de presentación 👤</p>
                              <p class="text-[13px] leading-relaxed text-[#555577]">Mantén tu perfil al día y gestiona tu <b>Verificación</b>. Una cuenta verificada vende hasta 3 veces más.</p>
                            </div>
                          </div>

                          <div class="mt-6 p-5 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-[25px] flex items-start gap-4 shadow-sm">
                            <span class="text-2xl">💡</span>
                            <div>
                              <p class="font-black text-[#1A1A3A] text-sm">Consejo Pro:</p>
                              <p class="text-[12px] text-[#555577] mt-1 font-bold">¡La rapidez en responder te hace destacar! Revisa tus notificaciones para no perderte clientes.</p>
                            </div>
                          </div>
                        </div>
                  `
                } 
              }))} className="hover:text-pana-yellow transition-colors text-nowrap">¿Cómo funciona?</button></li>
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors text-left text-nowrap">Verificación de Pana</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-pana-blue uppercase text-xs tracking-widest mb-8 text-nowrap">Soporte Mi Pana</h4>
            <ul className="space-y-4 text-gray-500 font-bold text-sm flex flex-col items-start">
              <li><button onClick={onContactClick} className="hover:text-pana-yellow transition-colors">Contactar</button></li>
              <li><button onClick={() => openLegal('terms')} className="hover:text-pana-yellow transition-colors text-left">Condiciones de Contratación</button></li>
              <li><button onClick={() => openLegal('privacy')} className="hover:text-pana-yellow transition-colors text-left">Políticas de Privacidad</button></li>
              <li><button onClick={() => openLegal('cookies')} className="hover:text-pana-yellow transition-colors text-left">Gestión de Cookies</button></li>
              <li><button onClick={() => window.dispatchEvent(new CustomEvent('open-info', { 
                detail: { 
                  title: 'Seguridad Mi Pana', 
                  content: `
                    <div class="space-y-6">
                          <p class="text-lg font-black text-[#D90429] flex items-center gap-2">Tu seguridad es nuestra prioridad 🛡️</p>
                          <p class="text-sm font-medium text-[#555577] leading-relaxed">En Mi Pana, trabajamos para construir un entorno confiable, pero la seguridad la hacemos entre todos.</p>

                          <div class="space-y-4 pt-2">
                            <div class="bg-blue-50 p-4 rounded-2xl border-l-4 border-[#0056B3] shadow-sm">
                              <p class="font-black text-[#1A1A3A] text-sm mb-2">1. Consejos para Compradores</p>
                              <ul class="space-y-3 text-[12px] text-[#555577] leading-relaxed">
                                <li><b>Verifica:</b> Prioriza anuncios con el sello de <b>"Verificación Mi Pana"</b>.</li>
                                <li><b>Desconfía:</b> Si un precio es demasiado bajo, investiga más antes de avanzar.</li>
                                <li><b>Pagos:</b> Recomendamos no adelantar dinero sin contacto previo claro por chat.</li>
                              </ul>
                            </div>

                            <div class="bg-orange-50/50 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                              <p class="font-black text-[#1A1A3A] text-sm mb-2">2. Consejos para Emprendedores</p>
                              <ul class="space-y-3 text-[12px] text-[#555577] leading-relaxed">
                                <li><b>Protección:</b> Nunca compartas contraseñas o datos bancarios sensibles.</li>
                                <li><b>Entregas:</b> Procura quedar en lugares concurridos y horarios diurnos.</li>
                              </ul>
                            </div>

                            <div class="bg-red-50 p-4 rounded-2xl border-l-4 border-[#D90429] shadow-sm">
                              <p class="font-black text-[#D90429] text-sm mb-2">3. Comportamientos sospechosos 🚩</p>
                              <p class="text-[11px] text-[#555577] font-bold italic mb-2">Mantente alerta si alguien:</p>
                              <ul class="space-y-2 text-[12px] text-[#555577] list-disc ml-4">
                                <li>Te presiona para cerrar el trato fuera de la app inmediatamente.</li>
                                <li>Envía enlaces extraños o solicita códigos de tu teléfono.</li>
                                <li>Su lenguaje es inconsistente o evita preguntas directas.</li>
                              </ul>
                            </div>
                          </div>

                          <div class="mt-6 p-5 bg-[#1A1A3A] rounded-[25px] text-white shadow-clay">
                            <p class="font-black text-lg mb-2">Nuestro compromiso</p>
                            <p class="text-[12px] leading-relaxed opacity-90">Detectamos actividades inusuales, pero tu reporte es vital. Usa el botón <b>"Reportar"</b> y revisaremos el caso de inmediato.</p>
                          </div>

                          <p class="text-center font-black text-xs text-[#8888AA] mt-8 italic px-4 leading-relaxed">Navega con confianza, pero siempre con sentido común. ¡En Mi Pana nos cuidamos!</p>
                        </div>
                  `
                } 
              }))} className="hover:text-pana-yellow transition-colors text-left">Seguridad</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">
          <span>© 2026 Mi Pana Marketplace. Madrid - Caracas.</span>
          <div className="flex gap-6">
             <span>Venezuela 🇻🇪</span>
             <span>Hecho con ❤️ por Panas</span>
          </div>
        </div>
      </div>

      <LegalDrawer 
        isOpen={legalDocs.isOpen} 
        onClose={() => setLegalDocs({ ...legalDocs, isOpen: false })} 
        title={legalDocs.title} 
        content={legalDocs.content} 
      />
    </footer>
  )
}

export default Footer;
