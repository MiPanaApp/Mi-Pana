import { useState } from 'react';
import { Users, ShoppingBag, MessageSquare, Star, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const METRICS = [
  { id: 1, label: "Panas Activos", val: "1,248", icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
  { id: 2, label: "Ofertas", val: "342", icon: ShoppingBag, color: "text-green-500", bg: "bg-green-100" },
  { id: 3, label: "Chats Activos", val: "89", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-100" },
  { id: 4, label: "Premium", val: "56", icon: Star, color: "text-yellow-600", bg: "bg-yellow-100" },
];

const BARDATA = [
  { name: 'Ene', reg: 400 },
  { name: 'Feb', reg: 300 },
  { name: 'Mar', reg: 550 },
  { name: 'Abr', reg: 200 },
  { name: 'May', reg: 700 },
];

const PIEDATA = [
  { name: 'Comida', value: 400 },
  { name: 'Servicios', value: 300 },
  { name: 'Legal', value: 300 },
];
const COLORS = ['#FFC200', '#1A1A3A', '#D90429'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Admin Header */}
      <div className="bg-gradient-to-br from-[#1A1A3A] to-[#2D2D5E] text-white pt-16 pb-24 px-6 rounded-b-[2.5rem]">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black drop-shadow-sm flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-pana-yellow" /> Panel Admin
            </h1>
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/30 backdrop-blur-md">
              Modo Root
            </div>
         </div>

         {/* Metrics 2x2 */}
         <div className="grid grid-cols-2 gap-4">
            {METRICS.map(m => (
              <div key={m.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.bg}`}>
                   <m.icon className={`w-6 h-6 ${m.color}`} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-white/70 text-xs font-bold uppercase">{m.label}</span>
                   <span className="text-xl font-black text-white">{m.val}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="-mt-16 px-6 relative z-10 space-y-6">
         
         {/* Tabs */}
         <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar">
            {['Overview', 'Usuarios', 'Productos', 'Categorías'].map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t.toLowerCase())}
                 className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-colors ${activeTab === t.toLowerCase() ? 'bg-pana-yellow text-pana-blue shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                  {t}
               </button>
            ))}
         </div>

         {/* Dashboard Panels */}
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {/* Registration Chart */}
               <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-pana-blue uppercase tracking-wide mb-6">Registros Mensuales</h3>
                  <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={BARDATA}>
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize: 12}} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF', fontSize: 12}} />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} />
                           <Bar dataKey="reg" fill="#FFC200" radius={[6, 6, 0, 0]} barSize={30} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Category Dist Chart */}
               <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-pana-blue uppercase tracking-wide mb-2">Distribución Categorías</h3>
                  <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={PIEDATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {PIEDATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         )}
         
         {activeTab === 'usuarios' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-pana-blue uppercase tracking-wide">Gestión de Usuarios</h3>
                  <button className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1.5 rounded-lg">Filtro</button>
               </div>
               
               {/* User Table Mock */}
               <div className="space-y-4">
                  {[1,2,3].map(i => (
                     <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                           <div className="flex flex-col">
                              <span className="font-bold text-sm text-pana-blue truncate w-32">Usuario {i}</span>
                              <span className="text-[10px] text-gray-400">Hace 2 horas</span>
                           </div>
                        </div>
                        <button className="bg-[#E8FFF2] text-green-700 text-[10px] font-bold px-2 py-1 rounded-md border border-green-200">
                           VERIFICAR PANA
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         )}

      </div>
    </div>
  );
}
