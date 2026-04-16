import { analytics } from './firebase';
import { setAnalyticsCollectionEnabled } from 'firebase/analytics';

export function applyAllConsents(consentObj) {
  // 1. Firebase Analytics
  try {
    // Si la inicialización de firebase/analytics fue exitosa o no nula
    if (analytics) {
      setAnalyticsCollectionEnabled(analytics, consentObj.analytics);
    }
  } catch(e) { console.warn('Firebase analytics consent:', e); }

  // 2. Google Consent Mode v2
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: consentObj.googleAnalytics ? 'granted' : 'denied'
    });
  }

  // 3. Inyectar script GA4 solo si se acepta y no existe
  if (consentObj.googleAnalytics) {
    const existingScript = document.getElementById('ga4-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'ga4-script';
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DR5ZDRW90N';
      document.head.appendChild(script);
      script.onload = () => {
        window.gtag('config', 'G-DR5ZDRW90N');
      };
    }
  }
}
