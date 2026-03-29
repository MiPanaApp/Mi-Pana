import {
  collection, doc, addDoc, updateDoc, getDocs,
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

// ─── Verificar si puede valorar ───────────────────────────────────────────────
export async function canUserReview({ buyerId, productId }) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId),
    where('productId', '==', productId),
    where('canReview', '==', true),
    where('reviewed', '==', false)
  ));
  if (snap.empty) return { can: false, interactionId: null };
  return { can: true, interactionId: snap.docs[0].id };
}

// ─── Enviar valoración ────────────────────────────────────────────────────────
export async function submitReview({ interactionId, buyerId, buyerName, sellerId, productId, productName, rating, comment }) {
  // 1. Crear la review
  await addDoc(collection(db, 'reviews'), {
    interactionId,
    buyerId,
    buyerName,
    sellerId,
    productId,
    productName,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });

  // 2. Actualizar rating del producto con transacción
  const productRef = doc(db, 'products', productId);
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

  // 3. Actualizar score del vendedor con transacción
  const sellerRef = doc(db, 'users', sellerId);
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

  // 4. Marcar interacción como revisada
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

// ─── Obtener interacciones pendientes de valorar ──────────────────────────────
export async function getPendingReviews(buyerId) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId),
    where('canReview', '==', true),
    where('reviewed', '==', false)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserInteractions(buyerId) {
  const snap = await getDocs(query(
    collection(db, 'interactions'),
    where('buyerId', '==', buyerId)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
