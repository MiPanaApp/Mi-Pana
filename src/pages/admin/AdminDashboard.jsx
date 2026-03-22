import { useState } from 'react';
import { 
  Users, ShoppingBag, MessageSquare, Star, ShieldCheck, AlertCircle, 
  Home, BarChart2, Layers, Activity, Search, Bell, Settings, LogOut
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const METRICS = [
  { id: 1, label: "Panas Activos", val: "1,248", trend: "+5.2%", isPositive: true },
  { id: 2, label: "Ofertas", val: "342", trend: "+1.1%", isPositive: true },
  { id: 3, label: "Chats", val: "89", trend: "-2.0%", isPositive: false },
];

const BARDATA = [
  { name: '12', reg: 400 }, { name: '13', reg: 300 }, { name: '14', reg: 550 },
  { name: '15', reg: 200 }, { name: '16', reg: 700 }, { name: '17', reg: 350 },
  { name: '18', reg: 450 }, { name: '19', reg: 600 }, { name: '20', reg: 500 },
];

const PIEDATA = [
  { name: 'Comida', value: 400 },
  { name: 'Servicios', value: 300 },
  { name: 'Legal', value: 300 },
];
// Colors from the image: Purples, Cyans
const COLORS = ['#8B5CF6', '#06B6D4', '#F43F5E']; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex p-4 lg:p-6 font-sans overflow-hidden">
      
      {/* Floating Sidebar */}
      <div className="hidden lg:flex flex-col items-center py-8 w-24 bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] h-[calc(100vh-3rem)] mr-6 sticky top-6">
        <div className="w-12 h-12 bg-cyan-100/50 rounded-2xl flex items-center justify-center mb-10">
          <ShieldCheck className="w-6 h-6 text-cyan-500" />
        </div>
        
        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          <button onClick={() => setActiveTab('overview')} className={`relative w-full flex justify-center ${activeTab === 'overview' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 transition-colors'}`}>
            <Home className="w-6 h-6" />
            {activeTab === 'overview' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />}
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={`relative w-full flex justify-center ${activeTab === 'usuarios' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 transition-colors'}`}>
            <Users className="w-6 h-6" />
            {activeTab === 'usuarios' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />}
          </button>
          <button onClick={() => setActiveTab('reportes')} className={`relative w-full flex justify-center ${activeTab === 'reportes' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 transition-colors'}`}>
            <AlertCircle className="w-6 h-6" />
            {activeTab === 'reportes' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />}
          </button>
          <button onClick={() => setActiveTab('estadisticas')} className={`relative w-full flex justify-center ${activeTab === 'estadisticas' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 transition-colors'}`}>
            <BarChart2 className="w-6 h-6" />
            {activeTab === 'estadisticas' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-md" />}
          </button>
        </div>

        <button className="text-gray-400 hover:text-gray-600 mt-auto transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-[calc(100vh-3rem)] overflow-y-auto hide-scrollbar">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Panel Dinámico</h1>
            <p className="text-sm font-bold text-gray-400 mt-1">Mostrando datos en tiempo real de Mi Pana</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="bg-white rounded-[1.2rem] flex items-center px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-full md:w-64 border border-gray-50">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input type="text" placeholder="Buscar..." className="bg-transparent border-none outline-none text-sm font-bold text-gray-600 w-full placeholder:text-gray-400" />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="w-[48px] h-[48px] shrink-0 bg-white rounded-[1.2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-gray-400 hover:text-blue-600 border border-gray-50 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="w-[48px] h-[48px] shrink-0 bg-[#8B5CF6] rounded-[1.2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(139,92,246,0.3)] text-white hover:bg-[#7C3AED] transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-6">
            
            {/* Top Metrics Row */}
            <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {METRICS.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between border border-gray-50">
                  <div className="flex justify-between items-start">
                     <span className="text-gray-800 font-black text-[28px] tracking-tight">{m.val}</span>
                     <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${m.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {m.trend}
                     </span>
                  </div>
                  <span className="text-gray-400 text-sm font-bold mt-4">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Main Charts Col */}
            <div className="xl:col-span-8 space-y-6">
               {/* Bar Chart Card */}
               <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50">
                 <h3 className="text-gray-800 font-bold mb-6 text-lg">Actividad de Usuarios</h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={BARDATA}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#A3A8B8', fontSize: 12, fontWeight: 700}} dy={10} />
                          <Tooltip cursor={{fill: '#F4F7FE'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)'}} />
                          <Bar dataKey="reg" fill="#06B6D4" radius={[6, 6, 6, 6]} barSize={12} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               {/* Pie Chart & Stats Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Pie chart */}
                 <div className="bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center border border-gray-50">
                   <h3 className="text-gray-800 font-bold w-full mb-2">Categorías</h3>
                   <div className="h-40 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={PIEDATA} innerRadius={45} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">
                               {PIEDATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)'}} />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="flex gap-4 mt-2">
                     <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></div><span className="text-xs text-gray-500 font-bold">Comida</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></div><span className="text-xs text-gray-500 font-bold">Servicios</span></div>
                     <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></div><span className="text-xs text-gray-500 font-bold">Legal</span></div>
                   </div>
                 </div>

                 {/* Income Card */}
                 <div className="bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col justify-center border border-gray-50">
                   <h3 className="text-gray-800 font-bold mb-4">Ingresos Esperados</h3>
                   <span className="text-3xl font-black text-gray-800 mb-1">$ 310,268</span>
                   <span className="text-sm font-bold text-gray-400 mb-6">Ingresos del mes</span>
                   <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                     <div className="bg-gradient-to-r from-cyan-400 to-[#8B5CF6] h-3 rounded-full" style={{ width: '75%' }}></div>
                   </div>
                   <span className="text-xs font-black text-gray-500 self-end">75% meta</span>
                 </div>
               </div>
            </div>

            {/* Right Column */}
            <div className="xl:col-span-4 space-y-6">
              {/* Reportes Recientes Widget */}
              <div className="bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-gray-800 font-bold">Reportes</h3>
                  <button onClick={() => setActiveTab('reportes')} className="text-xs font-black text-[#8B5CF6] hover:text-[#7C3AED] transition-colors bg-[#8B5CF6]/10 px-3 py-1.5 rounded-xl">Ver Todos</button>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 1, name: "Iphone 13 Pro Max", reason: "Estafa, Mal uso", time: "10 min" },
                    { id: 2, name: "Zapatos Nike", reason: "Repetido", time: "2 hr" },
                    { id: 3, name: "Piso Centro", reason: "Ilegal", time: "5 hr" },
                  ].map(r => (
                    <div key={r.id} className="flex justify-between items-center group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{r.name}</span>
                          <span className="text-xs font-bold text-gray-400 line-clamp-1 mt-0.5">{r.reason}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-300 ml-2">{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Widget */}
              <div className="bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(99,102,241,0.3)] text-white flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-bold mb-2 text-xl">Revisión de Seguridad</h3>
                <p className="text-sm text-white/80 font-medium mb-8 leading-relaxed">Hay 15 reportes pendientes de revisión el día de hoy.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setActiveTab('reportes')} className="flex-1 bg-white text-indigo-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95">Revisar Casos</button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Other Tabs (Reportes) */}
        {activeTab === 'reportes' && (
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] h-full mb-6 border border-gray-50">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                   <h3 className="font-black text-2xl text-gray-800 tracking-tight">Reportes de Anuncios</h3>
                   <p className="text-sm font-bold text-gray-400 mt-1">Gestión y revisión de contenido reportado.</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">Filtrar</button>
                  <button className="text-sm font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors px-4 py-2.5 rounded-xl shadow-[0_8px_20px_rgba(139,92,246,0.3)]">Exportar</button>
                </div>
             </div>
             
             <div className="space-y-3 drop-shadow-sm">
                {[
                  { id: 1, prodName: "MacBook Pro M1", reasons: "Es una estafa", time: "Hace 10 min", status: "Pendiente" },
                  { id: 2, prodName: "iPhone 13 Pro Max", reasons: "La categoría es incorrecta, Contenido ilegal", time: "Hace 2 horas", status: "Pendiente" },
                  { id: 3, prodName: "Zapatos Nike M", reasons: "Ya está vendido", time: "Hace 1 día", status: "Resuelto" }
                ].map(r => (
                   <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.2rem] hover:border-gray-200 hover:shadow-md transition-all gap-4">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-50 rounded-2xl flex-shrink-0 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                         </div>
                         <div className="flex flex-col max-w-[200px] md:max-w-md">
                            <span className="font-bold text-base text-gray-800 line-clamp-1">{r.prodName}</span>
                            <span className="text-sm font-bold text-red-500 line-clamp-2 mt-0.5">{r.reasons}</span>
                            <span className="text-[11px] font-black tracking-wide text-gray-400 mt-1 uppercase">{r.time}</span>
                         </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-start md:self-auto mt-2 md:mt-0">
                         {r.status === 'Pendiente' ? (
                            <>
                               <button className="bg-gray-50 text-gray-600 text-[13px] font-bold px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                  Ver Anuncio
                               </button>
                               <button className="bg-[#8B5CF6] text-white text-[13px] font-bold px-4 py-2 rounded-xl hover:bg-[#7C3AED] transition-colors shadow-[0_4px_10px_rgba(139,92,246,0.3)]">
                                  Revisar
                               </button>
                            </>
                         ) : (
                            <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black tracking-wide uppercase h-fit border border-green-100">Resuelto</span>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {(activeTab === 'usuarios' || activeTab === 'estadisticas') && (
          <div className="bg-white p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center h-full mb-6 text-center border border-gray-50">
             <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-100 mb-6 drop-shadow-sm">
                <Layers className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="font-black text-2xl text-gray-800 mb-2">En Desarrollo</h3>
             <p className="text-gray-400 font-bold max-w-sm">Esta sección está siendo adaptada al nuevo diseño del panel de control.</p>
          </div>
        )}

      </div>
      
      {/* Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
