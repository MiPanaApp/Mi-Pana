import { useState, useEffect, useRef } from 'react';
import { useSpainLocations } from '../../hooks/useSpainLocations';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SpainLocationSelector — Selector en cascada de 3 niveles para España
 * Comunidad Autónoma → Provincia → Municipio
 * Estilo premium Soft UI / Neumorphism
 */
export default function SpainLocationSelector({
  onChange,
  defaultCommunity = '',
  defaultProvince = '',
  defaultMunicipality = '',
  showMunicipality = true,
  disabled = false
}) {
  const { getCommunities, getProvinces, getMunicipalities, getCommunityName, getProvinceName } = useSpainLocations();

  const [community, setCommunity] = useState(defaultCommunity);
  const [province, setProvince] = useState(defaultProvince);
  const [municipality, setMunicipality] = useState(defaultMunicipality);

  // Estados para controlar qué dropdown está abierto
  const [openDropdown, setOpenDropdown] = useState(null); // 'community', 'province', 'municipality'

  const containerRef = useRef(null);

  // Notificar cambios al componente padre
  useEffect(() => {
    onChange?.({ community, province, municipality });
  }, [community, province, municipality]);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const communities = getCommunities();
  const provinces = getProvinces(community);
  const municipalities = getMunicipalities(community, province);

  // Helper para renderizar un item del dropdown
  const DropdownItem = ({ label, isSelected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-xl text-left font-bold text-sm transition-all flex items-center justify-between group ${isSelected
        ? 'bg-[#1A1A3A] text-white shadow-lg'
        : 'text-[#1A1A3A]/70 hover:bg-white/50'
        }`}
    >
      <span className="truncate">{label}</span>
      {isSelected && <CheckCircle2 size={14} className="text-white flex-shrink-0" />}
    </button>
  );

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>

      {/* Nivel 1: Comunidad Autónoma */}
      <div className="relative">
        <div
          onClick={() => !disabled && setOpenDropdown(openDropdown === 'community' ? null : 'community')}
          className={`w-full h-14 px-5 flex items-center justify-between bg-[#E0E5EC] rounded-2xl cursor-pointer transition-all ${openDropdown === 'community'
            ? 'shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]'
            : 'shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`text-base font-semibold truncate ${community ? 'text-[#1A1A3A]' : 'text-gray-400/70'}`}>
            {getCommunityName(community) || 'Selecciona comunidad autónoma'}
          </span>
          <ChevronDown className={`w-5 h-5 text-[#1A1A3A] transition-transform duration-300 ${openDropdown === 'community' ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {openDropdown === 'community' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute left-0 right-0 top-full z-[70] mt-2 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {communities.map((c) => (
                  <DropdownItem
                    key={c.code}
                    label={c.name}
                    isSelected={community === c.code}
                    onClick={() => {
                      setCommunity(c.code);
                      setProvince('');
                      setMunicipality('');
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nivel 2: Provincia */}
      <div className="relative">
        <div
          onClick={() => !disabled && community && setOpenDropdown(openDropdown === 'province' ? null : 'province')}
          className={`w-full h-14 px-5 flex items-center justify-between bg-[#E0E5EC] rounded-2xl transition-all ${!community || disabled
            ? 'opacity-50 cursor-not-allowed shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]'
            : openDropdown === 'province'
              ? 'cursor-pointer shadow-[inset_4px_4px_8_rgba(163,177,198,0.6),inset_-4px_-4px_8_rgba(255,255,255,0.8)]'
              : 'cursor-pointer shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
            }`}
        >
          <span className={`text-base font-semibold truncate ${province ? 'text-[#1A1A3A]' : 'text-gray-400/70'}`}>
            {getProvinceName(community, province) || (community ? 'Selecciona provincia' : 'Selecciona comunidad primero')}
          </span>
          <ChevronDown className={`w-5 h-5 text-[#1A1A3A] transition-transform duration-300 ${openDropdown === 'province' ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {openDropdown === 'province' && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute left-0 right-0 top-full z-[69] mt-2 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {provinces.map((p) => (
                  <DropdownItem
                    key={p.code}
                    label={p.name}
                    isSelected={province === p.code}
                    onClick={() => {
                      setProvince(p.code);
                      setMunicipality('');
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nivel 3: Municipio */}
      {showMunicipality && (
        <div className="relative">
          <div
            onClick={() => !disabled && province && setOpenDropdown(openDropdown === 'municipality' ? null : 'municipality')}
            className={`w-full h-14 px-5 flex items-center justify-between bg-[#E0E5EC] rounded-2xl transition-all ${!province || disabled
              ? 'opacity-50 cursor-not-allowed shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]'
              : openDropdown === 'municipality'
                ? 'cursor-pointer shadow-[inset_4px_4px_8_rgba(163,177,198,0.6),inset_-4px_-4px_8_rgba(255,255,255,0.8)]'
                : 'cursor-pointer shadow-[6px_6px_12px_rgba(163,177,198,0.7),-6px_-6px_12px_rgba(255,255,255,0.9)]'
              }`}
          >
            <span className={`text-base font-semibold truncate ${municipality ? 'text-[#1A1A3A]' : 'text-gray-400/70'}`}>
              {municipality || (province ? 'Selecciona municipio' : 'Selecciona provincia primero')}
            </span>
            <ChevronDown className={`w-5 h-5 text-[#1A1A3A] transition-transform duration-300 ${openDropdown === 'municipality' ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {openDropdown === 'municipality' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute left-0 right-0 top-full z-[68] mt-2 bg-[#E0E5EC] rounded-2xl shadow-[8px_8px_16px_rgba(163,177,198,0.8),-8px_-8px_16px_rgba(255,255,255,1)] border border-white/40 overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                  {municipalities.map((m) => (
                    <DropdownItem
                      key={m.code}
                      label={m.name}
                      isSelected={municipality === m.name}
                      onClick={() => {
                        setMunicipality(m.name);
                        setOpenDropdown(null);
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}

