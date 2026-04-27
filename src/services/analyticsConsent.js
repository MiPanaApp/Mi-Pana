import { analyticsReady } from './firebase';
import { setAnalyticsCollectionEnabled } from 'firebase/analytics';

export async function applyAllConsents(consentObj) {
  const isAccepted = consentObj.analytics === true || consentObj.googleAnalytics === true;

  // 1. Firebase Analytics & Google Analytics 4
  // Al usar Firebase, setAnalyticsCollectionEnabled controla la recolección de datos.
  try {
    const analyticsInstance = await analyticsReady;
    if (analyticsInstance) {
      setAnalyticsCollectionEnabled(analyticsInstance, isAccepted);
    }
  } catch(e) { 
    console.warn('Firebase analytics consent error:', e);
  }

  // 2. Google Consent Mode v2 (Update global)
  // Siempre usamos gtag() que está pre-definido en index.html como shim
  if (typeof window.gtag === 'function') {
    const status = isAccepted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      analytics_storage: status,
      ad_storage: status,
      ad_user_data: status,
      ad_personalization: status
    });
    
    // Si se aceptó, enviamos un evento de actualización de consentimiento
    if (isAccepted) {
      window.gtag('event', 'consent_updated', {
        'analytics': consentObj.analytics,
        'google_analytics': consentObj.googleAnalytics
      });
    }
  }

  // 3. Meta Pixel — activar/desactivar según consentimiento
  if (typeof window.fbq === 'function') {
    if (consentObj.metaPixel === true) {
      window.fbq('consent', 'grant');
    } else {
      window.fbq('consent', 'revoke');
    }
  }
}

