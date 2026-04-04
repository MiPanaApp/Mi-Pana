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

// ─── Enviar valoración (Actualizado con Distribución de Estrellas) ──────────
export async function submitReview({ interactionId, buyerId, buyerName, sellerId, productId, productName, rating, comment }) {
  
  // 1. Validaciones y extracción de datos seguros
  let safeSellerId = sellerId;
  let safeProductId = productId;
  let safeProductName = productName;

  if (interactionId) {
    try {
      const intDoc = await getDoc(doc(db, 'interactions', String(interactionId)));
      if (intDoc.exists()) {
        const dbData = intDoc.data();
        if (!safeSellerId) safeSellerId = dbData.sellerId;
        if (!safeProductId) safeProductId = dbData.productId;
        if (!safeProductName) safeProductName = dbData.productName;
      }
    } catch (e) {
      console.warn('No se pudo reforzar la interacción:', e);
    }
  }

  if (!safeSellerId) throw new Error('Vendedor no identificado');
  if (!safeProductId) throw new Error('Anuncio no identificado');

  // 2. Crear el documento de la reseña
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

  // 3. ACTUALIZACIÓN ATÓMICA: Producto (Rating + Distribución) y Vendedor
  const productRef = doc(db, 'products', String(safeProductId));
  const sellerRef = doc(db, 'users', String(safeSellerId));

  await runTransaction(db, async (tx) => {
    // Lecturas primero (Regla de Firestore Transactions)
    const productSnap = await tx.get(productRef);
    const sellerSnap = await tx.get(sellerRef);

    // -- Actualizar Producto --
    if (productSnap.exists()) {
      const pData = productSnap.data();
      const oldCount = pData.reviewCount || 0;
      const oldRating = pData.rating || 0;
      const newCount = oldCount + 1;
      const newRating = parseFloat(((oldRating * oldCount + rating) / newCount).toFixed(1));
      
      // Manejar distribución de estrellas (1-5)
      const distribution = pData.ratingsDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution[rating] = (distribution[rating] || 0) + 1;

      tx.update(productRef, { 
        rating: newRating, 
        reviewCount: newCount,
        ratingsDistribution: distribution 
      });
    }

    // -- Actualizar Vendedor (Seller Score) --
    if (sellerSnap.exists()) {
      const sData = sellerSnap.data();
      const oldSScore = sData.sellerScore || 0;
      const oldSCount = sData.sellerReviewCount || 0;
      const newSCount = oldSCount + 1;
      const newSScore = parseFloat(((oldSScore * oldSCount + rating) / newSCount).toFixed(1));
      
      tx.update(sellerRef, { 
        sellerScore: newSScore, 
        sellerReviewCount: newSCount 
      });
    }
  });

  // 4. Marcar interacción como revisada
  if (interactionId) {
    await updateDoc(doc(db, 'interactions', String(interactionId)), { reviewed: true });
  }
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
