import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Users, ShoppingBag, MessageSquare, Star, ShieldCheck, Heart,
  Home, BarChart2, Layers, Activity, Search, Bell, Settings, LogOut, ArrowLeft, Eye, Globe, CheckCircle, CalendarClock,
  Flame, FlaskConical, Image as LucideImage, Zap, Mail, Trash2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { db } from '../../services/firebase';
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
import GeoMapChart from '../../components/admin/GeoMapChart';

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
  const [rawUsers, setRawUsers] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [growthWeeks, setGrowthWeeks] = useState(8);

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

        const [usersSnap, productsSnap] = await Promise.all([
          getDocs(usersColl),
          getDocs(productsColl)
        ]);

        const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

        // TOP CATEGORIES REALES
        const catMap = {};
        productsList.forEach(data => {
          const cat = data.category || 'Otros';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const catData = Object.keys(catMap).map(name => ({
          name,
          value: catMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        // CRECIMIENTO EVOLUTIVO (Extrae a Raw para filtro posterior)
        setRawUsers(usersList);
        setRawProducts(productsList);

        // MAPA GEOGRAFICO: USUARIOS POR PAIS ISO-3
        // App usa ES, US, CO, peeeero el mapa USA ISO-3: ESP, USA, COL...
        const ISO2_TO_ISO3 = {
          'ES': 'ESP', 'US': 'USA', 'CO': 'COL', 'EC': 'ECU', 'PA': 'PAN',
          'PE': 'PER', 'DO': 'DOM', 'CL': 'CHL', 'AR': 'ARG', 'VE': 'VEN', 'MX': 'MEX'
        };
        const countryMap = {};
        usersList.forEach(u => {
          if (u.country) {
            const iso3 = ISO2_TO_ISO3[u.country];
            if (iso3) countryMap[iso3] = (countryMap[iso3] || 0) + 1;
          }
        });
        const geoData = Object.keys(countryMap).map(k => ({ id: k, value: countryMap[k] }));

        setStats(prev => ({
          ...prev,
          totalUsers: usersList.length,
          totalProducts: productsList.length,
          categories: catData.length > 0 ? catData : [{ name: 'Sin datos', value: 1 }],
          geo: geoData
        }));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Efecto dinámico para recalcular el chart de Crecimiento si cambian las semanas
  useEffect(() => {
    if (!rawUsers.length && !rawProducts.length) return;

    const getWeeksAgo = (dateStr) => {
      const date = new Date(dateStr?.seconds ? dateStr.seconds * 1000 : dateStr);
      if (isNaN(date)) return 99;
      const diffTime = Math.abs(new Date() - date);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    };

    const growthData = Array.from({ length: growthWeeks }, (_, i) => ({
      name: `Sem -${(growthWeeks - 1) - i}`,
      users: 0,
      ads: 0
    }));

    rawUsers.forEach(u => {
      const w = getWeeksAgo(u.createdAt);
      if (w < growthWeeks) growthData[(growthWeeks - 1) - w].users += 1;
    });

    rawProducts.forEach(p => {
      const w = getWeeksAgo(p.createdAt);
      if (w < growthWeeks) growthData[(growthWeeks - 1) - w].ads += 1;
    });

    setStats(prev => ({ ...prev, growth: growthData }));
  }, [growthWeeks, rawUsers, rawProducts]);

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

            {/* Metrics compactas */}
            <div className="xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((m, idx) => (
                <div key={m.id} className="bg-white p-4 rounded-[2rem] shadow-[8px_8px_16px_#ebebeb,-4px_-4px_12px_#ffffff] border border-white/60 flex flex-col justify-center min-h-[110px]">
                  <div className="mb-1">
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[#1A1A3A] flex items-center gap-1.5 shrink-0">
                      {idx === 0 && <Users className="w-5 h-5 text-purple-500 shrink-0" />}
                      {idx === 1 && <ShoppingBag className="w-5 h-5 text-yellow-500 shrink-0" />}
                      {idx === 2 && <Eye className="w-5 h-5 text-blue-500 shrink-0" />}
                      {idx === 3 && <Heart className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" />}
                      <span>{loading ? "..." : m.val}</span>
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 border ${m.trend === 'acumulado' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : (m.isPositive ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100')}`}>
                      {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 🧪 Panel de Test de Emails */}
            <div className="xl:col-span-12 bg-white py-4 px-6 rounded-[2rem] shadow-sm border border-gray-50">
              <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col items-center sm:items-start">
                  <h3 className="font-black text-gray-800 text-lg flex items-center justify-center sm:justify-start gap-2">
                    <FlaskConical size={20} className="text-orange-500" /> Test Sistema de Emails
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5 max-w-[280px] sm:max-w-none">Envía un email de prueba a radarcriollo@gmail.com para verificar que Resend funciona.</p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap w-full sm:w-auto">
                  <button
                    id="btn-test-email"
                    onClick={testEmail}
                    disabled={emailTestLoading}
                    className="px-5 py-2.5 bg-[#FFB400] text-[#1A1A3A] font-black rounded-xl text-sm shadow-sm hover:bg-[#ffc533] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {emailTestLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {emailTestLoading ? 'Enviando...' : 'Test Sistema'}
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
                  <h3 className="text-gray-800 font-black text-lg flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Crecimiento de la Red</h3>
                  <select 
                    value={growthWeeks}
                    onChange={(e) => setGrowthWeeks(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-100 text-xs font-bold p-2.5 rounded-xl outline-none shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <option value={4}>Últimas 4 semanas</option>
                    <option value={8}>Últimas 8 semanas</option>
                    <option value={12}>Últimas 12 semanas</option>
                    <option value={24}>Últimas 24 semanas</option>
                  </select>
                </div>
                <div className="h-72 min-h-[288px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.growth || []}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A3A8B8', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip cursor={{ stroke: '#F4F7FE', strokeWidth: 2 }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      <Area type="monotone" dataKey="users" name="Nuevos Usuarios" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="ads" name="Nuevos Anuncios" stroke="#FFB400" strokeWidth={3} fillOpacity={1} fill="url(#colorAds)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Widgets Inferiores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categorías (PieChart) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col items-center">
                  <h3 className="text-gray-800 font-black w-full mb-4">Top Categorías</h3>
                  <div className="h-72 min-h-[288px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.categories} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {stats.categories?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ingresos Mi Pana reemplazado por Mapa Global */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-start relative overflow-hidden">
                  <h3 className="text-gray-800 font-black mb-2 flex items-center gap-2"><Globe size={18} className="text-green-500" /> Presencia Global</h3>
                  <p className="text-[10px] text-gray-400 font-bold mb-6">Mapa térmico de usuarios activos</p>
                  
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                    {/* Renderizamos el nuevo mapa */}
                    <GeoMapChart data={stats.geo || []} />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Soporte */}
            <div className="xl:col-span-4 space-y-6">

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