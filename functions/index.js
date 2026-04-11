const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const { emailTemplate, lucideIcon, bodyText } = require("./emailTemplates");

// --- 1. FUNCIÓN DE CONTACTO ---
exports.sendContactEmail = onRequest({
  cors: true,
  maxInstances: 10,
  region: "us-central1",
  secrets: [RESEND_API_KEY]
}, async (req, res) => {
  // CARGA INTERNA / LAZY LOADING RESEND
  const { Resend } = require("resend");
  const resend = new Resend(RESEND_API_KEY.value());

  if (req.method !== 'POST') return res.status(405).send('Solo POST');

  const { fullName, email, phone, subject, message } = req.body;

  try {
    const result = await resend.emails.send({
      from: "Mi Pana <onboarding@resend.dev>",
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
    console.log("✅ sendContactEmail enviado:", JSON.stringify(result));
    return res.status(200).send({ success: true });
  } catch (error) {
    console.error("❌ sendContactEmail error:", error.message, error);
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
      }).catch(() => { }) // No fallar si hay error de tokens
    }

    console.log("✅ Reseñas habilitadas");
  }
);

// --- 4. FUNCIÓN 1: Notificar nuevo mensaje en chat ---
exports.onNewMessage = onDocumentCreated(
  { document: "conversations/{convId}/messages/{msgId}" },
  async (event) => {
    const message = event.data.data()
    const convId = event.params.convId

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

// ════════════════════════════════════════════════
// EMAIL 1 — Bienvenida (automático al crear usuario)
// ════════════════════════════════════════════════

exports.sendWelcomeEmail = onDocumentCreated(
  { 
    document: "users/{userId}", // Especificamos la ruta para mayor claridad si es necesario
    secrets: [RESEND_API_KEY] 
  },
  async (event) => {
    const userData = event.data.data()
    const email = userData?.email
    const displayName = userData?.name || userData?.displayName || "pana"
    if (!email) return

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const content = bodyText(
      `¡Bienvenido a Mi Pana! ${lucideIcon('party-popper', '#FFB400', 24)}`,
      [
        `<strong>${displayName}</strong>, ya eres parte de la comunidad venezolana más grande en el exterior. ¡Nos alegra un montón tenerte con nosotros!`,
        `Con Mi Pana puedes publicar y encontrar productos y servicios, chatear directamente con otros panas, y construir tu reputación en la comunidad con valoraciones reales.`,
        `Tu cuenta está lista. ¡Empieza a explorar y a conectar con tu comunidad, pana!`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: "¡Bienvenido a Mi Pana, pana!",
        html: emailTemplate({
          title: "Bienvenida",
          preheader: "Ya eres parte de la comunidad venezolana más grande en el exterior",
          content,
          ctaText: `Explorar Mi Pana ${lucideIcon('rocket', '#1A1A3A', 16)}`,
          ctaUrl: "https://app-mi-pana.vercel.app/home"
        })
      })
      console.log(`✅ sendWelcomeEmail enviado exitosamente a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendWelcomeEmail error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
  }
)

// ════════════════════════════════════════════════
// EMAIL 2 — Código de verificación 6 dígitos
// ════════════════════════════════════════════════

exports.sendVerificationCode = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "No autenticado")

    const { email, userName } = request.data
    if (!email) throw new HttpsError("invalid-argument", "Email requerido")

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await db.collection("verificationCodes").doc(request.auth.uid).set({
      code,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      verified: false
    })

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const content = bodyText(
      `Verifica tu email ${lucideIcon('lock', '#FFB400', 22)}`,
      [
        `Hola <strong>${userName || "pana"}</strong>, usa este código para verificar tu cuenta en Mi Pana:`,
        `<span style="display:inline-block;background:#1A1A3A;color:#FFB400;font-size:42px;font-weight:900;letter-spacing:10px;padding:20px 32px;border-radius:16px;margin:8px 0">${code}</span>`,
        `<span style="font-size:13px;color:#999">${lucideIcon('clock', '#999', 14)} Este código expira en 15 minutos.<br/>Si no solicitaste este código, ignora este correo.</span>`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: `${code} — Tu código de verificación Mi Pana`,
        html: emailTemplate({
          title: "Verificación de email",
          preheader: `Tu código de verificación es ${code}`,
          content,
          ctaText: null,
          ctaUrl: null
        })
      })
      console.log(`✅ sendVerificationCode — Código ${code} enviado a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendVerificationCode error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
    return { success: true }
  }
)

// ════════════════════════════════════════════════
// EMAIL 3 — Verificar código ingresado
// ════════════════════════════════════════════════

exports.verifyEmailCode = onCall(
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "No autenticado")

    const { code } = request.data
    if (!code) throw new HttpsError("invalid-argument", "Código requerido")

    const docRef = db.collection("verificationCodes").doc(request.auth.uid)
    const snap = await docRef.get()

    if (!snap.exists) throw new HttpsError("not-found", "Código no encontrado. Solicita uno nuevo.")

    const data = snap.data()

    if (new Date() > data.expiresAt.toDate()) {
      throw new HttpsError("deadline-exceeded", "El código ha expirado. Solicita uno nuevo.")
    }

    if (data.code !== code) {
      throw new HttpsError("invalid-argument", "Código incorrecto. Inténtalo de nuevo.")
    }

    await docRef.update({ verified: true })
    await db.collection("users").doc(request.auth.uid).set({ emailVerified: true }, { merge: true })

    return { success: true, message: "¡Email verificado correctamente!" }
  }
)

// ════════════════════════════════════════════════
// EMAIL 4 — Recuperación de contraseña
// ════════════════════════════════════════════════

exports.sendPasswordResetEmail = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    const { email } = request.data
    if (!email) throw new HttpsError("invalid-argument", "Email requerido")

    const { getAuth } = require("firebase-admin/auth")
    const resetLink = await getAuth().generatePasswordResetLink(email)

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const content = bodyText(
      `Recupera tu contraseña ${lucideIcon('key', '#FFB400', 22)}`,
      [
        `Recibimos una solicitud para restablecer la contraseña de tu cuenta en Mi Pana.`,
        `Si fuiste tú, haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>24 horas</strong>.`,
        `<span style="font-size:13px;color:#999">Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá siendo la misma.</span>`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: "Restablece tu contraseña en Mi Pana",
        html: emailTemplate({
          title: "Recuperar contraseña",
          preheader: "Solicitud de restablecimiento de contraseña",
          content,
          ctaText: `Restablecer contraseña ${lucideIcon('key', '#1A1A3A', 16)}`,
          ctaUrl: resetLink
        })
      })
      console.log(`✅ sendPasswordResetEmail enviado a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendPasswordResetEmail error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
    return { success: true }
  }
)

// ════════════════════════════════════════════════
// EMAIL 5 — Anuncio creado con éxito
// ════════════════════════════════════════════════

exports.sendProductCreatedEmail = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "No autenticado")

    const { email, userName, productName, productId, productPrice } = request.data

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const content = bodyText(
      `¡Mi panita, tu anuncio ya está activo! ${lucideIcon('party-popper', '#FFB400', 24)}`,
      [
        `<strong>${userName || "Pana"}</strong>, tu anuncio ha sido publicado exitosamente en Mi Pana y ya está visible para toda la comunidad.`,
        `<span style="display:inline-block;background:#F5F5F8;border-radius:10px;padding:12px 24px;margin:8px 0;font-weight:700;color:#1A1A3A;font-size:17px">${lucideIcon('package', '#1A1A3A', 20)} ${productName} &nbsp;·&nbsp; ${lucideIcon('banknote', '#1A1A3A', 20)} ${productPrice}€</span>`,
        `Recuerda responder rápido los mensajes. ¡Los panas que responden rápido consiguen más clientes!`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: `Tu anuncio "${productName}" ya está activo`,
        html: emailTemplate({
          title: "Anuncio publicado",
          preheader: `Tu anuncio ${productName} ya está visible en Mi Pana`,
          content,
          ctaText: `Ver mi anuncio ${lucideIcon('eye', '#1A1A3A', 16)}`,
          ctaUrl: `https://app-mi-pana.vercel.app/perfil-producto?id=${productId}`
        })
      })
      console.log(`✅ sendProductCreatedEmail enviado a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendProductCreatedEmail error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
    return { success: true }
  }
)

// ════════════════════════════════════════════════
// EMAIL 6 — Mensajes sin leer (schedule c/4h)
// ════════════════════════════════════════════════

exports.sendUnreadMessagesEmail = onSchedule(
  { schedule: "every 4 hours", region: "us-central1", secrets: [RESEND_API_KEY] },
  async () => {
    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const twoHoursAgo = new Date(Date.now() - 2 * 3600000)

    const convsSnap = await db.collection("conversations")
      .where("hasUnread", "==", true)
      .where("lastMessageAt", "<=", twoHoursAgo)
      .limit(100).get()

    if (convsSnap.empty) return

    for (const convDoc of convsSnap.docs) {
      const conv = convDoc.data()

      const lastEmailSent = conv.lastUnreadEmailSentAt
      if (lastEmailSent) {
        const hoursSince = (Date.now() - lastEmailSent.toDate().getTime()) / 3600000
        if (hoursSince < 24) continue
      }

      const recipientId = conv.unreadFor
      if (!recipientId) continue

      const userSnap = await db.collection("users").doc(recipientId).get()
      if (!userSnap.exists) continue

      const user = userSnap.data()
      if (!user.email) continue

      const content = bodyText(
        `Tienes mensajes sin leer ${lucideIcon('message-square', '#FFB400', 22)}`,
        [
          `¡Ey, <strong>${user.name || "pana"}</strong>! Tienes mensajes nuevos esperándote en Mi Pana.`,
          `<span style="display:inline-block;background:#F5F5F8;border-radius:10px;padding:12px 24px;font-weight:700;color:#1A1A3A">${lucideIcon('bell', '#FFB400', 18)} ${conv.unreadCount || "Varios"} mensaje(s) sin leer sobre:<br/><span style="color:#FFB400">${conv.productName || "un anuncio"}</span></span>`,
          `No dejes esperando a tu pana, ¡una respuesta rápida hace la diferencia!`
        ]
      )

      try {
        const result = await resend.emails.send({
          from: "Mi Pana <onboarding@resend.dev>",
          to: user.email,
          subject: `Tienes mensajes sin leer en Mi Pana`,
          html: emailTemplate({
            title: "Mensajes sin leer",
            preheader: "Tienes mensajes nuevos en Mi Pana",
            content,
            ctaText: `Leer mensajes ${lucideIcon('message-square', '#1A1A3A', 16)}`,
            ctaUrl: "https://app-mi-pana.vercel.app/messages"
          })
        })
        console.log(`✅ sendUnreadMessagesEmail enviado a ${user.email}:`, JSON.stringify(result))
      } catch (emailError) {
        console.error(`❌ sendUnreadMessagesEmail error enviando a ${user.email}:`, emailError.message)
        // Continuar con los siguientes sin fallar toda la función
      }

      await convDoc.ref.update({ lastUnreadEmailSentAt: new Date() })
    }

    console.log("✅ Emails mensajes sin leer procesados")
  }
)

// ════════════════════════════════════════════════
// EMAIL 7 — Suspensión/Eliminación de cuenta
// ════════════════════════════════════════════════

exports.sendAccountSuspendedEmail = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "No autenticado")

    const callerSnap = await db.collection("users").doc(request.auth.uid).get()
    if (callerSnap.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Solo admins")
    }

    const { email, userName, reason, isPermanent } = request.data

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const tipoSuspension = isPermanent ? "eliminada permanentemente" : "suspendida temporalmente"

    const content = bodyText(
      isPermanent ? "Tu cuenta ha sido eliminada" : `Tu cuenta ha sido suspendida ${lucideIcon('alert-triangle', '#D90429', 24)}`,
      [
        `Hola <strong>${userName || "pana"}</strong>, te informamos que tu cuenta en Mi Pana ha sido <strong>${tipoSuspension}</strong> por nuestro equipo de moderación.`,
        `<span style="display:inline-block;background:#FFF0F0;border-radius:10px;padding:12px 24px;font-weight:600;color:#D90429;font-size:14px;border-left:4px solid #D90429">${lucideIcon('clipboard-list', '#D90429', 18)} Motivo: ${reason || "Violación de las normas de la comunidad"}</span>`,
        isPermanent
          ? `Esta decisión es definitiva. Si consideras que es un error, puedes contactarnos respondiendo este correo.`
          : `Si crees que es un error, responde este correo y nuestro equipo lo revisará. Recuerda siempre respetar las normas de nuestra comunidad, pana.`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: isPermanent
          ? "Tu cuenta en Mi Pana ha sido eliminada"
          : "Tu cuenta en Mi Pana ha sido suspendida",
        html: emailTemplate({
          title: isPermanent ? "Cuenta eliminada" : "Cuenta suspendida",
          preheader: `Tu cuenta ha sido ${tipoSuspension}`,
          content,
          ctaText: isPermanent ? null : "Contactar soporte",
          ctaUrl: isPermanent ? null : "mailto:hola@app-mi-pana.vercel.app"
        })
      })
      console.log(`✅ sendAccountSuspendedEmail enviado a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendAccountSuspendedEmail error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
    return { success: true }
  }
)

// ════════════════════════════════════════════════
// EMAIL 8 — Eliminación de anuncio confirmada
// ════════════════════════════════════════════════

exports.sendProductDeletedEmail = onCall(
  { secrets: [RESEND_API_KEY] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "No autenticado")

    const { email, userName, productName } = request.data

    const { Resend } = require("resend")
    const resend = new Resend(RESEND_API_KEY.value())

    const content = bodyText(
      `Anuncio eliminado correctamente ${lucideIcon('trash-2', '#666', 22)}`,
      [
        `Hola <strong>${userName || "pana"}</strong>, te confirmamos que tu anuncio ha sido eliminado exitosamente de Mi Pana.`,
        `<span style="display:inline-block;background:#F5F5F8;border-radius:10px;padding:12px 24px;font-weight:700;color:#1A1A3A;font-size:16px">${lucideIcon('package', '#666', 18)} ${productName}</span>`,
        `Ya no será visible para otros usuarios. Si fue un error, puedes publicarlo nuevamente cuando quieras. ¡Tu espacio en Mi Pana siempre estará disponible, pana!`
      ]
    )

    try {
      const result = await resend.emails.send({
        from: "Mi Pana <onboarding@resend.dev>",
        to: email,
        subject: `Tu anuncio "${productName}" fue eliminado`,
        html: emailTemplate({
          title: "Anuncio eliminado",
          preheader: `Confirmación: ${productName} eliminado de Mi Pana`,
          content,
          ctaText: `Publicar nuevo anuncio ${lucideIcon('pencil', '#1A1A3A', 16)}`,
          ctaUrl: "https://app-mi-pana.vercel.app/crear-anuncio"
        })
      })
      console.log(`✅ sendProductDeletedEmail enviado a ${email}:`, JSON.stringify(result))
    } catch (emailError) {
      console.error(`❌ sendProductDeletedEmail error enviando a ${email}:`, emailError.message, emailError)
      throw emailError
    }
    return { success: true }
  }
)