import { UserCircle2 } from 'lucide-react';

export default function Profile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-8">
      <div className="p-8 bg-[#E0E5EC] rounded-[3rem] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <UserCircle2 size={48} className="text-[#003366]" />
      </div>
      <h1 className="text-3xl font-black text-[#1A1A3A] mt-2">Mi Perfil</h1>
      <p className="text-[#1A1A3A]/50 font-medium">Aquí podrás ver y editar tu información de pana</p>
    </div>
  );
}
