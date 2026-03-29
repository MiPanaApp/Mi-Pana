const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.updateBadges = onSchedule(
  { schedule: "every 24 hours", region: "us-central1" },
  async () => {
    const db = getFirestore();
    const productsSnap = await db.collection("products").get();
    const byCategory = {};
    productsSnap.docs.forEach(doc => {
      const data = doc.data();
      const cat = data.category || "otros";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ id: doc.id, rating: data.rating || 0, searchCount: data.searchCount || 0 });
    });
    const batch = db.batch();
    Object.values(byCategory).forEach(products => {
      const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 20).map(p => p.id);
      const topSearched = [...products].sort((a, b) => b.searchCount - a.searchCount).slice(0, 20).map(p => p.id);
      products.forEach(p => {
        const ref = db.collection("products").doc(p.id);
        batch.update(ref, { isTop: topRated.includes(p.id), isPopular: topSearched.includes(p.id) });
      });
    });
    await batch.commit();
    console.log("✅ Badges actualizados");
  }
);

exports.checkPendingReviews = onSchedule(
  { schedule: "every 15 minutes", region: "us-central1" },
  async () => {
    const db = getFirestore();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Buscar interacciones de hace más de una hora que aún no se pueden valorar
    const snap = await db.collection("interactions")
      .where("canReview", "==", false)
      .where("contactedAt", "<=", oneHourAgo)
      .limit(500)
      .get();

    if (snap.empty) {
      console.log("✅ No hay interacciones nuevas para habilitar reseñas.");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.update(doc.ref, { canReview: true });
    });

    await batch.commit();
    console.log(`✅ ${snap.size} interacciones habilitadas para reseña.`);
  }
);
