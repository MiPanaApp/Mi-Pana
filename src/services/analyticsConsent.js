import { analyticsReady } from './firebase';
import { setAnalyticsCollectionEnabled } from 'firebase/analytics';

export async function applyAllConsents(consentObj) {

  // 1. Firebase Analytics — esperar a que esté inicializado
  try {
    const analyticsInstance = await analyticsReady;
    if (analyticsInstance) {
      setAnalyticsCollectionEnabled(
        analyticsInstance, 
        consentObj.analytics === true
      );
    }
  } catch(e) { 
    console.warn('Firebase analytics consent:', e);
  }

  // 2. Google Consent Mode v2
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: consentObj.googleAnalytics === true ? 'granted' : 'denied',
      ad_storage: consentObj.googleAnalytics === true ? 'granted' : 'denied',
      ad_user_data: consentObj.googleAnalytics === true ? 'granted' : 'denied',
      ad_personalization: consentObj.googleAnalytics === true ? 'granted' : 'denied'
    });
  }

  // 3. Inyectar script GA4 solo si se acepta y no existe
  if (consentObj.googleAnalytics === true) {
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
