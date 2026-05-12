/**
 * export-ads-csv.js
 * Exporta todos los anuncios publicados de Firestore a CSV.
 * Uso: node export-ads-csv.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PROJECT_ID = 'app-mi-pana';
const API_KEY    = 'AIzaSyAxUcuTe63vywz4K58d75lLa0V9HNLfUe4';

function firestoreGet(collPath, pageToken) {
  return new Promise((resolve, reject) => {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collPath}?pageSize=300&key=${API_KEY}`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function extractValue(field) {
  if (!field) return '';
  if (field.stringValue  !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return field.integerValue;
  if (field.doubleValue  !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return new Date(field.timestampValue).toLocaleDateString('es-ES');
  if (field.mapValue) {
    const result = {};
    for (const k of Object.keys(field.mapValue.fields || {}))
      result[k] = extractValue(field.mapValue.fields[k]);
    return result;
  }
  if (field.arrayValue) return (field.arrayValue.values || []).map(extractValue).join('; ');
  return '';
}

async function getAllProducts() {
  const all = [];
  let pageToken = null;
  do {
    const resp = await firestoreGet('products', pageToken);
    if (resp.error) { console.error('❌ Firestore error:', resp.error.message); process.exit(1); }
    (resp.documents || []).forEach(doc => {
      const fields = doc.fields || {};
      const d = {};
      for (const k of Object.keys(fields)) d[k] = extractValue(fields[k]);
      d._id = doc.name.split('/').pop();
      all.push(d);
    });
    pageToken = resp.nextPageToken || null;
  } while (pageToken);
  return all;
}

// Escapa un valor para CSV (RFC 4180)
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

async function main() {
  console.log('📦 Consultando Firestore...');
  const all = await getAllProducts();
  const products = all.filter(d => d.status !== 'hidden' && d.status !== 'inactive');

  const rows = products.map(d => {
    const loc = typeof d.location === 'object' ? d.location : {};
    const city    = d.city || loc.municipality || loc.level3 || loc.level2 || '';
    const region  = d.region || loc.provinceName || loc.province || loc.level2 || '';
    const country = d.country || loc.country || loc.communityName || loc.level1 || '';

    return [
      d._id,
      d.name || '',
      d.category || '',
      d.price || '',
      d.status || 'legacy',
      city,
      region,
      country,
      d.userName || '',
      d.sellerEmail || '',
      d.createdAt || '',
      d.views || 0,
      d.rating || 0,
      d.verified ? 'Sí' : 'No',
      d.premium  ? 'Sí' : 'No',
    ].map(csvEscape).join(',');
  });

  const header = [
    'ID', 'Título', 'Categoría', 'Precio', 'Estado',
    'Ciudad', 'Provincia/Región', 'País',
    'Vendedor', 'Email', 'Fecha Publicación',
    'Vistas', 'Rating', 'Verificado', 'Premium'
  ].join(',');

  const csv = [header, ...rows].join('\n');

  const outPath = path.join(__dirname, 'anuncios_por_ciudad.csv');
  fs.writeFileSync(outPath, '\uFEFF' + csv, 'utf8'); // BOM para Excel en español

  console.log(`✅ CSV generado: ${outPath}`);
  console.log(`   ${products.length} anuncios exportados.`);
}

main().catch(console.error);
