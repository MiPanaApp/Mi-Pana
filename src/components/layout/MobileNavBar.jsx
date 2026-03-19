import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IoHomeOutline, IoHome,
  IoHeartOutline, IoHeart,
  IoChatbubblesOutline, IoChatbubbles,
  IoPersonCircleOutline, IoPersonCircle,
  IoAddCircle
} from 'react-icons/io5';

const NAV_ITEMS = [
  { 
    id: 'home', 
    label: 'Inicio', 
    path: '/home', 
    IconOutline: IoHomeOutline, 
    IconFilled: IoHome 
  },
  { 
    id: 'favorites', 
    label: 'Favoritos', 
    path: '/favoritos', 
    IconOutline: IoHeartOutline, 
    IconFilled: IoHeart 
  },
  { 
    id: 'create', 
    label: 'Anunciar', 
    path: '/anunciar', 
    isCentral: true,
    IconOutline: IoAddCircle, 
    IconFilled: IoAddCircle
  },
  { 
    id: 'messages', 
    label: 'Mensajes', 
    path: '/mensajes', 
    IconOutline: IoChatbubblesOutline, 
    IconFilled: IoChatbubbles 
  },
  { 
    id: 'profile', 
    label: 'Mi Perfil', 
    path: '/perfil', 
    IconOutline: IoPersonCircleOutline, 
    IconFilled: IoPersonCircle 
  },
];

export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-[#E0E5EC]/80 backdrop-blur-md shadow-[0_-5px_20px_rgba(163,177,198,0.4)]">
      {/* Línea tricolor Venezuela */}
      <div className="flex w-full h-[3px]">
        <div className="flex-1 bg-[#FFCC00]"></div>
        <div className="flex-1 bg-[#003366]"></div>
        <div className="flex-1 bg-[#D90429]"></div>
      </div>

      <div
        className="flex justify-around items-center px-2 py-2"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = isActive ? item.IconFilled : item.IconOutline;

          // --- Botón Central "Anunciar" ---
          if (item.isCentral) {
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center gap-0.5 -mt-6"
              >
                <div className="w-[58px] h-[58px] rounded-full bg-[#1A1A3A] flex items-center justify-center shadow-[6px_6px_12px_rgba(0,0,0,0.2),-2px_-2px_8px_rgba(255,255,255,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]">
                  <Icon size={28} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-[#1A1A3A] tracking-tight mt-0.5">
                  {item.label}
                </span>
              </motion.button>
            );
          }

          // --- Botones normales ---
          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.90 }}
              className="flex flex-col items-center gap-0.5 px-2 py-1"
            >
              <div className={`
                w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isActive
                  ? 'bg-[#E0E5EC] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] text-[#0056B3]'
                  : 'bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] text-gray-400 hover:text-[#0056B3]'
                }
              `}>
                <Icon size={22} className="transition-colors duration-300" />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-[#0056B3]' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
