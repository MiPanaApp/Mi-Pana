const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const ALGOLIA_APP_ID = defineSecret("ALGOLIA_APP_ID");
const ALGOLIA_ADMIN_KEY = defineSecret("ALGOLIA_ADMIN_KEY");
const INDEX_NAME = "mipana_products";

// Lazy-load algoliasearch to avoid deployment timeout
let _client = null;
function getClient() {
  if (!_client) {
    const { algoliasearch } = require("algoliasearch");
    _client = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_ADMIN_KEY.value());
  }
  return _client;
}

exports.onProductCreated = onDocumentCreated(
  { document: "products/{productId}", secrets: [ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY] },
  async (event) => {
    const client = getClient();
    const product = event.data.data();
    const productId = event.params.productId;
    await client.saveObject({
      indexName: INDEX_NAME,
      body: {
        objectID: productId,
        name: product.name || "",
        description: product.description || "",
        shortDesc: product.shortDesc || "",
        price: product.price || 0,
        category: product.category || "",
        subcategory: product.subcategory || "",
        country: product.country || product.location?.country || "",
        region: product.region || product.location?.level1 || "",
        city: product.city || product.location?.level2 || "",
        keywords: product.keywords || [],
        image: product.image || "",
        userName: product.userName || "",
        verified: product.verified || false,
        premium: product.premium || false,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        active: product.active ?? true,
        createdAt: product.createdAt?.toMillis?.() || Date.now(),
      }
    });
    console.log("✅ Indexado en Algolia:", productId);
  }
);

exports.onProductUpdated = onDocumentUpdated(
  { document: "products/{productId}", secrets: [ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY] },
  async (event) => {
    const client = getClient();
    const product = event.data.after.data();
    const productId = event.params.productId;
    if (product.active === false) {
      await client.deleteObject({ indexName: INDEX_NAME, objectID: productId });
      console.log("🗑️ Eliminado de Algolia (inactivo):", productId);
      return;
    }
    await client.partialUpdateObject({
      indexName: INDEX_NAME,
      objectID: productId,
      attributesToUpdate: {
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        category: product.category || "",
        country: product.country || product.location?.country || "",
        region: product.region || product.location?.level1 || "",
        verified: product.verified || false,
        premium: product.premium || false,
        rating: product.rating || 0,
        active: product.active ?? true,
      }
    });
    console.log("🔄 Actualizado en Algolia:", productId);
  }
);

exports.onProductDeleted = onDocumentDeleted(
  { document: "products/{productId}", secrets: [ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY] },
  async (event) => {
    const client = getClient();
    await client.deleteObject({ indexName: INDEX_NAME, objectID: event.params.productId });
    console.log("🗑️ Eliminado de Algolia:", event.params.productId);
  }
);
