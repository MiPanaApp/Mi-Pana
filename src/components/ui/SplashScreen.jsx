import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoFull from '../../assets/Logo_Mi_pana.png';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

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

        {/* Loading Indicator - Ahora a 40px del texto */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
