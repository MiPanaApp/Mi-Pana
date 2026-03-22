const admin = require("firebase-admin");
const { algoliasearch } = require("algoliasearch");

// Pega aquí tus valores directamente para este script puntual
const ALGOLIA_APP_ID    = "KTRSOVHPKJ";
const ALGOLIA_ADMIN_KEY = "ec610e8a0ef2672ebb50c707a6fc54ef";
const INDEX_NAME        = "mipana_products";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "app-mi-pana"
});

async function migrate() {
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
  const db     = admin.firestore();
  console.log("Obteniendo productos de Firestore...");
  const snap   = await db.collection("products").get();

  if (snap.empty) {
    console.log("No hay productos en Firestore.");
    return;
  }

  const objects = snap.docs.map(doc => ({
    objectID:    doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
  }));

  console.log(`Subiendo ${objects.length} productos a Algolia...`);
  await client.saveObjects({ indexName: INDEX_NAME, objects });
  console.log(`✅ ${objects.length} productos indexados en Algolia`);
}

migrate().catch(console.error);
