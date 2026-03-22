const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { algoliasearch } = require("algoliasearch");

initializeApp();

const ALGOLIA_APP_ID = defineSecret("ALGOLIA_APP_ID");
const ALGOLIA_ADMIN_KEY = defineSecret("ALGOLIA_ADMIN_KEY");
const INDEX_NAME = "mipana_products";

exports.onProductCreated = onDocumentCreated(
  { document: "products/{productId}", secrets: [ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY] },
  async (event) => {
    const client = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_ADMIN_KEY.value());
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
        country: product.country || "",
        region: product.region || "",
        city: product.city || "",
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
    const client = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_ADMIN_KEY.value());
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
        country: product.country || "",
        region: product.region || "",
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
    const client = algoliasearch(ALGOLIA_APP_ID.value(), ALGOLIA_ADMIN_KEY.value());
    await client.deleteObject({ indexName: INDEX_NAME, objectID: event.params.productId });
    console.log("🗑️ Eliminado de Algolia:", event.params.productId);
  }
);
