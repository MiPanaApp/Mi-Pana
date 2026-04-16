import { SlidersHorizontal } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useCookieConsent } from '../hooks/useCookieConsent';

export default function CookieSettingsButton() {
  const { hasDecided, resetConsent } = useCookieConsent();

  if (Capacitor.isNativePlatform()) return null;
  if (!hasDecided) return null;

  return (
    <button
      onClick={resetConsent}
      className="fixed bottom-4 left-4 z-[9997] bg-[#E8E8F0] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.8)] rounded-xl px-3 py-2 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-all text-[#1A1A3A]/60"
    >
      <SlidersHorizontal size={14} />
      <span className="text-[10px] font-black">Cookies</span>
    </button>
  );
}
