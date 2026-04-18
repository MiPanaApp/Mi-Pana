import { useState, useEffect } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined'
      ? Notification.permission
      : 'default'
  )
  const [fcmToken, setFcmToken] = useState(null)
  const [foregroundMessage, setForegroundMessage] = useState(null)

  // Registrar token automáticamente si ya hay permiso concedido (al montar o cambiar usuario)
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && auth.currentUser) {
      requestPermission()
    }
  }, [auth.currentUser?.uid])

  /**
   * Solicita permiso y obtiene el token FCM.
   * @returns {{ status: 'granted'|'denied'|'unsupported'|'error', token: string|null }}
   */
  const requestPermission = async () => {
    console.log('[PushNotifications] Iniciando requestPermission...')

    // 1. Comprobar soporte del navegador
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('[PushNotifications] Navegador no soporta notificaciones o Service Worker.')
      return { status: 'unsupported', token: null }
    }

    // 2. Comprobar si el permiso ya fue denegado explícitamente por el usuario
    if (Notification.permission === 'denied') {
      console.warn('[PushNotifications] El permiso ya está DENEGADO por el navegador. El usuario debe habilitarlo manualmente.')
      setPermission('denied')
      return { status: 'denied', token: null }
    }

    try {
      // 3. Solicitar permiso al navegador (mostrará el diálogo si está en 'default')
      console.log('[PushNotifications] Solicitando permiso al navegador...')
      const perm = await Notification.requestPermission()
      console.log(`[PushNotifications] Respuesta del navegador: "${perm}"`)
      setPermission(perm)

      if (perm !== 'granted') {
        console.warn('[PushNotifications] Permiso NO concedido:', perm)
        return { status: 'denied', token: null }
      }

      // 4. Registrar el Service Worker y esperar a que esté ACTIVO
      console.log('[PushNotifications] Registrando Service Worker...')
      await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const registration = await navigator.serviceWorker.ready
      console.log('[PushNotifications] Service Worker activo:', registration.scope)

      if (!registration || !registration.pushManager) {
        console.warn('[PushNotifications] pushManager no disponible en este navegador.')
        return { status: 'unsupported', token: null }
      }

      // 5. Obtener el token FCM
      console.log('[PushNotifications] Obteniendo token FCM...')
      const messaging = getMessaging()
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      })

      if (!token) {
        console.error('[PushNotifications] No se pudo obtener el token FCM.')
        return { status: 'error', token: null }
      }

      console.log('[PushNotifications] ✅ Token FCM obtenido:', token.substring(0, 20) + '...')

      // 6. Guardar el token en Firestore solo si es nuevo
      if (auth.currentUser && token !== fcmToken) {
        console.log('[PushNotifications] Guardando token en Firestore para uid:', auth.currentUser.uid)
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
        console.log('[PushNotifications] ✅ Token guardado correctamente en Firestore.')
      } else if (!auth.currentUser) {
        console.warn('[PushNotifications] No hay usuario autenticado. Token obtenido pero NO guardado.')
      } else {
        console.log('[PushNotifications] Token ya estaba registrado, no se actualiza.')
      }

      return { status: 'granted', token }

    } catch (error) {
      console.error('[PushNotifications] ❌ Error en requestPermission:', error)
      return { status: 'error', token: null }
    }
  }

  /**
   * Elimina el token FCM actual de Firestore (usar al cerrar sesión).
   */
  const removeToken = async () => {
    if (!auth.currentUser || !fcmToken) {
      console.log('[PushNotifications] removeToken: nada que eliminar.')
      return
    }
    try {
      console.log('[PushNotifications] Eliminando token FCM de Firestore...')
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fcmTokens: arrayRemove(fcmToken)
      })
      setFcmToken(null)
      console.log('[PushNotifications] ✅ Token eliminado correctamente.')
    } catch (err) {
      console.error('[PushNotifications] Error al eliminar token:', err)
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
      // Ignorar errores de contexto (e.g. navegadores sin soporte completo)
    }
  }, [permission])

  return {
    permission,
    fcmToken,
    foregroundMessage,
    requestPermission,
    removeToken,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  }
}
