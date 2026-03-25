import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, UserCircle2, LogOut, ChevronRight, Edit2, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { userData, currentUser, userAvatar, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const ProfileItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-4 p-4 bg-[#E0E5EC] rounded-2xl shadow-[4px_4px_10px_rgba(163,177,198,0.5),-4px_-4px_10px_rgba(255,255,255,0.95)] border border-white/40 group active:scale-[0.98] transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(163,177,198,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] ${color || 'text-[#1A1A3A]'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-[#8888AA] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-[#1A1A3A] truncate">{value || 'No especificado'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E0E5EC] pb-24 pt-safe safe-area-pt px-6">
      {/* Header Profile */}
      <div className="flex flex-col items-center pt-8 pb-10">
        <div className="relative">
          <div className="w-28 h-28 bg-[#E0E5EC] rounded-full p-1 shadow-[8px_8px_20px_rgba(163,177,198,0.7),-8px_-8px_20px_rgba(255,255,255,0.95)] border-4 border-white overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                <UserCircle2 size={64} className="text-[#1A1A3A]/20" />
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-[#FFB400] text-white rounded-xl shadow-lg border-2 border-white active:scale-90 transition-transform">
            <Edit2 size={16} />
          </button>
        </div>
        
        <h1 className="mt-4 text-2xl font-black text-[#1A1A3A] tracking-tight">
          {userData?.name 
            ? `${userData.name} ${userData?.lastName || ''}`.trim()
            : (currentUser?.displayName || 'Mi Pana')}
        </h1>
        <div className="flex items-center gap-1 mt-1 text-[#0056B3] font-bold text-xs bg-[#0056B3]/10 px-3 py-1 rounded-full border border-[#0056B3]/20">
          <ShieldCheck size={14} /> Pana Verificado Nivel {userData?.verificationLevel || 1}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <ProfileItem 
          icon={Mail} 
          label="Correo Electrónico" 
          value={userData?.email} 
          color="text-[#0056B3]"
        />
        <ProfileItem 
          icon={Phone} 
          label="Teléfono" 
          value={userData?.phone} 
          color="text-[#2D2D5E]"
        />
        <ProfileItem 
          icon={MapPin} 
          label="País y Ciudad" 
          value={`${userData?.country?.split(' ').slice(1).join(' ') || ''}${userData?.region ? `, ${userData.region}` : ''}`} 
          color="text-[#D90429]"
        />
        <ProfileItem 
          icon={Calendar} 
          label="Fecha de Nacimiento" 
          value={userData?.birthDate ? userData.birthDate.split('-').reverse().join('/') : ''} 
          color="text-[#FFB400]"
        />
        <ProfileItem 
          icon={User} 
          label="Sexo" 
          value={userData?.gender} 
          color="text-purple-600"
        />
        <ProfileItem 
          icon={Star} 
          label="Rol en Mi Pana" 
          value={userData?.role === 'buyer' ? 'Comprador' : 'Vendedor'} 
          color="text-green-600"
        />
      </div>

      {/* Logout Button */}
      <div className="max-w-4xl mx-auto mt-12 pb-10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-[#E0E5EC] text-[#D90429] font-black rounded-3xl shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.9)] hover:shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all active:scale-95 group border border-white/40"
        >
          <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
