import { useState, useEffect } from 'react'

export function useNotificationPrompt(user) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return

    // No mostrar si ya lo descartó hace menos de 7 días
    const dismissedAt = localStorage.getItem('notif_dismissed_at')
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return
    }

    // Mostrar después de 3 segundos de estar logueado para no ser intrusivo al entrar
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [user])

  return {
    showModal,
    closeModal: () => setShowModal(false)
  }
}
