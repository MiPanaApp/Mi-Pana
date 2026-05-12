/**
 * list-ads-by-city.js
 * Lista todos los anuncios activos de Firestore agrupados por ciudad.
 * Usa la Firestore REST API (no requiere service account).
 * Uso: node list-ads-by-city.js
 */

const https = require('https');

const PROJECT_ID = 'app-mi-pana';
const API_KEY    = 'AIzaSyAxUcuTe63vywz4K58d75lLa0V9HNLfUe4';

// Firestore REST: lista documentos de una colección con paginación
function firestoreGet(path, pageToken) {
  return new Promise((resolve, reject) => {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}?pageSize=300&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Extrae el valor de un campo Firestore (soporta string, integer, map, etc.)
function extractValue(field) {
  if (!field) return undefined;
  if (field.stringValue  !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return field.integerValue;
  if (field.doubleValue  !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return new Date(field.timestampValue).toLocaleDateString('es-ES');
  if (field.mapValue) {
    const result = {};
    const fs = field.mapValue.fields || {};
    for (const k of Object.keys(fs)) result[k] = extractValue(fs[k]);
    return result;
  }
  if (field.arrayValue) {
    return (field.arrayValue.values || []).map(extractValue);
  }
  return JSON.stringify(field);
}

// Obtiene TODOS los docs de products (paginando si necesario)
async function getAllProducts() {
  const all = [];
  let pageToken = null;

  do {
    const resp = await firestoreGet('products', pageToken);
    if (resp.error) {
      console.error('❌ Error Firestore:', resp.error.message);
      process.exit(1);
    }
    const docs = resp.documents || [];
    docs.forEach(doc => {
      const fields = doc.fields || {};
      const data = {};
      for (const k of Object.keys(fields)) data[k] = extractValue(fields[k]);
      data._id = doc.name.split('/').pop();
      all.push(data);
    });
    pageToken = resp.nextPageToken || null;
  } while (pageToken);

  return all;
}

async function main() {
  console.log('📦 Consultando anuncios en Firestore...\n');

  const allProducts = await getAllProducts();

  // Filtrar solo los activos
  const active = allProducts.filter(d => d.status === 'active');
  // También incluir los que no tienen status (datos legacy)
  const noStatus = allProducts.filter(d => !d.status);

  const products = [...active, ...noStatus];

  if (products.length === 0) {
    console.log('No se encontraron anuncios publicados.');
    return;
  }

  const byCity = {};

  products.forEach(d => {
    // Determinar la ciudad con múltiples fallbacks según el esquema de datos
    const loc = d.location || {};
    const city =
      d.city ||
      loc.municipality ||
      loc.level3 ||
      loc.level2 ||
      '(Sin ciudad)';

    const country =
      d.country ||
      loc.country ||
      loc.communityName ||
      loc.level1 ||
      '';

    const region =
      d.region ||
      loc.provinceName ||
      loc.province ||
      loc.level2 ||
      '';

    const key = city;
    if (!byCity[key]) byCity[key] = { country, region, ads: [] };

    byCity[key].ads.push({
      id: d._id,
      name: d.name || '(sin título)',
      category: d.category || '—',
      price: d.price || '—',
      sellerName: d.userName || '—',
      createdAt: d.createdAt || '—',
      status: d.status || '(legacy)',
    });
  });

  // Ordenar por cantidad de anuncios descendente
  const sorted = Object.entries(byCity).sort((a, b) => b[1].ads.length - a[1].ads.length);

  console.log(`✅ Total anuncios publicados: ${products.length}  (${active.length} activos + ${noStatus.length} legacy)`);
  console.log(`🏙️  Ciudades/zonas encontradas: ${sorted.length}\n`);
  console.log('='.repeat(72));

  for (const [city, data] of sorted) {
    const breadcrumb = [city, data.region, data.country].filter(x => x && x !== city).join(' · ');
    console.log(`\n📍  ${city}${breadcrumb ? '  (' + breadcrumb + ')' : ''}  —  ${data.ads.length} anuncio(s)`);
    console.log('─'.repeat(72));

    data.ads.forEach((ad, i) => {
      console.log(`  ${String(i + 1).padStart(2, ' ')}. [${ad.category}] ${ad.name}`);
      console.log(`      💰 ${ad.price}   👤 ${ad.sellerName}   📅 ${ad.createdAt}   🏷 ${ad.status}`);
      console.log(`      🔗 /product/${ad.id}`);
    });
  }

  console.log('\n' + '='.repeat(72));
  console.log('✔ Consulta completada.\n');
}

main().catch(console.error);
