import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { useLocation } from 'react-router-dom'

export function useNotificationPrompt(user) {
  const [showModal, setShowModal] = useState(false)
  const [decided, setDecided] = useState(() => 
    localStorage.getItem('mipana_notifications_decided') === 'true'
  )
  const location = useLocation()

  useEffect(() => {
    // En nativo o sin soporte: marcar como decidido inmediatamente
    if (Capacitor.isNativePlatform() || !('Notification' in window)) {
      markAsDecided()
      return
    }
    if (!user) return
    if (decided) return
    if (Notification.permission === 'granted') {
      markAsDecided()
      return
    }
    if (Notification.permission === 'denied') {
      markAsDecided()
      return
    }

    // No mostrar si ya lo descartó hace menos de 7 días
    const dismissedAt = localStorage.getItem('notif_dismissed_at')
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / 
        (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        markAsDecided()
        return
      }
    }

    // No mostrar si está en proceso de verificación de email
    if (location.pathname.includes('verificacion') || 
        location.pathname.includes('verify') ||
        location.pathname === '/auth') return

    // No mostrar si está en splash
    if (location.pathname === '/') return

    // Mostrar después de 3 segundos
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [user, decided, location.pathname])

  const markAsDecided = useCallback(() => {
    localStorage.setItem('mipana_notifications_decided', 'true')
    setDecided(true)
    setShowModal(false)
    window.dispatchEvent(new Event('notificationDecided'))
  }, [])

  const closeModal = useCallback((dismissed = false) => {
    if (dismissed) {
      localStorage.setItem('notif_dismissed_at', Date.now().toString())
    }
    markAsDecided()
  }, [markAsDecided])

  return { showModal, closeModal, notifDecided: decided }
}
