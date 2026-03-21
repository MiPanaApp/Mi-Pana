import { algoliasearch } from 'algoliasearch';

// Solo Search-Only Key en el frontend ✅ — Admin Key NUNCA aquí
export const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

/**
 * Búsqueda de productos con filtros opcionales.
 * Usa la API v5 de Algolia (searchSingleIndex).
 */
export async function searchProducts({
  query       = '',
  country     = '',
  category    = '',
  verified    = null,
  premium     = null,
  page        = 0,
  hitsPerPage = 20,
} = {}) {
  const filters = ['active:true'];

  if (country)           filters.push(`country:"${country}"`);
  if (category)          filters.push(`category:"${category}"`);
  if (verified === true) filters.push('verified:true');
  if (premium  === true) filters.push('premium:true');

  return searchClient.searchSingleIndex({
    indexName: import.meta.env.VITE_ALGOLIA_INDEX_NAME,
    searchParams: {
      query,
      filters:    filters.join(' AND '),
      page,
      hitsPerPage,
    },
  });
}
