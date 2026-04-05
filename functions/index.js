const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const { initializeApp } = require("firebase-admin/app");
initializeApp();
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

    // Notificar a los usuarios que pueden valorar
    for (const interactionDoc of snap.docs) {
      const interaction = interactionDoc.data()
      const userSnap = await db
        .collection('users').doc(interaction.buyerId).get()
      const tokens = userSnap.data()?.fcmTokens || []
      if (!tokens.length) continue

      const { getMessaging } = require("firebase-admin/messaging");
      const messaging = getMessaging()
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: '¿Qué tal el pana? 🌟',
          body: `¿Cómo te fue con "${interaction.productName}"? ¡Valóralo ahora!`,
        },
        data: {
          actionUrl: `/perfil-producto?id=${interaction.productId}`,
          type: 'review_reminder'
        }
      }).catch(() => {}) // No fallar si hay error de tokens
    }

    console.log("✅ Reseñas habilitadas");
  }
);

// --- 4. FUNCIÓN 1: Notificar nuevo mensaje en chat ---
exports.onNewMessage = onDocumentCreated(
  { document: "conversations/{convId}/messages/{msgId}" },
  async (event) => {
    const { getFirestore } = require("firebase-admin/firestore");
    const { getApps, initializeApp } = require("firebase-admin/app");
    if (getApps().length === 0) initializeApp();

    const message = event.data.data()
    const convId  = event.params.convId

    // Obtener la conversación para saber el receptor
    const db = getFirestore()
    const convSnap = await db
      .collection('conversations').doc(convId).get()
    if (!convSnap.exists) return

    const conv = convSnap.data()
    const recipientId = conv.participants
      .find(p => p !== message.senderId)
    if (!recipientId) return

    // Obtener tokens del receptor
    const userSnap = await db
      .collection('users').doc(recipientId).get()
    if (!userSnap.exists) return

    const tokens = userSnap.data()?.fcmTokens || []
    if (!tokens.length) return

    const { getMessaging } = require("firebase-admin/messaging");
    const messaging = getMessaging()
    
    // Enviar a todos los dispositivos del usuario
    await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: conv.productName || 'Nuevo mensaje',
        body: message.text?.substring(0, 100) || '📎 Archivo',
      },
      data: {
        actionUrl: `/chat?id=${convId}`,
        type: 'new_message',
        convId
      },
      android: {
        notification: {
          channelId: 'messages',
          priority: 'high',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 }
        }
      }
    })
  }
)

// --- 5. FUNCIÓN 3: Envío masivo desde Admin ---

exports.sendAdminNotification = onCall(
  { region: "us-central1" },
  async (request) => {
    const { getFirestore } = require("firebase-admin/firestore");
    const { getApps, initializeApp } = require("firebase-admin/app");
    if (getApps().length === 0) initializeApp();

    // Verificar que el caller es admin
    if (!request.auth) throw new HttpsError('unauthenticated', 'No auth')
    
    const callerSnap = await getFirestore()
      .collection('users').doc(request.auth.uid).get()
    if (callerSnap.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Solo admins')
    }

    const { title, body, actionUrl, targetCountry,
            targetCategory } = request.data

    // Construir query según filtros
    let query = getFirestore().collection('users')
      .where('notificationsEnabled', '==', true)

    if (targetCountry) {
      query = query.where('country', '==', targetCountry)
    }

    const usersSnap = await query.limit(500).get()
    
    // Recolectar todos los tokens y detalles de receptores
    const allTokens = []
    const recipients = []
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data()
      const tokens = data.fcmTokens || []
      if (tokens.length > 0) {
        allTokens.push(...tokens)
        recipients.push({
          uid: doc.id,
          name: `${data.name || ''} ${data.lastName || ''}`.trim() || 'Sin nombre',
          email: data.email || 'Sin email'
        })
      }
    })

    if (!allTokens.length) return { sent: 0 }

    // Enviar en lotes de 500 (límite de FCM)
    const { getMessaging } = require("firebase-admin/messaging");
    const messaging = getMessaging()
    const batches = []
    for (let i = 0; i < allTokens.length; i += 500) {
      batches.push(allTokens.slice(i, i + 500))
    }

    let totalSent = 0
    for (const batch of batches) {
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: { actionUrl: actionUrl || '/home', type: 'admin' }
      })
      totalSent += result.successCount
    }

    // Guardar registro en Firestore con detalle de receptores
    await getFirestore().collection('adminNotifications').add({
      title, body, actionUrl,
      targetCountry: targetCountry || 'all',
      targetCategory: targetCategory || 'all',
      sentTo: totalSent,
      sentAt: new Date(),
      sentBy: request.auth.uid,
      recipients: recipients // Lista de usuarios que recibieron (o al menos se intentó)
    })

    return { sent: totalSent }

    return { sent: totalSent }
  }
)

// --- 6. FUNCIÓN PROGRAMADA: checkScheduledNotifications ---
exports.checkScheduledNotifications = onSchedule(
  { schedule: "every 60 minutes", region: "us-central1" },
  async () => {
    const { getFirestore } = require("firebase-admin/firestore");
    const { getApps, initializeApp } = require("firebase-admin/app");
    if (getApps().length === 0) initializeApp();

    const db = getFirestore()
    const { getMessaging } = require("firebase-admin/messaging");
    const messaging = getMessaging()

    // Cargar plantillas activas
    const templatesSnap = await db
      .collection('notificationTemplates')
      .where('active', '==', true)
      .get()

    if (templatesSnap.empty) return

    for (const templateDoc of templatesSnap.docs) {
      const template = templateDoc.data()
      const templateId = templateDoc.id

      try {
        switch (template.trigger) {

          case 'product_inactive': {
            // Productos sin views en X días
            const daysAgo = new Date(
              Date.now() - template.delayHours * 3600000
            )
            const productsSnap = await db
              .collection('products')
              .where('active', '==', true)
              .where('updatedAt', '<=', daysAgo)
              .limit(100)
              .get()

            for (const productDoc of productsSnap.docs) {
              const product = productDoc.data()
              const userId = product.userId || product.sellerId
              if (!userId) continue

              // Verificar que no se haya enviado antes
              const alreadySent = await db
                .collection('notificationsSent')
                .where('templateId', '==', templateId)
                .where('userId', '==', userId)
                .where('productId', '==', productDoc.id)
                .limit(1).get()

              if (!alreadySent.empty) continue

              // Obtener tokens del vendedor
              const userSnap = await db
                .collection('users').doc(userId).get()
              const tokens = userSnap.data()?.fcmTokens || []
              if (!tokens.length) continue

              // Personalizar mensaje
              const title = template.title
              const body = template.body
                .replace('{{productName}}', product.name || 'tu anuncio')
                .replace('{{days}}',
                  Math.floor(template.delayHours / 24))

              await messaging.sendEachForMulticast({
                tokens,
                notification: { title, body },
                data: {
                  actionUrl: `/perfil-producto?id=${productDoc.id}`,
                  type: template.trigger
                }
              })

              // Registrar envío para no repetir
              await db.collection('notificationsSent').add({
                templateId,
                userId,
                productId: productDoc.id,
                sentAt: new Date()
              })
            }
            break
          }

          case 'user_inactive': {
            // Usuarios sin actividad en X días
            const daysAgo = new Date(
              Date.now() - template.delayHours * 3600000
            )
            let usersQuery = db.collection('users')
              .where('lastSeenAt', '<=', daysAgo)
              .where('notificationsEnabled', '==', true)
              .limit(200)

            if (template.targetCountry !== 'all') {
              usersQuery = usersQuery
                .where('country', '==', template.targetCountry)
            }

            const usersSnap = await usersQuery.get()

            for (const userDoc of usersSnap.docs) {
              const user = userDoc.data()
              const tokens = user.fcmTokens || []
              if (!tokens.length) continue

              // Verificar no enviada en los últimos 7 días
              const recentSent = await db
                .collection('notificationsSent')
                .where('templateId', '==', templateId)
                .where('userId', '==', userDoc.id)
                .limit(1).get()

              if (!recentSent.empty) continue

              await messaging.sendEachForMulticast({
                tokens,
                notification: {
                  title: template.title,
                  body: template.body
                    .replace('{{userName}}',
                      user.name || 'pana')
                },
                data: {
                  actionUrl: '/home',
                  type: template.trigger
                }
              })

              await db.collection('notificationsSent').add({
                templateId,
                userId: userDoc.id,
                sentAt: new Date()
              })
            }
            break
          }

          case 'product_expiring': {
            // Anuncios publicados hace (delayHours - 72h) horas
            const publishedBefore = new Date(
              Date.now() - (template.delayHours - 72) * 3600000
            )
            const publishedAfter = new Date(
              Date.now() - template.delayHours * 3600000
            )

            const productsSnap = await db
              .collection('products')
              .where('active', '==', true)
              .where('createdAt', '<=', publishedBefore)
              .where('createdAt', '>=', publishedAfter)
              .limit(100).get()

            for (const productDoc of productsSnap.docs) {
              const product = productDoc.data()
              const userId = product.userId || product.sellerId
              if (!userId) continue

              const alreadySent = await db
                .collection('notificationsSent')
                .where('templateId', '==', templateId)
                .where('productId', '==', productDoc.id)
                .limit(1).get()

              if (!alreadySent.empty) continue

              const userSnap = await db
                .collection('users').doc(userId).get()
              const tokens = userSnap.data()?.fcmTokens || []
              if (!tokens.length) continue

              await messaging.sendEachForMulticast({
                tokens,
                notification: {
                  title: template.title,
                  body: template.body
                    .replace('{{productName}}',
                      product.name || 'tu anuncio')
                },
                data: {
                  actionUrl: `/perfil-producto?id=${productDoc.id}`,
                  type: template.trigger
                }
              })

              await db.collection('notificationsSent').add({
                templateId,
                userId,
                productId: productDoc.id,
                sentAt: new Date()
              })
            }
            break
          }

          case 'incomplete_profile': {
            // Usuarios registrados hace X horas sin completar perfil
            const hoursAgo = new Date(
              Date.now() - template.delayHours * 3600000
            )
            const usersSnap = await db
              .collection('users')
              .where('createdAt', '<=', hoursAgo)
              .where('profileComplete', '==', false)
              .where('notificationsEnabled', '==', true)
              .limit(200).get()

            for (const userDoc of usersSnap.docs) {
              const user = userDoc.data()
              const tokens = user.fcmTokens || []
              if (!tokens.length) continue

              const alreadySent = await db
                .collection('notificationsSent')
                .where('templateId', '==', templateId)
                .where('userId', '==', userDoc.id)
                .limit(1).get()

              if (!alreadySent.empty) continue

              await messaging.sendEachForMulticast({
                tokens,
                notification: {
                  title: template.title,
                  body: template.body
                },
                data: {
                  actionUrl: '/profile/edit',
                  type: template.trigger
                }
              })

              await db.collection('notificationsSent').add({
                templateId,
                userId: userDoc.id,
                sentAt: new Date()
              })
            }
            break
          }

        } // end switch

      } catch (err) {
        console.error(`Error en template ${templateId}:`, err)
        // Continúa con la siguiente plantilla
        continue
      }
    }

    console.log('✅ checkScheduledNotifications completado')
  }
)