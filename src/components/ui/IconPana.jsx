import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Componente envoltorio para iconos con estilo Claymorphism.
 * @param {Object} props - Icon (componente de react-icons), size, color, className.
 */
export const IconPana = ({ icon: Icon, size = 24, className }) => {
  return (
    <div className={twMerge(
      "flex items-center justify-center rounded-[1.2rem] p-3 w-[60px] h-[60px]",
      "bg-[#EDEDF5] shadow-clay-icon",
      "text-[#1A1A3A] transition-transform active:scale-90 border border-white/50",
      className
    )}>
      <Icon size={size} />
    </div>
  );
};
