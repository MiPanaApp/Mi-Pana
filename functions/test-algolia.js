require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');

// Note: Ensure FIREBASE_API_KEY etc. or use explicit credentials.
// For testing Algolia locally, just mock a document.
const algoliasearch = require('algoliasearch');
const client = algoliasearch(process.env.VITE_ALGOLIA_APP_ID, 'ec610e8a0ef2672ebb50c707a6fc54ef'); // Using the Admin Key user provided in chat
const index = client.initIndex(process.env.VITE_ALGOLIA_INDEX_NAME);

async function testAlgolia() {
  console.log("Saving to Algolia...");
  try {
    await index.saveObject({
      objectID: "test-document-123456",
      name: "Bicicleta de Montaña (Prueba de Fuerza)",
      description: "Esto es una prueba directa desde la terminal local para evitar Firebase Eventarc",
      price: 150,
      category: "Deportes",
      active: true,
      verified: true
    });
    console.log("¡Éxito! Documento de prueba subido directamente a Algolia.");
  } catch (err) {
    console.error("Error en Algolia:", err.message || err);
  }
}

testAlgolia();
