import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp,
  runTransaction, limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ─── Registrar interacción (al tocar Chat o WhatsApp) ────────────────────────
export async function registerInteraction({ buyerId, sellerId, productId, productName, via }) {
  if (!buyerId || !sellerId || buyerId === sellerId) return null;

  // Evitar duplicados — una interacción por par comprador/producto
  const existing = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId),
    where('productId', '==', productId)
  ));
  if (!existing.empty) return existing.docs[0].id;

  const ref = await addDoc(collection(db, 'interactions'), {
    buyerId,
    sellerId,
    productId,
    productName,
    via, // 'chat' | 'whatsapp'
    contactedAt: serverTimestamp(),
    canReview: false, // se activa tras 1h por Cloud Function
    reviewed: false,
  });

  return ref.id;
}

// ─── Verificar si puede valorar (Acelerado a 3 minutos para Testing) ───────────
export async function canUserReview({ buyerId, productId }) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId),
    where('productId', '==', productId),
    where('reviewed', '==', false)
  ));
  
  if (snap.empty) return { can: false, interactionId: null };
  
  // Extraemos el tiempo del primer mensaje
  const interaction = snap.docs[0].data();
  const contactTime = interaction.contactedAt?.toMillis 
    ? interaction.contactedAt.toMillis() 
    : Date.now();
    
  // 3 minutos = 180,000 milisegundos
  if (Date.now() - contactTime >= 180000) {
    return { can: true, interactionId: snap.docs[0].id };
  }
  
  return { can: false, interactionId: null };
}

// ─── Enviar valoración ────────────────────────────────────────────────────────
export async function submitReview({ interactionId, buyerId, buyerName, sellerId, productId, productName, rating, comment }) {
  
  // 1. Seguridad: Rescatar datos duros de la interacción si el frontend falla
  let safeSellerId = sellerId;
  let safeProductId = productId;
  let safeProductName = productName;

  if (interactionId) {
    const intDoc = await getDoc(doc(db, 'interactions', interactionId));
    if (intDoc.exists()) {
      const dbData = intDoc.data();
      if (!safeSellerId) safeSellerId = dbData.sellerId;
      if (!safeProductId) safeProductId = dbData.productId;
      if (!safeProductName) safeProductName = dbData.productName;
    }
  }

  if (!safeSellerId) {
    throw new Error('No se pudo identificar al vendedor para asignarle la valoración.');
  }

  if (!safeProductId) {
    throw new Error('No se pudo identificar el anuncio valorado.');
  }

  // 2. Crear la review
  await addDoc(collection(db, 'reviews'), {
    interactionId,
    buyerId,
    buyerName,
    sellerId: safeSellerId,
    productId: safeProductId,
    productName: safeProductName,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  // 3. Actualizar rating del producto con transacción
  const productRef = doc(db, 'products', safeProductId);
  await runTransaction(db, async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists()) return;
    const data = productSnap.data();
    const oldRating = data.rating || 0;
    const oldCount = data.reviewCount || 0;
    const newCount = oldCount + 1;
    const newRating = parseFloat(((oldRating * oldCount + rating) / newCount).toFixed(1));
    tx.update(productRef, { rating: newRating, reviewCount: newCount });
  });

  // 4. Actualizar score del vendedor con transacción
  const sellerRef = doc(db, 'users', safeSellerId);
  await runTransaction(db, async (tx) => {
    const sellerSnap = await tx.get(sellerRef);
    if (!sellerSnap.exists()) return;
    const data = sellerSnap.data();
    const oldRating = data.sellerScore || 0;
    const oldCount = data.sellerReviewCount || 0;
    const newCount = oldCount + 1;
    const newRating = parseFloat(((oldRating * oldCount + rating) / newCount).toFixed(1));
    tx.update(sellerRef, { sellerScore: newRating, sellerReviewCount: newCount });
  });

  // 5. Marcar interacción como revisada
  await updateDoc(doc(db, 'interactions', interactionId), { reviewed: true });
}

// ─── Obtener reviews de un producto ──────────────────────────────────────────
export async function getProductReviews(productId, maxCount = 10) {
  const snap = await getDocs(query(
    collection(db, 'reviews'),
    where('productId', '==', productId)
  ));
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Sort manual por fecha más reciente para evitar el dolor de los Composite Indexes
  results.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  
  return results.slice(0, maxCount);
}

// ─── Obtener interacciones pendientes de valorar (Acelerado a 3 min) ───────────
export async function getPendingReviews(buyerId) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId),
    where('reviewed', '==', false)
  ));
  
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Filtramos localmente los que tengan más de 3 minutos (180000 ms)
  return docs.filter(d => {
    const contactTime = d.contactedAt?.toMillis ? d.contactedAt.toMillis() : Date.now();
    return (Date.now() - contactTime) >= 180000;
  });
}

export async function getUserInteractions(buyerId) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
