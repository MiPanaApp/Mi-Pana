import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const MOCK_CHATS = [
  { id: 1, name: "Carlos Pérez", product: "Tequeños Caseros", lastMsg: "Quiero el combo de 50.", time: "10:35 AM", unread: 2, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" },
  { id: 2, name: "María Gómez", product: "Uñas Acrílicas", lastMsg: "¡Nos vemos mañana a las 3!", time: "Ayer", unread: 0, avatar: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=100&q=80" },
];

export default function ChatList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pana-bg">
       <div className="pt-24 px-6">
          <h1 className="text-2xl font-black text-pana-blue flex items-center gap-2 mb-6">
            <MessageCircle className="w-7 h-7" /> Mensajes
          </h1>

          <div className="space-y-3">
             {MOCK_CHATS.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className="bg-white p-4 rounded-2xl shadow-neumorphic-soft flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-pana-yellow"
                >
                   <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden relative border-2 border-white shadow-sm flex-shrink-0">
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                      {chat.unread > 0 && (
                         <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"></div>
                      )}
                   </div>
                   
                   <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-pana-blue truncate pr-2">{chat.name}</h3>
                         <span className="text-[10px] text-gray-400 whitespace-nowrap">{chat.time}</span>
                      </div>
                      <p className="text-xs text-pana-yellow font-bold truncate mb-0.5">{chat.product}</p>
                      <p className={`text-sm truncate ${chat.unread > 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                        {chat.lastMsg}
                      </p>
                   </div>
                   
                   {chat.unread > 0 && (
                      <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                         {chat.unread}
                      </div>
                   )}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
