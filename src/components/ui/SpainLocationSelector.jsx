import { useState, useEffect } from 'react';
import { useSpainLocations } from '../../hooks/useSpainLocations';
import { ChevronDown } from 'lucide-react';

/**
 * SpainLocationSelector — Selector en cascada de 3 niveles para España
 * Comunidad Autónoma → Provincia → Municipio
 *
 * Props:
 *   onChange(location)       — callback cuando cambia cualquier nivel
 *   defaultCommunity         — código inicial de comunidad (ej: 'MD')
 *   defaultProvince          — código inicial de provincia (ej: 'M')
 *   defaultMunicipality      — nombre inicial del municipio
 *   showMunicipality         — mostrar tercer selector (default: true)
 *   disabled                 — deshabilitar todos los selectores
 */
export default function SpainLocationSelector({
  onChange,
  defaultCommunity = '',
  defaultProvince = '',
  defaultMunicipality = '',
  showMunicipality = true,
  disabled = false
}) {
  const { getCommunities, getProvinces, getMunicipalities } = useSpainLocations();

  const [community, setCommunity] = useState(defaultCommunity);
  const [province, setProvince] = useState(defaultProvince);
  const [municipality, setMunicipality] = useState(defaultMunicipality);

  // Notificar cambios al componente padre
  useEffect(() => {
    onChange?.({ community, province, municipality });
  }, [community, province, municipality]);

  // Clases reutilizables para los selects (Soft UI coherente con la app)
  const baseSelectClass = [
    'w-full px-4 py-3 rounded-2xl',
    'bg-[#E0E5EC] text-[#1A1A3A] font-semibold',
    'text-sm appearance-none cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-[#FFB400]/50',
    'transition-all',
  ].join(' ');

  const activeSelectClass = baseSelectClass +
    ' shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]';

  const disabledSelectClass = baseSelectClass +
    ' opacity-50 cursor-not-allowed shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]';

  const provinces = getProvinces(community);
  const municipalities = getMunicipalities(community, province);

  return (
    <div className="flex flex-col gap-3">

      {/* Nivel 1: Comunidad Autónoma */}
      <div className="relative">
        <select
          value={community}
          disabled={disabled}
          onChange={(e) => {
            setCommunity(e.target.value);
            setProvince('');
            setMunicipality('');
          }}
          className={community ? activeSelectClass : disabledSelectClass.replace('opacity-50 cursor-not-allowed', 'cursor-pointer opacity-100')}
        >
          <option value="">Selecciona comunidad autónoma</option>
          {getCommunities().map(c => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 pointer-events-none"
        />
      </div>

      {/* Nivel 2: Provincia (solo si se eligió comunidad) */}
      <div className="relative">
        <select
          value={province}
          disabled={disabled || !community}
          onChange={(e) => {
            setProvince(e.target.value);
            setMunicipality('');
          }}
          className={!community ? disabledSelectClass : activeSelectClass}
        >
          <option value="">
            {community ? 'Selecciona provincia' : 'Primero selecciona comunidad'}
          </option>
          {provinces.map(p => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 pointer-events-none"
        />
      </div>

      {/* Nivel 3: Municipio (solo si se eligió provincia y showMunicipality=true) */}
      {showMunicipality && (
        <div className="relative">
          <select
            value={municipality}
            disabled={disabled || !province}
            onChange={(e) => setMunicipality(e.target.value)}
            className={!province ? disabledSelectClass : activeSelectClass}
          >
            <option value="">
              {province ? 'Selecciona municipio' : 'Primero selecciona provincia'}
            </option>
            {municipalities.map(m => (
              <option key={m.code} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A3A]/40 pointer-events-none"
          />
        </div>
      )}

    </div>
  );
}
