import { CheckCircle2, ShieldCheck, MapPin, Clock, Star, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');

  // Simulated product based on PRD requirements
  const product = {
    name: "Reparación de Computadoras y Laptops",
    sellerName: "Carlos Pérez",
    verified: true,
    rating: 4.85,
    reviews: 124,
    zone: "Madrid Centro",
    rate: "Desde 30€",
    timeInApp: "1 Año",
    jobsDone: 89,
    phone: "34600000000", // Whatsapp simulation
    description: "Especialista en mantenimiento, instalación de software y reparación de hardware. Más de 10 años de experiencia técnica."
  };

  return (
    <div className="min-h-screen bg-pana-bg pb-24">
      {/* Hero Head */}
      <div className="bg-gradient-to-br from-pana-yellow to-pana-gold pt-28 pb-10 px-6 rounded-b-[2.5rem] shadow-md relative z-0">
         <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white shadow-clay-card border-4 border-white/50 overflow-hidden flex-shrink-0">
               <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=160&q=80" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-pana-blue drop-shadow-sm leading-tight">{product.name}</h1>
              <p className="font-bold text-[#7A5500] text-sm mt-1">{product.sellerName}</p>
            </div>
         </div>
         
         {/* Rating Card */}
         <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl p-4 shadow-neumorphic-soft flex justify-between items-center text-pana-blue">
            <div className="flex flex-col">
               <span className="text-xs font-bold text-gray-500 uppercase">Valoración</span>
               <div className="flex items-center gap-1 text-xl font-black mt-0.5">
                 {product.rating} <Star className="w-5 h-5 fill-pana-yellow text-pana-yellow mb-1" />
               </div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-gray-500 uppercase">Avisos</span>
               <span className="text-lg font-black mt-0.5">{product.reviews}</span>
            </div>
         </div>
      </div>

      <div className="px-6 pt-12 space-y-6">
        
        {/* Info Grid 2x2 */}
        <div className="grid grid-cols-2 gap-4">
           {[{icon: MapPin, label: "Zona", val: product.zone}, {icon: CheckCircle2, label: "Tarifa", val: product.rate}, {icon: Clock, label: "Tiempo en App", val: product.timeInApp}, {icon: ShieldCheck, label: "Trabajos", val: product.jobsDone}].map((item, idx) => (
             <div key={idx} className="bg-white/60 backdrop-blur-md rounded-2xl p-3 flex gap-3 shadow-sm border border-white">
                <div className="bg-pana-surface p-2 rounded-xl text-pana-blue h-min"><item.icon className="w-5 h-5" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{item.label}</span>
                  <span className="text-xs font-black text-pana-blue mt-0.5">{item.val}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Check de Pana Verificado */}
        {product.verified && (
          <div className="bg-[#E8FFF2] border border-[#A7E9C4] rounded-2xl p-4 shadow-sm flex items-start gap-4">
             <div className="bg-green-100 p-2 rounded-full text-green-600"><ShieldCheck className="w-6 h-6" /></div>
             <div>
                <h3 className="font-black text-green-800 text-sm">Check de Pana Verificado</h3>
                <p className="text-xs text-green-700 mt-1 mb-2">Identidad e historial validados por MiPana.</p>
                <div className="flex flex-wrap gap-2">
                  {['Documento', 'Teléfono', 'Email'].map((b) => (
                    <span key={b} className="text-[9px] bg-green-200 text-green-800 font-bold px-2 py-0.5 border border-green-300 rounded-full">{b}</span>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Description */}
        <div>
           <h3 className="text-sm font-black text-pana-blue mb-2 uppercase tracking-wide">Acerca de</h3>
           <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
        </div>

      </div>

      {/* Fixed Bottom Contact Buttons */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 pb-safe-bottom z-30">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4 h-12">
           {/* WhatsApp Button Pulse */}
           <button 
             onClick={() => window.open(`https://wa.me/${product.phone}?text=Hola, vi tu servicio en miPana`)}
             className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-[1rem] font-bold shadow-[0_4px_15px_rgba(37,211,102,0.4)] overflow-hidden"
           >
             <span className="absolute inset-0 bg-[#25D366] animate-pulse opacity-50"></span>
             <span className="relative z-10 flex items-center gap-2">WhatsApp</span>
           </button>

           {/* Chat Panel Button */}
           <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2D2D4E] to-[#1A1A3A] text-white rounded-[1rem] font-bold shadow-[0_4px_15px_rgba(45,45,78,0.4)]">
             <MessageSquare className="w-5 h-5" />
             Chat Pana
           </button>
        </div>
      </div>
    </div>
  );
}
