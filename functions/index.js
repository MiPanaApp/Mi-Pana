const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");

/**
 * NOTA DE ARQUITECTURA: 
 * No importamos firebase-admin ni resend aquí arriba para evitar el Timeout de 10s en el despliegue.
 * Todo se cargará "Bajo Demanda" dentro de cada export.
 */

// --- 1. FUNCIÓN DE CONTACTO ---
exports.sendContactEmail = onRequest({
  cors: true,
  maxInstances: 10,
  region: "us-central1"
}, async (req, res) => {
  // CARGA INTERNA / LAZY LOADING
  const { initializeApp, getApps } = require("firebase-admin/app");
  const { Resend } = require("resend");

  // Inicialización segura
  if (getApps().length === 0) initializeApp();
  const resend = new Resend("re_Bnt9kkB4_BSed6n9dz9Z4H3sHZA9WLdfi");

  if (req.method !== 'POST') return res.status(405).send('Solo POST');

  const { fullName, email, phone, subject, message } = req.body;

  try {
    await resend.emails.send({
      from: "Mi Pana App <onboarding@resend.dev>",
      to: "radarcriollo@gmail.com",
      reply_to: email,
      subject: `[Mi Pana App] Nuevo mensaje de: ${fullName}`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #1A1A3A; border: 1px solid #EDEDF5; border-radius: 24px; max-width: 600px; margin: auto; background-color: #ffffff;">
          <h2 style="color: #0056B3;">📩 Nuevo contacto desde Mi Pana</h2>
          <p><strong>👤 Pana:</strong> ${fullName}</p>
          <p><strong>✉️ Email:</strong> ${email}</p>
          <p><strong>📌 Asunto:</strong> ${subject}</p>
          <div style="background-color: #F8F9FB; padding: 20px; border-radius: 16px;">
            <p>${message}</p>
          </div>
        </div>
      `
    });
    return res.status(200).send({ success: true });
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
});

// --- 2. TAREAS PROGRAMADAS (BADGES) ---
exports.updateBadges = onSchedule(
  { schedule: "every 24 hours", region: "us-central1" },
  async (event) => {
    const { initializeApp, getApps } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    if (getApps().length === 0) initializeApp();
    const db = getFirestore();

    const productsSnap = await db.collection("products").get();
    if (productsSnap.empty) return;

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

// --- 3. TAREAS PROGRAMADAS (REVIEWS) ---
exports.checkPendingReviews = onSchedule(
  { schedule: "every 15 minutes", region: "us-central1" },
  async (event) => {
    const { initializeApp, getApps } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    if (getApps().length === 0) initializeApp();
    const db = getFirestore();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const snap = await db.collection("interactions")
      .where("canReview", "==", false)
      .where("contactedAt", "<=", oneHourAgo)
      .limit(500).get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { canReview: true }));
    await batch.commit();
    console.log("✅ Reseñas habilitadas");
  }
);