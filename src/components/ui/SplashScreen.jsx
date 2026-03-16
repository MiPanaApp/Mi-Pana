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
        
        <div className="mt-6">
          <h1 
            className="text-lg font-black tracking-tight text-center" 
            style={{ color: '#000000' }}
          >
            Juntos Somos Más
          </h1>
        </div>
      </div>

      {/* Botón eliminado a petición del usuario */}
    </div>
  );
}
