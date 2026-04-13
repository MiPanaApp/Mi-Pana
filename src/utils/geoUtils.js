export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  // Fórmula de Haversine
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getUserProvince = async (lat, lng) => {
  // 1. Revisar caché
  const cacheKey = `userLocation_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) { // 24h
        return data;
      }
    } catch (e) {
      console.error('Error parsing cache', e);
    }
  }
  
  // 2. Debouncing / Delay para rate limit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Petición a Nominatim
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'MiPanaApp/1.0' } }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const location = {
        level1: data.address.state || '',
        level2: data.address.province || data.address.county || data.address.city || data.address.town || '',
        country: data.address.country_code ? data.address.country_code.toUpperCase() : '',
        lat,
        lng
      };
      
      // 4. Guardar en caché
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: location, timestamp: Date.now() })
      );
      
      return location;
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
  }
  
  // 5. Fallback
  return null;
};

// Diccionario inicial top-tier provincias españolas (hardcoded)
// Puedes ampliarlo luego
const MOCK_NEARBY_PROVINCES = {
  'Valencia': ['Castellón', 'Alicante', 'Cuenca', 'Albacete', 'Teruel'],
  'Madrid': ['Toledo', 'Segovia', 'Ávila', 'Guadalajara', 'Cuenca'],
  'Barcelona': ['Tarragona', 'Lleida', 'Girona'],
  'Sevilla': ['Huelva', 'Cádiz', 'Málaga', 'Córdoba', 'Badajoz'],
};

export const getNearbyProvinces = (province) => {
  if (!province) return [];
  // Buscar coincidencia parcial (ej. "Provincia de Valencia" -> "Valencia")
  const key = Object.keys(MOCK_NEARBY_PROVINCES).find(k => province.includes(k) || k.includes(province));
  return key ? MOCK_NEARBY_PROVINCES[key] : [];
};

export const getCoordsFromLocation = async (country, level1, level2) => {
  try {
    // Construir query de búsqueda
    const query = `${level2}, ${level1}, ${country}`;
    
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

