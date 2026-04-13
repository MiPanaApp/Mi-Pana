import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// ========================================
// FUNCIÓN PRINCIPAL: Obtener ubicación actual
// ========================================
export const getUserLocation = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // ✅ VERSIÓN NATIVA (Android/iOS)
      console.log('[geoUtils] Usando geolocalización nativa');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } else {
      // ✅ VERSIÓN WEB (navegador)
      console.log('[geoUtils] Usando geolocalización web');
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocalización no disponible'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });
    }
  } catch (error) {
    console.error('[geoUtils] Error obteniendo ubicación:', error);
    throw error;
  }
};

// ========================================
// Haversine (sin cambios)
// ========================================
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ========================================
// Reverse Geocoding (sin cambios)
// ========================================
export const getUserProvince = async (lat, lng) => {
  const cacheKey = `userLocation_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    } catch (e) {
      console.warn('[geoUtils] Cache corrupto, refetching');
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'MiPanaApp/1.0' } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    const location = {
      country: data.address.country_code?.toUpperCase() || '',
      level1: data.address.state || '',
      level2: data.address.province || data.address.county || '',
      level3: data.address.city || data.address.town || data.address.village || '',
    };

    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: location, timestamp: Date.now() })
    );

    return location;
  } catch (error) {
    console.warn('[geoUtils] Error reverse geocoding:', error);
    return null;
  }
};

// ========================================
// Forward Geocoding (sin cambios)
// ========================================
export const getCoordsFromLocation = async (country, level1, level2, level3) => {
  try {
    const query = level3
      ? `${level3}, ${level2}, ${level1}, ${country}`
      : `${level2}, ${level1}, ${country}`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'MiPanaApp/1.0'
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    return null;
  } catch (error) {
    console.warn('[geoUtils] Error en getCoordsFromLocation:', error);
    return null;
  }
};

// ========================================
// Provincias cercanas
// ========================================
export const getNearbyProvinces = (province) => {
  const nearbyMap = {
    'Valencia': ['Castellón', 'Alicante', 'Cuenca', 'Albacete'],
    'Madrid': ['Guadalajara', 'Toledo', 'Ávila', 'Segovia'],
    'Barcelona': ['Girona', 'Tarragona', 'Lleida'],
  };

  return nearbyMap[province] || [];
};