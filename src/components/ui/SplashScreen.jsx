import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoFull from '../../assets/Logo_Mi_pana.png';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedCountry } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login');
      } else if (!selectedCountry) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, user, selectedCountry]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6"
      style={{ background: 'linear-gradient(160deg, #FFC200 0%, #F8E22A 60%)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center relative w-full">
        {/* Logo with bounce animation defined in index.css */}
        <img
          src={logoFull}
          alt="miPana"
          style={{ width: "280px", maxWidth: "80vw", animation: "bounce 2.5s ease-in-out infinite" }}
        />

        <div className="mt-2 text-center">
          <h1
            className="text-[22px] tracking-tight leading-none"
            style={{ color: '#000000' }}
          >
            <span className="font-black">Juntos</span> <span className="font-semibold">Somos</span> <span className="font-black">Más</span>
          </h1>
        </div>

        {/* Loading Indicator - Ahora con los colores del tricolor */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ backgroundColor: '#FFC200', animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ backgroundColor: '#003366', animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full animate-bounce shadow-sm" style={{ backgroundColor: '#D90429', animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
