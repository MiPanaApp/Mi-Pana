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

  // Registrar token automáticamente si ya hay permiso (solo una vez por sesión o cambio de usuario)
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && auth.currentUser) {
      requestPermission()
    }
  }, [auth.currentUser])

  const requestPermission = async () => {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return null

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return null

      // Registrar el SW y esperar a que esté ACTIVO antes de solicitar token
      // Esto evita AbortError: "Subscription failed - no active Service Worker"
      await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const registration = await navigator.serviceWorker.ready

      const messaging = getMessaging()
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      })

      // Solo guardar si el token es nuevo o diferente al actual en estado
      if (token && auth.currentUser && token !== fcmToken) {
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
      console.error('[PushNotifications] Error:', error)
      return null
    }
  }

  // Escuchar notificaciones en PRIMER PLANO
  useEffect(() => {
    if (permission !== 'granted') return

    try {
      const messaging = getMessaging()
      const unsubscribe = onMessage(messaging, (payload) => {
        setForegroundMessage(payload)
        
        // Mostrar notificación nativa si la app está abierta
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Mi Pana', {
            body: payload.notification?.body || '',
            icon: '/icons/icon-192.png'
          })
        }
      })
      return () => unsubscribe()
    } catch (e) {
      // Ignorar errores de contexto
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
