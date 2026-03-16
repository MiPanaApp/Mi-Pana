import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUser, FiSettings, FiShare2, FiX, FiInstagram, FiFacebook, FiTwitter, FiMessageCircle } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio', icon: FiHome, path: '/home' },
  { id: 'perfil', label: 'Perfil', icon: FiUser, path: '/perfil' },
  { id: 'config', label: 'Config', icon: FiSettings, path: '/config' },
  { id: 'share', label: 'Compartir', icon: FiShare2, isAction: true },
];

const SOCIAL_LINKS = [
  { id: 'wa', label: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', href: 'https://wa.me/' },
  { id: 'ig', label: 'Instagram', icon: FaInstagram, color: '#E1306C', href: 'https://instagram.com/' },
  { id: 'tt', label: 'TikTok', icon: FaTiktok, color: '#1a1a1a', href: 'https://tiktok.com/' },
  { id: 'tw', label: 'X (Twitter)', icon: FaXTwitter, color: '#000000', href: 'https://x.com/' },
  { id: 'fb', label: 'Facebook', icon: FaFacebookF, color: '#1877F2', href: 'https://facebook.com/' },
];

export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rrssOpen, setRrssOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {rrssOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRrssOpen(false)}
            className="fixed inset-0 z-40 bg-[#E0E5EC]/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rrssOpen && (
          <motion.div
            key="rrss-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed bottom-24 right-4 z-50 bg-[#E0E5EC] rounded-[2.5rem] p-4 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] flex flex-col gap-4 md:hidden"
          >
            {SOCIAL_LINKS.map((s, i) => (
              <motion.a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E0E5EC] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] transition-all"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E0E5EC] shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]" style={{ color: s.color }}>
                  <s.icon size={18} />
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-[#E0E5EC] border-t border-white/20 shadow-[0_-5px_15px_rgba(163,177,198,0.3)]">
        {/* Línea tricolor VZLA */}
        <div className="flex w-full h-[3px]">
          <div className="flex-1 bg-[#FFCC00]"></div>
          <div className="flex-1 bg-[#003366]"></div>
          <div className="flex-1 bg-[#D90429]"></div>
        </div>

        <div 
          className="flex justify-around items-center px-4 py-3 h-20"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.isAction ? rrssOpen : location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.isAction) {
                    setRrssOpen(!rrssOpen);
                  } else {
                    navigate(item.path);
                    setRrssOpen(false);
                  }
                }}
                whileTap={{ scale: 0.90 }}
                className={`
                  flex items-center justify-center
                  w-14 h-12 rounded-2xl
                  transition-all duration-300
                  ${isActive
                    ? 'bg-[#E0E5EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-[#0056B3]'
                    : 'bg-[#E0E5EC] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.8)] text-gray-400'
                  }
                `}
              >
                {item.id === 'share' && rrssOpen ? (
                  <FiX size={22} className="text-[#D90429]" />
                ) : (
                  <Icon size={22} className="transition-colors duration-300" />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
