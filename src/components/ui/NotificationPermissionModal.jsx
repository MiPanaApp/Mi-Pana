import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useEffect } from 'react'
import { playPopSound } from '../../utils/audio'
import { Capacitor } from '@capacitor/core'

export default function NotificationPermissionModal({
  isOpen, onClose
}) {
  const { requestPermission, isSupported } = usePushNotifications()

  useEffect(() => {
    if (isOpen && isSupported) {
      playPopSound()
    }
  }, [isOpen, isSupported])

  if (!isSupported) return null
  if (Capacitor.isNativePlatform()) return null

  const markDecided = () => {
    localStorage.setItem('mipana_notifications_decided', 'true')
    window.dispatchEvent(new Event('notificationDecided'))
  }

  const handleActivate = async () => {
    console.log('[DEBUG] Botón "Activar" clickeado en el Modal');
    await requestPermission()
    markDecided()
    onClose()
  }

  const handleDismiss = () => {
    // Guardar en localStorage para no volver a mostrar
    // por 7 días si el usuario dice "Ahora no"
    localStorage.setItem(
      'notif_dismissed_at',
      Date.now().toString()
    )
    markDecided()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A3A]/50 backdrop-blur-sm z-[9998]"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90vw] max-w-[360px] bg-[#E8E8F0] rounded-[2rem] p-8 shadow-[20px_20px_60px_rgba(0,0,0,0.15)] flex flex-col items-center"
          >
            {/* Botón cerrar opcional si prefieres mantenerlo, el UI description no lo pide pero es buena práctica no tener bloqueantes. */}
            
            {/* Icono central */}
            <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#FFB400] to-[#FF9000] flex items-center justify-center mb-5 shadow-[5px_5px_14px_rgba(200,120,0,0.35),-3px_-3px_8px_rgba(255,220,100,0.4)] shrink-0">
              <Bell size={28} className="text-white" strokeWidth={2.5} />
            </div>

            {/* Título */}
            <h2 className="text-xl font-black text-[#1A1A3A] text-center leading-tight mb-2">
              ¿Activar notificaciones?
            </h2>

            <p className="text-sm text-[#1A1A3A]/60 text-center mb-8">
              Entérate al instante de mensajes y novedades.
            </p>

            {/* Botón principal */}
            <button
              onClick={handleActivate}
              className="w-full h-14 rounded-2xl bg-[#1A1A3A] text-white font-black text-base shadow-[5px_5px_14px_rgba(20,20,60,0.35),-2px_-2px_8px_rgba(80,80,160,0.15)] active:scale-95 transition-transform mb-3 flex items-center justify-center"
            >
              Sí, activar 🔔
            </button>

            {/* Ahora no */}
            <button
              onClick={handleDismiss}
              className="w-full text-sm font-bold text-[#1A1A3A]/40 hover:text-[#1A1A3A]/70 transition-colors"
            >
              Ahora no
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
