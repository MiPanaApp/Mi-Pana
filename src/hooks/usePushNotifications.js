import { useState, useEffect } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default'
  )
  const [fcmToken, setFcmToken] = useState(null)
  const [foregroundMessage, setForegroundMessage] = useState(null)

  // Solicitar permiso y obtener token
  const requestPermission = async () => {
    try {
      // Solo pedir en contexto seguro (HTTPS o localhost)
      if (!('Notification' in window)) return null
      if (!('serviceWorker' in navigator)) return null

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return null

      const messaging = getMessaging()
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
      })

      if (token && auth.currentUser) {
        // Guardar token en Firestore del usuario
        // Array para soportar múltiples dispositivos
        await setDoc(
          doc(db, 'users', auth.currentUser.uid),
          {
            fcmTokens: arrayUnion(token),
            fcmTokenUpdatedAt: serverTimestamp(),
            notificationsEnabled: true
          },
          { merge: true }
        )
        setFcmToken(token)
      }
      return token
    } catch (error) {
      console.error('Error FCM:', error)
      return null
    }
  }

  // Escuchar notificaciones con la app en PRIMER PLANO
  useEffect(() => {
    if (permission !== 'granted') return

    try {
      const messaging = getMessaging()
      const unsubscribe = onMessage(messaging, (payload) => {
        setForegroundMessage(payload)
        // Aquí se mostrará el Toast personalizado
        // El Toast consume foregroundMessage desde el contexto
      })
      return () => unsubscribe()
    } catch (e) {
      // FCM no disponible en este contexto
    }
  }, [permission])

  return {
    permission,
    fcmToken,
    foregroundMessage,
    requestPermission,
    isSupported: 'Notification' in window
  }
}
