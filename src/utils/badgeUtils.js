/**
 * badgeUtils.js
 * Lógica centralizada para los badges de producto: NUEVO, TOP, POPULAR
 * - NUEVO: publicado hace ≤ 30 días
 * - TOP:   rating >= 4.5 (el mejor valorado)
 * - POPULAR: searchCount >= 3 (más buscado)
 */

export const BADGE_STYLES = {
  NUEVO:   { bg: 'bg-[#D90429]',  label: 'NUEVO'   },
  TOP:     { bg: 'bg-[#0056B3]',  label: 'TOP'     },
  POPULAR: { bg: 'bg-[#FF6B00]',  label: 'POPULAR' },
};

// Umbrales configurables
const THRESHOLDS = {
  topRating:      4.5,   // rating mínimo para ser TOP
  popularSearches: 3,    // searchCount mínimo para ser POPULAR
  newDays:         30,   // días desde creación para ser NUEVO
};

function getMillis(dateObj) {
  if (!dateObj) return 0;
  if (dateObj.toMillis) return dateObj.toMillis();
  if (dateObj.seconds) return dateObj.seconds * 1000;
  if (typeof dateObj === 'string' || typeof dateObj === 'number') return new Date(dateObj).getTime();
  if (dateObj instanceof Date) return dateObj.getTime();
  return 0;
}

/**
 * Devuelve el badge que corresponde al producto según métricas reales de Firebase.
 * Prioridad: NUEVO > TOP > POPULAR > null
 *
 * @param {object} product - Documento de producto de Firestore
 * @returns {'NUEVO'|'TOP'|'POPULAR'|null}
 */
export function getBadge(product) {
  if (!product) return null;

  // 1️⃣ NUEVO — publicado hace ≤ 30 días
  if (product.createdAt) {
    const ms = getMillis(product.createdAt);
    if (ms > 0) {
      const diffDays = (Date.now() - ms) / (1000 * 60 * 60 * 24);
      if (diffDays <= THRESHOLDS.newDays) return 'NUEVO';
    }
  }

  // 2️⃣ TOP — tiene rating >= 4.5 (datos reales de valoraciones)
  if ((product.rating || 0) >= THRESHOLDS.topRating) return 'TOP';

  // 3️⃣ POPULAR — tiene searchCount >= 3 (datos reales de búsquedas)
  if ((product.searchCount || 0) >= THRESHOLDS.popularSearches) return 'POPULAR';

  return null;
}
