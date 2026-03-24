import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  arrayUnion, setDoc, increment, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Crear o recuperar conversación ───────────────────────────────────────────
export async function getOrCreateConversation({ buyerId, sellerId, productId, productName, productCategory, productImage, sellerName, sellerAvatar }) {
  // ID determinista para evitar duplicados
  const ids = [buyerId, sellerId].sort();
  const conversationId = `${ids[0]}_${ids[1]}_${productId}`;
  const ref = doc(db, 'conversations', conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [buyerId, sellerId],
      productId,
      productName,
      productCategory: productCategory || '',
      productImage: productImage || '',
      sellerName,
      sellerAvatar: sellerAvatar || '',
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: { [buyerId]: 0, [sellerId]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return conversationId;
}

// ─── Enviar mensaje ────────────────────────────────────────────────────────────
export async function sendMessage({ conversationId, senderId, text, replyTo = null }) {
  const msgRef = collection(db, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'conversations', conversationId);

  // Obtener el otro participante para incrementar su unread
  const convSnap = await getDoc(convRef);
  const { participants } = convSnap.data();
  const otherId = participants.find(p => p !== senderId);

  await addDoc(msgRef, {
    text,
    senderId,
    timestamp: serverTimestamp(),
    status: 'sent',
    replyTo,
  });

  await updateDoc(convRef, {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    [`unreadCount.${otherId}`]: increment(1),
  });
}

// ─── Marcar mensajes como leídos ──────────────────────────────────────────────
export async function markMessagesAsRead({ conversationId, userId }) {
  const convRef = doc(db, 'conversations', conversationId);
  const msgRef = collection(db, 'conversations', conversationId, 'messages');

  // Reset unread counter
  await updateDoc(convRef, {
    [`unreadCount.${userId}`]: 0,
  });

  // Marcar mensajes no leídos del otro como "read"
  const q = query(msgRef, where('senderId', '!=', userId));
  const snap = await getDocs(q);
  const updates = snap.docs
    .filter(d => d.data().status !== 'read')
    .map(d => updateDoc(d.ref, { status: 'read' }));
  await Promise.all(updates);
}

// ─── Actualizar typing indicator ──────────────────────────────────────────────
export async function setTyping({ conversationId, userId, isTyping }) {
  const ref = doc(db, 'conversations', conversationId);
  await updateDoc(ref, {
    [`typing.${userId}`]: isTyping,
  });
}

// ─── Listener de mensajes en tiempo real ──────────────────────────────────────
export function subscribeToMessages(conversationId, callback) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

// ─── Listener de conversación (typing, status) ────────────────────────────────
export function subscribeToConversation(conversationId, callback) {
  const ref = doc(db, 'conversations', conversationId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ─── Listener de todas las conversaciones del usuario ─────────────────────────
export function subscribeToConversations(userId, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(convs);
  });
}
// ─── Borrar conversación (individual) ──────────────────────────────────────────
export async function deleteConversation(conversationId) {
  const ref = doc(db, 'conversations', conversationId);
  await deleteDoc(ref);
}

// ─── Borrar TODAS las conversaciones de un usuario ────────────────────────────
export async function deleteAllConversations(userId) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}
