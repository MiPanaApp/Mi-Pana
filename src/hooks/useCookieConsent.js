import { useState, useCallback } from 'react';
import { applyAllConsents } from '../services/analyticsConsent';

export function useCookieConsent() {
  const readConsent = () => {
    try {
      const val = localStorage.getItem('mipana_cookie_consent');
      if (val) return JSON.parse(val);
    } catch(e) { console.warn(e); }
    return null;
  };

  const [consent, setConsent] = useState(readConsent());
  const hasDecided = consent?.decided === true;

  const updateConsent = useCallback((newConsent) => {
    const objToSave = {
      ...newConsent,
      version: '1.0',
      date: new Date().toISOString(),
      decided: true
    };
    localStorage.setItem('mipana_cookie_consent', JSON.stringify(objToSave));
    setConsent(objToSave);
    applyAllConsents(objToSave);
  }, []);

  const resetConsent = useCallback(() => {
    const current = readConsent() || { necessary: true, analytics: false, googleAnalytics: false };
    const resetObj = { ...current, decided: false };
    localStorage.setItem('mipana_cookie_consent', JSON.stringify(resetObj));
    setConsent(resetObj);
  }, []);

  return { consent, hasDecided, updateConsent, resetConsent };
}
