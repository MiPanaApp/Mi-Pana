import { UserCircle2, LogOut } from 'lucide-react';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Forzar recarga o navegación para limpiar estados persistentes si es necesario
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-8 relative">
      <div className="p-8 bg-[#E0E5EC] rounded-[3.5rem] shadow-[12px_12px_24px_rgba(163,177,198,0.7),-12px_-12px_24px_rgba(255,255,255,0.95)] mb-2">
        <UserCircle2 size={64} className="text-[#1A1A3A]" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#1A1A3A] tracking-tight">Mi Perfil</h1>
        <p className="text-[#1A1A3A]/60 font-medium max-w-[240px] mx-auto text-sm leading-relaxed">
          Aquí podrás ver y editar tu información de pana
        </p>
      </div>

      <div className="mt-12 w-full max-w-[280px]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#E0E5EC] text-[#D90429] font-black rounded-2xl shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.9)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] transition-all active:scale-95 group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

