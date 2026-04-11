import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Users, ShoppingBag, MessageSquare, Star, ShieldCheck, Heart,
  Home, BarChart2, Layers, Activity, Search, Bell, Settings, LogOut, ArrowLeft, Eye, Globe, CheckCircle, CalendarClock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '../../services/firebase';
// OPTIMIZACIÓN: Importamos getCountFromServer para ahorrar costos de lectura
import { collection, getDocs, query, limit, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AdminUsersTab from '../../components/admin/AdminUsersTab';
import AdminAdsTab from '../../components/admin/AdminAdsTab';
import AdminStatsTab from '../../components/admin/AdminStatsTab';
import AdminCategoriesTab from '../../components/admin/AdminCategoriesTab';
import AdminCountriesTab from '../../components/admin/AdminCountriesTab';
import AdminReportsModal from '../../components/admin/AdminReportsModal';
import AdminNotificationsTab from '../../components/admin/AdminNotificationsTab';
import AdminScheduledNotifsTab from '../../components/admin/AdminScheduledNotifsTab';

// Colores alineados a la marca: Amarillo Mi Pana, Morado Admin y acentos
const COLORS = ['#FFD700', '#8B5CF6', '#06B6D4', '#F43F5E', '#10B981'];

const BARDATA = [
  { name: '12', reg: 400 }, { name: '13', reg: 300 }, { name: '14', reg: 550 },
  { name: '15', reg: 200 }, { name: '16', reg: 700 }, { name: '17', reg: 350 },
  { name: '18', reg: 450 }, { name: '19', reg: 600 }, { name: '20', reg: 500 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { selectedCountry } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [topViewed, setTopViewed] = useState([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const scrollContainerRef = useRef(null);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [emailTestLoading, setEmailTestLoading] = useState(false);

  const testEmail = async () => {
    setEmailTestLoading(true);
    setEmailTestResult(null);
    try {
      const fns = getFunctions(undefined, 'us-central1');
      const sendTest = httpsCallable(fns, 'sendProductCreatedEmail');
      const result = await sendTest({
        email: 'radarcriollo@gmail.com',
        userName: 'Admin Test',
        productName: 'Producto de Prueba 🦪',
        productId: 'test-123',
        productPrice: '99'
      });
      console.log('✅ Test email enviado exitosamente:', result);
      setEmailTestResult({ ok: true, msg: '✅ Email de prueba enviado. ¡Revisa radarcriollo@gmail.com!' });
    } catch (error) {
      console.error('❌ Error en test de email:', error);
      setEmailTestResult({ ok: false, msg: '❌ Error: ' + error.message });
    } finally {
      setEmailTestLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'reports'));
    const unsubscribe = onSnapshot(q, (snap) => {
      let pending = 0;
      snap.forEach(doc => {
        if (doc.data().status === 'pending') pending++;
      });
      setPendingReportsCount(pending);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersColl = collection(db, "users");
        const productsColl = collection(db, "products");

        const [usersCountSnap, productsSnap] = await Promise.all([
          getCountFromServer(usersColl),
          getDocs(productsColl)
        ]);

        const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totals = productsList.reduce((acc, p) => ({
          views: acc.views + (p.views || 0),
          likes: acc.likes + (p.likes || 0)
        }), { views: 0, likes: 0 });

        setTotalViews(totals.views);
        setTotalLikes(totals.likes);

        const topViewedData = [...productsList]
           .sort((a, b) => (b.views || 0) - (a.views || 0))
           .slice(0, 5);
        setTopViewed(topViewedData);

        const catMap = {};
        productsList.forEach(data => {
          const cat = data.category || 'Otros';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const catData = Object.keys(catMap).map(name => ({
          name,
          value: catMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        setStats({
          totalUsers: usersCountSnap.data().count,
          totalProducts: productsList.length,
          categories: catData.length > 0 ? catData : [{ name: 'Sin datos', value: 1 }]
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
    return n.toString();
  };

  const metrics = [
    { id: 1, label: "Panas Activos", val: stats.totalUsers.toLocaleString(), trend: "+5.2%", isPositive: true },
    { id: 2, label: "Ofertas", val: stats.totalProducts.toLocaleString(), trend: "+1.1%", isPositive: true },
    { id: 3, label: "Vistas Totales", val: formatCount(totalViews), trend: "acumulado", isPositive: true },
    { id: 4, label: "Favoritos (Likes)", val: formatCount(totalLikes), trend: "acumulado", isPositive: true },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex p-3 pb-24 lg:p-6 lg:pb-6 font-sans overflow-hidden">

      {/* Mobile Bottom Navigation - Estilo Claymorphism Soft */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[100] flex items-center justify-around p-4 rounded-[2.5rem] border border-white">
        {['overview', 'usuarios', 'anuncios', 'categorias', 'paises', 'notificaciones', 'programadas', 'estadisticas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`p-3 rounded-2xl transition-all ${activeTab === tab ? 'bg-[#FFD700] text-black shadow-lg scale-110' : 'text-gray-400'}`}
          >
            {tab === 'overview' && <Home className="w-6 h-6" />}
            {tab === 'usuarios' && <Users className="w-6 h-6" />}
            {tab === 'anuncios' && <ShoppingBag className="w-6 h-6" />}
            {tab === 'categorias' && <Layers className="w-6 h-6" />}
            {tab === 'paises' && <Globe className="w-6 h-6" />}
            {tab === 'notificaciones' && <Bell className="w-6 h-6" />}
            {tab === 'programadas' && <CalendarClock className="w-6 h-6" />}
            {tab === 'estadisticas' && <BarChart2 className="w-6 h-6" />}
          </button>
        ))}
      </div>

      {/* Floating Sidebar - Neumorphism Style */}
      <div className="hidden lg:flex flex-col items-center py-8 w-24 bg-white rounded-[2.5rem] shadow-[20px_20px_60px_#d9dade,-20px_-20px_60px_#ffffff] h-[calc(100vh-3rem)] mr-6 sticky top-6 border border-white/50">
        <div className="w-14 h-14 bg-[#FFD700] rounded-2xl flex items-center justify-center mb-10 shadow-inner">
          <ShieldCheck className="w-7 h-7 text-black" />
        </div>

        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          {[
            { id: 'overview', icon: Home },
            { id: 'usuarios', icon: Users },
            { id: 'anuncios', icon: ShoppingBag },
            { id: 'categorias', icon: Layers },
            { id: 'paises', icon: Globe },
            { id: 'notificaciones', icon: Bell },
            { id: 'programadas', icon: CalendarClock },
            { id: 'estadisticas', icon: BarChart2 }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative group p-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-[#F4F7FE] text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <item.icon className="w-6 h-6" />
              {activeTab === item.id && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FFD700] rounded-r-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] overflow-y-auto hide-scrollbar"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-4 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-10 lg:pt-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/perfil')}
              className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Panel Mi Pana</h1>
                {activeTab === 'overview' && (
                  <button className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400 hover:text-[#FFD700] transition-colors shrink-0">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-gray-400">Gestión centralizada de la comunidad</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'anuncios' && (
              <div className="bg-white rounded-2xl flex items-center px-4 py-3 shadow-sm flex-1 md:w-72 border border-gray-100">
                <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar panas o anuncios..."
                  className="bg-transparent border-none outline-none text-sm font-bold text-gray-600 w-full"
                />
              </div>
            )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-44 lg:pb-6">

            {/* Metrics con Efecto Neumórfico Suave */}
            <div className="xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {metrics.map((m, idx) => (
                <div key={m.id} className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] shadow-[10px_10px_20px_#ebebeb,-5px_-5px_15px_#ffffff] border border-white/60 flex flex-col justify-between">
                  <div className="mb-2 md:mb-3">
                    <span className="text-gray-400 text-[9px] md:text-xs font-black uppercase tracking-widest leading-tight">{m.label}</span>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-1.5 md:gap-2 truncate">
                      {idx === 2 && <Eye className="w-5 h-5 md:w-8 md:h-8 text-blue-500 shrink-0" />}
                      {idx === 3 && <Heart className="w-5 h-5 md:w-8 md:h-8 text-red-500 shrink-0" fill="currentColor" />}
                      <span className="truncate">{loading ? "..." : m.val}</span>
                    </span>
                    <span className={`text-[10px] md:text-xs font-black px-2 py-1 md:px-2.5 md:py-1 rounded-md shrink-0 ${m.trend === 'acumulado' ? 'bg-[#FFD700]/20 text-yellow-700' : (m.isPositive ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500')}`}>
                      {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 🧪 Panel de Test de Emails */}
            <div className="xl:col-span-12 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                    🧪 Test Sistema de Emails
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">Envía un email de prueba a radarcriollo@gmail.com para verificar que Resend funciona.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    id="btn-test-email"
                    onClick={testEmail}
                    disabled={emailTestLoading}
                    className="px-5 py-2.5 bg-[#FFB400] text-[#1A1A3A] font-black rounded-xl text-sm shadow-sm hover:bg-[#ffc533] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {emailTestLoading ? '⏳ Enviando...' : '🧪 Test Email Sistema'}
                  </button>
                  {emailTestResult && (
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
                      emailTestResult.ok
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {emailTestResult.msg}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Gráficos Principales */}
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-gray-800 font-black text-lg">Crecimiento de la Red</h3>
                  <select className="bg-gray-50 border-none text-xs font-bold p-2 rounded-xl outline-none">
                    <option>Últimos 7 días</option>
                    <option>Este mes</option>
                  </select>
                </div>
                <div className="h-72 min-h-[288px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={BARDATA}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A3A8B8', fontSize: 12, fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: '#F4F7FE' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="reg" fill="#FFD700" radius={[10, 10, 10, 10]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Widgets Inferiores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categorías (PieChart) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col items-center">
                  <h3 className="text-gray-800 font-black w-full mb-4">Top Categorías</h3>
                  <div className="h-48 min-h-[192px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.categories} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {stats.categories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ingresos Mi Pana */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-center">
                  <h3 className="text-gray-800 font-black mb-2">Potencial de Mercado</h3>
                  <span className="text-4xl font-black text-gray-800 mb-6 tracking-tighter">$ 310,268</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-gray-400 uppercase">
                      <span>Meta mensual</span>
                      <span>75%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 shadow-inner">
                      <div className="bg-gradient-to-r from-[#FFD700] to-yellow-500 h-4 rounded-full shadow-md" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Popularidad & Soporte */}
            <div className="xl:col-span-4 space-y-6">
              {/* Anuncios Más Populares (Top 5) */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-gray-800 font-black">Top 5 Anuncios 🔥</h3>
                </div>
                <div className="space-y-4">
                  {topViewed.map((ad, idx) => (
                    <div key={ad.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                      <div className="font-black text-gray-300 w-4 text-center">{idx + 1}</div>
                      <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-200">
                        {ad.image ? <img src={ad.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📷</div>}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[13px] font-bold text-gray-800 line-clamp-1 truncate">{ad.name}</span>
                        <div className="flex gap-2.5 mt-1">
                          <span className="text-[11px] font-black text-blue-500 flex items-center gap-1"><Eye className="w-3 h-3"/> {formatCount(ad.views)}</span>
                          <span className="text-[11px] font-black text-red-500 flex items-center gap-1">❤️ {formatCount(ad.likes)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card de Acción Claymorphism */}
              <div className="bg-black p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFD700] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <ShieldCheck className="w-8 h-8 text-[#FFD700]" />
                  <h3 className="font-black text-xl">Seguridad Mi Pana</h3>
                </div>
                
                <div className="flex items-center justify-between mb-6 relative z-10 gap-2">
                  <p className="text-sm text-gray-400 font-medium">Casos pendientes de revisión.</p>
                  
                  {pendingReportsCount > 0 ? (
                    <div className="flex flex-col items-center justify-center bg-red-500 text-white rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0">
                      <span className="text-xl font-black leading-none">{pendingReportsCount}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold">Nuevos</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl px-4 py-2 shrink-0">
                      <CheckCircle className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] uppercase tracking-widest font-bold">Al Día</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsReportsModalOpen(true)}
                  className="w-full bg-[#FFD700] text-black font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(255,215,0,0.2)] hover:bg-[#FFE033] active:scale-95 transition-all relative z-10"
                >
                  Ver Reportes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mantenemos tus condicionales de tabs igual para no romper la lógica */}
        {activeTab === 'usuarios' && <AdminUsersTab searchQuery={globalSearch} />}
        {activeTab === 'anuncios' && <AdminAdsTab searchQuery={globalSearch} />}
        {activeTab === 'categorias' && <AdminCategoriesTab />}
        {activeTab === 'paises' && <AdminCountriesTab />}
        {activeTab === 'notificaciones' && <AdminNotificationsTab />}
        {activeTab === 'programadas' && <AdminScheduledNotifsTab />}
        {activeTab === 'estadisticas' && <AdminStatsTab />}

        <AdminReportsModal 
          isOpen={isReportsModalOpen} 
          onClose={() => setIsReportsModalOpen(false)} 
        />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}