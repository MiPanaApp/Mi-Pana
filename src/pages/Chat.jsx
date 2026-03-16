import { ArrowLeft, Send, Image as ImageIcon, Phone } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

// Simulated Chat Data
const MOCK_MESSAGES = [
  { id: 1, text: "Hola, ¿siguen disponibles los tequeños?", sender: 'other', time: '10:30 AM' },
  { id: 2, text: "¡Hola pana! Sí, claro. ¿Cuántos necesitas?", sender: 'me', time: '10:32 AM' },
  { id: 3, text: "Quiero el combo de 50. ¿Haces entregas en el centro?", sender: 'other', time: '10:35 AM' },
];

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages([...messages, { id: Date.now(), text: inputText, sender: 'me', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-screen bg-pana-bg font-sans">
      {/* Header */}
      <div className="bg-[#1A1A3A] text-white p-4 pt-safe flex items-center gap-3 shadow-md z-10 rounded-b-3xl">
         <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
         </button>
         
         <div className="flex-grow flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
               <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" alt="Vendor" className="w-full h-full object-cover" />
            </div>
            <div>
               <h2 className="font-bold leading-tight">Carlos Pérez</h2>
               <p className="text-[10px] text-white/60">Tequeños Caseros (Pack 50 uds)</p>
            </div>
         </div>

         {/* WA Direct Button per PRD */}
         <button 
           onClick={() => window.open(`https://wa.me/34600000000`)}
           className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg active:scale-95"
         >
           <Phone className="w-5 h-5 fill-white" />
         </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-24">
         {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
               <div 
                 className={`max-w-[75%] p-3 px-4 rounded-[20px] shadow-sm relative ${
                   msg.sender === 'me' 
                    ? 'bg-[#2D2D4E] text-white rounded-tr-sm' 
                    : 'bg-[#F0F0FA] text-[#1A1A3A] rounded-tl-sm border border-gray-100'
                 }`}
               >
                 <p className="text-sm">{msg.text}</p>
                 <span className={`text-[9px] mt-1 block text-right opacity-60`}>
                   {msg.time}
                 </span>
               </div>
            </div>
         ))}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-3 pb-safe-bottom z-20">
         <form onSubmit={handleSend} className="flex items-center gap-2 max-w-md mx-auto">
            <button type="button" className="p-2 text-gray-400 hover:text-pana-blue">
               <ImageIcon className="w-6 h-6" />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-grow h-12 bg-gray-100 rounded-full px-4 focus:outline-none focus:ring-2 focus:ring-pana-yellow text-sm font-medium shadow-inner"
            />
            <button 
              type="submit" 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${inputText.trim() ? 'bg-pana-yellow text-pana-blue shadow-md' : 'bg-gray-200 text-gray-400'}`}
              disabled={!inputText.trim()}
            >
               <Send className="w-5 h-5 ml-1" />
            </button>
         </form>
      </div>
    </div>
  );
}
