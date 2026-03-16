import { FaInstagram, FaTwitter, FaFacebookF } from 'react-icons/fa';
import { IconPana } from './ui/IconPana';

const Footer = () => {
  return (
    <footer className="relative z-10 w-full pt-16 pb-12 px-6 bg-white/50 backdrop-blur-sm mt-12">
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
                { icon: FaInstagram, color: 'hover:text-pink-500' },
                { icon: FaTwitter, color: 'hover:text-blue-400' },
                { icon: FaFacebookF, color: 'hover:text-blue-600' }
              ].map((item, i) => (
                <button key={i} className={`transition-all duration-300 ${item.color}`}>
                  <IconPana icon={item.icon} size={20} className="w-12 h-12 bg-white shadow-clay-icon border-white/50" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-black text-pana-blue uppercase text-xs tracking-widest mb-8">Plataforma</h4>
            <ul className="space-y-4 text-gray-500 font-bold text-sm">
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Sobre Mi Pana</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Vender / Ofertar</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">¿Cómo funciona?</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Verificación de Pana</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-pana-blue uppercase text-xs tracking-widest mb-8">Soporte</h4>
            <ul className="space-y-4 text-gray-500 font-bold text-sm">
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Privacidad y Seguridad</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Términos de Uso</a></li>
              <li><a href="#" className="hover:text-pana-yellow transition-colors">Contacto Directo</a></li>
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
    </footer>
  )
}

export default Footer;
