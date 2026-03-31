import { db } from '../services/firebase'
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore'

// Registrar una vista — evita contar la misma sesión dos veces
export async function registerView(productId, userId = null) {
  try {
    if (!productId) return;
    
    // Key de sesión para evitar duplicados
    const sessionKey = `viewed_${productId}`
    if (sessionStorage.getItem(sessionKey)) return

    sessionStorage.setItem(sessionKey, '1')

    const ref = doc(db, 'products', String(productId))
    await updateDoc(ref, {
      views: increment(1)
    })
  } catch (error) {
    console.warn('Error registrando vista:', error)
  }
}

export async function incrementLikes(productId) {
  try {
    if (!productId) return;
    const ref = doc(db, 'products', String(productId))
    await updateDoc(ref, { likes: increment(1) })
  } catch (error) {
    console.warn('Error incrementando likes:', error)
  }
}

export async function decrementLikes(productId) {
  try {
    if (!productId) return;
    const ref = doc(db, 'products', String(productId))
    await updateDoc(ref, { likes: increment(-1) })
  } catch (error) {
    console.warn('Error decrementando likes:', error)
  }
}
