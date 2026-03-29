import { useState } from 'react';
import { FaInstagram, FaTwitter, FaFacebookF, FaYoutube, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { IconPana } from './ui/IconPana';
import { LegalData } from '../data/LegalData';
import LegalDrawer from './LegalDrawer';

const Footer = () => {
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
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors text-left">Sobre Mi Pana</button></li>
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors text-left text-nowrap">¿Cómo funciona?</button></li>
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors text-left text-nowrap">Verificación de Pana</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black text-pana-blue uppercase text-xs tracking-widest mb-8 text-nowrap">Soporte Mi Pana</h4>
            <ul className="space-y-4 text-gray-500 font-bold text-sm flex flex-col items-start">
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors">Contactar</button></li>
              <li><button onClick={() => openLegal('terms')} className="hover:text-pana-yellow transition-colors text-left">Condiciones de Contratación</button></li>
              <li><button onClick={() => openLegal('privacy')} className="hover:text-pana-yellow transition-colors text-left">Políticas de Privacidad</button></li>
              <li><button onClick={() => openLegal('cookies')} className="hover:text-pana-yellow transition-colors text-left">Gestión de Cookies</button></li>
              <li><button onClick={() => {}} className="hover:text-pana-yellow transition-colors text-left">Seguridad</button></li>
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
