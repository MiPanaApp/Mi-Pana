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


      <div
        className="flex justify-around items-center px-2 py-2"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = isActive ? item.IconFilled : item.IconOutline;

          // --- Botón Central "Anunciar" (FAB 3D Claymorphism) ---
          if (item.isCentral) {
            return (
              <div key={item.id} className="relative -top-6 flex flex-col items-center pointer-events-auto">
                <motion.button
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 rounded-full bg-[#E0E5EC] flex items-center justify-center shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.7),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] border-4 border-[#E0E5EC] z-50 transition-all"
                >
                  {/* Círculo interno (Acento) hundido con color Azul Mi Pana (#1A1A3A) */}
                  <div className="bg-[#1A1A3A] w-10 h-10 rounded-full flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                     </svg>
                  </div>
                </motion.button>
                {/* Texto debajo */}
                <span className="text-[10px] font-black text-[#1A1A3A] mt-1 uppercase tracking-tight">{item.label}</span>
              </div>
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
                  : 'bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] text-[#1A1A3A]/60 hover:text-[#0056B3]'
                }
              `}>
                <Icon size={22} className="transition-colors duration-300" />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-[#0056B3]' : 'text-[#1A1A3A]/60'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
