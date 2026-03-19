import { MessageCircle } from 'lucide-react';

export default function Messages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-8">
      <div className="p-8 bg-[#E0E5EC] rounded-[3rem] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
        <MessageCircle size={48} className="text-[#FFCC00]" />
      </div>
      <h1 className="text-3xl font-black text-[#1A1A3A] mt-2">Mensajes</h1>
      <p className="text-[#1A1A3A]/50 font-medium">Aquí aparecerá el historial de tus conversaciones</p>
    </div>
  );
}
