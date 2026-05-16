import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Users, ShoppingBag, MessageSquare, Star, ShieldCheck, Heart,
  Home, BarChart2, Layers, Activity, Search, Bell, Settings, LogOut, ArrowLeft, Eye, Globe, CheckCircle, CalendarClock,
  Flame, FlaskConical, Image as LucideImage, Zap, Mail, Trash2, ChevronDown, Check, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, getDocs, query, limit, getCountFromServer, onSnapshot, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AdminUsersTab from '../../components/admin/AdminUsersTab';
import AdminAdsTab from '../../components/admin/AdminAdsTab';
import AdminStatsTab from '../../components/admin/AdminStatsTab';
import AdminCategoriesTab from '../../components/admin/AdminCategoriesTab';
import AdminCountriesTab from '../../components/admin/AdminCountriesTab';
import AdminReportsModal from '../../components/admin/AdminReportsModal';
import AdminNotificationsTab from '../../components/admin/AdminNotificationsTab';
import AdminScheduledNotifsTab from '../../components/admin/AdminScheduledNotifsTab';
import AdminVerificationsTab from '../../components/admin/AdminVerificationsTab';

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
    categories: [],
    userTrend: { val: '0%', pos: true },
    productTrend: { val: '0%', pos: true }
  });
  const [loading, setLoading] = useState(true);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [topViewed, setTopViewed] = useState([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);
  const scrollContainerRef = useRef(null);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [rawUsers, setRawUsers] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [growthMonths, setGrowthMonths] = useState(6);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    const qVerif = query(collection(db, 'verifications'), where('status', '==', 'pending'));
    const unsubVerif = onSnapshot(qVerif, (snap) => setPendingVerificationsCount(snap.size));

    return () => {
      unsubscribe();
      unsubVerif();
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const usersColl = collection(db, "users");
      const productsColl = collection(db, "products");
      const categoriesColl = collection(db, "categories");

      const [usersSnap, productsSnap, categoriesSnap] = await Promise.all([
        getDocs(usersColl),
        getDocs(productsColl),
        getDocs(categoriesColl)
      ]);

      const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const catNamesMap = {};
      const knownCategoryValues = new Set();
      categoriesSnap.docs.forEach(doc => {
        const data = doc.data();
        const displayName = data.label || data.name || data.title || null;
        if (!displayName) return;
        catNamesMap[doc.id] = displayName;
        catNamesMap[String(doc.id)] = displayName;
        catNamesMap[displayName] = displayName;
        if (data.name) catNamesMap[data.name] = displayName;
        if (data.label) catNamesMap[data.label] = displayName;
        if (data.id) catNamesMap[String(data.id)] = displayName;
        if (data.value) catNamesMap[String(data.value)] = displayName;
        knownCategoryValues.add(displayName);
      });

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

      const catCountMap = {};
      productsList.forEach(data => {
        const rawCat = data.category;
        let catName;
        if (!rawCat) {
          catName = 'Sin categoría';
        } else if (catNamesMap[rawCat]) {
          catName = catNamesMap[rawCat];
        } else if (catNamesMap[String(rawCat)]) {
          catName = catNamesMap[String(rawCat)];
        } else if (!isNaN(rawCat)) {
          catName = 'Sin categoría';
        } else {
          catName = rawCat;
        }
        catCountMap[catName] = (catCountMap[catName] || 0) + 1;
      });

      const catData = Object.keys(catCountMap).map(name => ({
        name,
        value: catCountMap[name]
      })).sort((a, b) => b.value - a.value).slice(0, 10);

      setRawUsers(usersList);
      setRawProducts(productsList);

      const COUNTRY_FLAGS = {
        'ES': { name: 'España', flag: '🇪🇸' },
        'US': { name: 'Estados', flag: '🇺🇸' },
        'CO': { name: 'Colombia', flag: '🇨🇴' },
        'EC': { name: 'Ecuador', flag: '🇪🇨' },
        'PA': { name: 'Panamá', flag: '🇵🇦' },
        'PE': { name: 'Perú', flag: '🇵🇪' },
        'DO': { name: 'Rep. Dom', flag: '🇩🇴' },
        'CL': { name: 'Chile', flag: '🇨🇱' },
        'AR': { name: 'Argentina', flag: '🇦🇷' },
        'MX': { name: 'México', flag: '🇲🇽' }
      };
      const countryMap = {};
      usersList.forEach(u => {
        if (u.country && COUNTRY_FLAGS[u.country]) {
          const code = u.country;
          countryMap[code] = (countryMap[code] || 0) + 1;
        }
      });
      const geoData = Object.keys(countryMap).map(k => ({ 
        id: k, 
        name: COUNTRY_FLAGS[k].name,
        flag: COUNTRY_FLAGS[k].flag,
        value: countryMap[k] 
      })).sort((a, b) => b.value - a.value).slice(0, 5);

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
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  // Efecto dinámico para recalcular la tabla de Crecimiento si cambian los meses
  useEffect(() => {
    if (!rawUsers.length && !rawProducts.length) return;

    const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const getMonthKey = (dateStr) => {
      const date = new Date(dateStr?.seconds ? dateStr.seconds * 1000 : dateStr);
      if (isNaN(date)) return null;
      return `${date.getFullYear()}-${date.getMonth()}`;
    };

    const now = new Date();
    const monthData = Array.from({ length: growthMonths }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (growthMonths - 1 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        name: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        users: 0,
        ads: 0,
        views: 0,
        likes: 0,
      };
    });

    rawUsers.forEach(u => {
      const key = getMonthKey(u.createdAt);
      const row = monthData.find(m => m.key === key);
      if (row) row.users += 1;
    });

    rawProducts.forEach(p => {
      const key = getMonthKey(p.createdAt);
      const row = monthData.find(m => m.key === key);
      if (row) {
        row.ads += 1;
        row.views += p.views || 0;
        row.likes += p.likes || 0;
      }
    });

    setStats(prev => ({ ...prev, growth: monthData }));

    // Calcular Tendencias Reales (este mes vs el anterior)
    const getMonthsAgo = (dateStr) => {
      const date = new Date(dateStr?.seconds ? dateStr.seconds * 1000 : dateStr);
      if (isNaN(date)) return 99;
      const now = new Date();
      return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    };
    const uThis = rawUsers.filter(u => getMonthsAgo(u.createdAt) === 0).length;
    const uLast = rawUsers.filter(u => getMonthsAgo(u.createdAt) === 1).length;
    const pThis = rawProducts.filter(p => getMonthsAgo(p.createdAt) === 0).length;
    const pLast = rawProducts.filter(p => getMonthsAgo(p.createdAt) === 1).length;

    const calcTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? { val: '+100%', pos: true } : { val: '0%', pos: true };
      const diff = ((curr - prev) / prev) * 100;
      return { 
        val: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, 
        pos: diff >= 0 
      };
    };

    const userTrend = calcTrend(uThis, uLast);
    const productTrend = calcTrend(pThis, pLast);

    setStats(prev => ({ 
      ...prev, 
      userTrend,
      productTrend
    }));
  }, [growthMonths, rawUsers, rawProducts]);

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
    return n.toString();
  };

  const metrics = [
    { id: 1, label: "Panas Activos", val: stats.totalUsers.toLocaleString(), trend: stats.userTrend?.val || '0%', isPositive: stats.userTrend?.pos ?? true },
    { id: 2, label: "Anuncios", val: stats.totalProducts.toLocaleString(), trend: stats.productTrend?.val || '0%', isPositive: stats.productTrend?.pos ?? true },
    { id: 3, label: "Vistas Totales", val: formatCount(totalViews), trend: "acumulado", isPositive: true },
    { id: 4, label: "Favoritos (Likes)", val: formatCount(totalLikes), trend: "acumulado", isPositive: true },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex p-3 pb-24 lg:p-6 lg:pb-6 font-sans overflow-hidden">

      {/* Mobile Bottom Navigation - Estilo Claymorphism Soft */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[100] flex items-center justify-between px-2 py-3 rounded-[2.5rem] border border-white overflow-x-auto hide-scrollbar gap-1">
        {['overview', 'usuarios', 'anuncios', 'categorias', 'paises', 'verifications', 'notificaciones', 'programadas', 'estadisticas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`p-2 rounded-2xl transition-all relative shrink-0 ${activeTab === tab ? 'bg-[#FFD700] text-black shadow-md' : 'text-gray-400'}`}
          >
            {tab === 'overview' && <Home className="w-5 h-5" />}
            {tab === 'usuarios' && <Users className="w-5 h-5" />}
            {tab === 'anuncios' && <ShoppingBag className="w-5 h-5" />}
            {tab === 'categorias' && <Layers className="w-5 h-5" />}
            {tab === 'paises' && <Globe className="w-5 h-5" />}
            {tab === 'verifications' && <ShieldCheck className="w-5 h-5" />}
            {tab === 'notificaciones' && <Bell className="w-5 h-5" />}
            {tab === 'programadas' && <CalendarClock className="w-5 h-5" />}
            {tab === 'estadisticas' && <BarChart2 className="w-5 h-5" />}
            {tab === 'verifications' && pendingVerificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* Floating Sidebar - Neumorphism Style */}
      <div className="hidden lg:flex flex-col items-center py-8 w-24 bg-white rounded-[2.5rem] shadow-[20px_20px_60px_#d9dade,-20px_-20px_60px_#ffffff] h-[calc(100vh-3rem)] mr-6 sticky top-6 border border-white/50">
        {/* Sidebar Logo / Spacer */}
        <div className="mb-6" />

        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          {[
            { id: 'overview', icon: Home },
            { id: 'usuarios', icon: Users },
            { id: 'anuncios', icon: ShoppingBag },
            { id: 'categorias', icon: Layers },
            { id: 'paises', icon: Globe },
            { id: 'verifications', icon: ShieldCheck },
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
              {item.id === 'verifications' && pendingVerificationsCount > 0 && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[11px] font-black w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white shadow-md transform translate-x-1/4 -translate-y-1/4">
                  {pendingVerificationsCount}
                </div>
              )}
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
                {/* Botón Refresh (Solo Móvil - al lado de "Pana") */}
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  disabled={isRefreshing}
                  className="md:hidden w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
                </button>
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
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={isRefreshing}
              title="Actualizar datos"
              className="hidden md:flex w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
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

            {/* Gráficos Principales y Widgets */}
            <div className="xl:col-span-12 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <h3 className="text-gray-800 font-black text-lg flex items-center gap-2">
                    <Activity size={18} className="text-blue-500"/> Crecimiento de la Red
                  </h3>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 gap-1">
                    {[3, 6, 12].map(n => (
                      <button
                        key={n}
                        onClick={() => setGrowthMonths(n)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${growthMonths === n ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {n} meses
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Mes</th>
                        <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-purple-400">Usuarios</th>
                        <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-yellow-500">Anuncios</th>
                        <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-blue-400">Vistas</th>
                        <th className="text-right py-3 px-4 text-[10px] font-black uppercase tracking-widest text-red-400">Likes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats.growth || []).map((row, idx) => {
                        const isCurrentMonth = idx === (stats.growth?.length ?? 0) - 1;
                        return (
                          <tr
                            key={row.key}
                            className={`border-b border-gray-50 transition-colors ${isCurrentMonth ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="py-3 px-4 font-black text-[#1A1A3A] text-sm flex items-center gap-2">
                              {isCurrentMonth && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>}
                              {row.name}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg text-xs">{row.users}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg text-xs">{row.ads}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg text-xs">{row.views}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg text-xs">{row.likes}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                        <td className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-purple-600 text-xs">{(stats.growth || []).reduce((s, r) => s + r.users, 0)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-yellow-600 text-xs">{(stats.growth || []).reduce((s, r) => s + r.ads, 0)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-blue-600 text-xs">{(stats.growth || []).reduce((s, r) => s + r.views, 0)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-red-500 text-xs">{(stats.growth || []).reduce((s, r) => s + r.likes, 0)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Widgets Inferiores - Fila de 3 en LG */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Categorías (Bar Graph) */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-start">
                  <h3 className="text-gray-800 font-black mb-6 flex items-center gap-2"><Layers size={18} className="text-[#8B5CF6]" /> Top Categorías</h3>
                  <div className="w-full flex flex-col gap-4">
                    {stats.categories.slice(0, 5).map((cat, idx) => {
                      const maxVal = Math.max(...stats.categories.slice(0, 5).map(c => c.value), 1);
                      const pct = (cat.value / maxVal) * 100;
                      return (
                        <div key={idx} className="w-full flex items-center gap-4">
                          <div className="flex-1 bg-gray-50 h-10 md:h-12 rounded-xl relative overflow-hidden flex items-center text-sm">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${pct}%` }} 
                              transition={{ duration: 1, ease: 'easeOut' }} 
                              className="absolute top-0 left-0 h-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length], opacity: 0.8 }}
                            ></motion.div>
                            <span className="absolute inset-0 flex items-center px-4 font-bold text-gray-800 line-clamp-1 truncate z-10">{cat.name}</span>
                          </div>
                          <span className="text-sm font-black text-[#1A1A3A] w-8 text-right">{cat.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Presencia Global (Bar Graph) */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-start">
                  <h3 className="text-gray-800 font-black mb-6 flex items-center gap-2"><Globe size={18} className="text-[#06B6D4]" /> Presencia Global</h3>
                  <div className="w-full flex-1 flex flex-col gap-4">
                    {stats.geo && stats.geo.length > 0 ? stats.geo.map((country, idx) => {
                      const maxVal = Math.max(...stats.geo.map(c => c.value), 1);
                      const pct = (country.value / maxVal) * 100;
                      return (
                        <div key={idx} className="w-full flex items-center gap-4">
                          <div className="flex-1 bg-gray-50 h-10 md:h-12 rounded-xl relative overflow-hidden flex items-center text-sm">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${pct}%` }} 
                              transition={{ duration: 1, ease: 'easeOut' }} 
                              className="absolute top-0 left-0 h-full"
                              style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length], opacity: 0.8 }}
                            ></motion.div>
                            <span className="absolute inset-0 flex items-center px-4 font-bold text-gray-800 truncate z-10 gap-2">
                              <span className="text-lg">{country.flag}</span> {country.name}
                            </span>
                          </div>
                          <span className="text-sm font-black text-[#1A1A3A] w-8 text-right">{country.value}</span>
                        </div>
                      )
                    }) : (
                      <p className="text-sm font-bold text-gray-400 text-center py-8">Aún no hay datos geográficos</p>
                    )}
                  </div>
                </div>

                {/* Seguridad Mi Pana (Movido aquí para balancear layout) */}
                <div className="bg-black p-6 md:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFD700] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <ShieldCheck className="w-8 h-8 text-[#FFD700]" />
                    <h3 className="font-black text-xl">Seguridad</h3>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10 gap-2">
                    <p className="text-xs text-gray-400 font-medium">Casos pendientes de revisión.</p>
                    
                    {pendingReportsCount > 0 ? (
                      <div className="flex flex-col items-center justify-center bg-red-500 text-white rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0 scale-90">
                        <span className="text-xl font-black leading-none">{pendingReportsCount}</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold">Nuevos</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl px-4 py-2 shrink-0 scale-90">
                        <CheckCircle className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Al Día</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setIsReportsModalOpen(true)}
                    className="w-full bg-[#FFD700] text-black font-black py-3.5 rounded-2xl shadow-[0_10px_20px_rgba(255,215,0,0.2)] hover:bg-[#FFE033] active:scale-95 transition-all relative z-10 text-sm"
                  >
                    Ver Reportes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mantenemos tus condicionales de tabs igual para no romper la lógica */}
        {activeTab === 'usuarios' && <AdminUsersTab searchQuery={globalSearch} />}
        {activeTab === 'anuncios' && <AdminAdsTab searchQuery={globalSearch} />}
        {activeTab === 'categorias' && <AdminCategoriesTab />}
        {activeTab === 'paises' && <AdminCountriesTab />}
        {activeTab === 'verifications' && <AdminVerificationsTab />}
        {activeTab === 'notificaciones' && <AdminNotificationsTab />}
        {activeTab === 'programadas' && <AdminScheduledNotifsTab />}
        {activeTab === 'estadisticas' && <AdminStatsTab />}

        <AdminReportsModal 
          isOpen={isReportsModalOpen} 
          onClose={() => setIsReportsModalOpen(false)} 
        />

        <style dangerouslySetInnerHTML={{
          __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
      </div>
    </div>
  </div>
);
}