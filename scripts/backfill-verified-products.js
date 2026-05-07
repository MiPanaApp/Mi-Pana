import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * SCRIPT DE MANTENIMIENTO: Backfill de productos verificados
 * 
 * Este script busca todos los usuarios que ya tienen el flag 'verified: true'
 * y actualiza todos sus productos para que también tengan 'verified: true'.
 * 
 * Uso: 
 * 1. Asegúrate de tener las credenciales en la ruta indicada abajo.
 * 2. Ejecuta: node scripts/backfill-verified-products.js
 */

// Ruta a las credenciales de Firebase Admin SDK
const SERVICE_ACCOUNT_PATH = '/Users/alexguevara/Descargas/app-mi-pana-firebase-adminsdk-fbsvc-6f850ecf5c.json';

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function backfillVerifiedProducts() {
  console.log('🔍 Buscando usuarios verificados...');
  
  const usersSnap = await db.collection('users')
    .where('verified', '==', true)
    .get();

  console.log(`✅ ${usersSnap.size} usuarios verificados encontrados`);

  let totalProducts = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const userName = userData.name || userData.email || userId;

    console.log(`\n📦 Procesando productos de: ${userName}...`);

    const productsSnap = await db.collection('products')
      .where('userId', '==', userId)
      .get();

    if (productsSnap.empty) {
      console.log(`   — Sin productos.`);
      continue;
    }

    const batch = db.batch();
    let count = 0;
    
    productsSnap.forEach(p => {
      if (!p.data().verified) {
        batch.update(p.ref, { verified: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`   ✅ ${count} productos actualizados.`);
      totalProducts += count;
    } else {
      console.log(`   — Todos los productos ya estaban verificados.`);
    }
  }

  console.log(`\n🎉 Finalizado. Se han actualizado ${totalProducts} productos en total.`);
  process.exit(0);
}

backfillVerifiedProducts().catch((err) => {
  console.error('❌ Error ejecutando el script:', err);
  process.exit(1);
});
