import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useEffect } from 'react'
import { playPopSound } from '../../utils/audio'
import { Capacitor } from '@capacitor/core'

export default function NotificationPermissionModal({
  isOpen, onClose
}) {
  const { requestPermission, isSupported } = usePushNotifications()
  const [uiState, setUiState] = useState('idle') // 'idle' | 'loading' | 'denied' | 'granted'

  useEffect(() => {
    if (isOpen && isSupported) {
      playPopSound()
      setUiState('idle')
    }
  }, [isOpen, isSupported])

  if (!isSupported) return null
  if (Capacitor.isNativePlatform()) return null

  const handleActivate = async () => {
    console.log('[DEBUG] Botón "Activar" clickeado en el Modal')
    setUiState('loading')

    const result = await requestPermission()

    if (result.status === 'granted') {
      setUiState('granted')
      // Cerrar el modal tras mostrar confirmación breve pasándole false (no fue descartado)
      setTimeout(() => onClose(false), 1500)
    } else if (result.status === 'denied') {
      setUiState('denied')
      // No cerramos el modal — mostramos instrucciones manuales
    } else {
      // error o unsupported — cerramos
      onClose(false)
    }
  }

  const handleDismiss = () => {
    // Al pasar true indicamos al hook padre que el modal fue descartado (dismiss)
    onClose(true)
  }

  const openBrowserSettings = () => {
    // En Chrome desktop se puede abrir directamente
    // En móvil debemos guiar al usuario
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    if (isChrome) {
      window.open('chrome://settings/content/notifications', '_blank')
    }
    // Si no se puede abrir (mayoría de navegadores bloquean chrome:// como href),
    // el mensaje en pantalla ya explica cómo hacerlo.
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
            onClick={uiState === 'loading' ? undefined : handleDismiss}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="pointer-events-auto w-full max-w-[360px] bg-[#E8E8F0] rounded-[2rem] p-8 shadow-[20px_20px_60px_rgba(0,0,0,0.15)] flex flex-col items-center"
            >
              {/* --- Estado IDLE: pantalla principal --- */}
              {(uiState === 'idle' || uiState === 'loading') && (
                <>
                  <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#FFB400] to-[#FF9000] flex items-center justify-center mb-5 shadow-[5px_5px_14px_rgba(200,120,0,0.35),-3px_-3px_8px_rgba(255,220,100,0.4)] shrink-0">
                    <Bell size={28} className="text-white" strokeWidth={2.5} />
                  </div>

                  <h2 className="text-xl font-black text-[#1A1A3A] text-center leading-tight mb-2">
                    ¿Activar notificaciones?
                  </h2>

                  <p className="text-sm text-[#1A1A3A]/60 text-center mb-8">
                    Entérate al instante de mensajes y novedades.
                  </p>

                  <button
                    onClick={handleActivate}
                    disabled={uiState === 'loading'}
                    className="w-full h-14 rounded-2xl bg-[#1A1A3A] text-white font-black text-base shadow-[5px_5px_14px_rgba(20,20,60,0.35),-2px_-2px_8px_rgba(80,80,160,0.15)] active:scale-95 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {uiState === 'loading' ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Activando...
                      </span>
                    ) : (
                      <>Sí, activar <Bell size={18} className="text-white" /></>
                    )}
                  </button>

                  <button
                    onClick={handleDismiss}
                    disabled={uiState === 'loading'}
                    className="w-full text-sm font-bold text-[#1A1A3A]/40 hover:text-[#1A1A3A]/70 transition-colors disabled:hidden"
                  >
                    Ahora no
                  </button>
                </>
              )}

              {/* --- Estado DENIED: instrucciones manuales --- */}
              {uiState === 'denied' && (
                <>
                  <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#D90429] to-[#FF6B6B] flex items-center justify-center mb-5 shadow-[5px_5px_14px_rgba(200,0,40,0.35)] shrink-0">
                    <AlertTriangle size={28} className="text-white" strokeWidth={2.5} />
                  </div>

                  <h2 className="text-xl font-black text-[#1A1A3A] text-center leading-tight mb-2">
                    Acceso bloqueado
                  </h2>

                  <p className="text-sm text-[#1A1A3A]/60 text-center mb-4">
                    Tu navegador tiene las notificaciones bloqueadas para esta app. Para activarlas:
                  </p>

                  <ol className="text-sm text-[#1A1A3A]/70 text-left space-y-2 mb-6 w-full bg-white/50 rounded-2xl p-4">
                    <li><span className="font-black text-[#0056B3]">1.</span> Haz clic en el <span className="font-bold">🔒 candado</span> en la barra de dirección.</li>
                    <li><span className="font-black text-[#0056B3]">2.</span> Busca <span className="font-bold">"Notificaciones"</span>.</li>
                    <li><span className="font-black text-[#0056B3]">3.</span> Cambia a <span className="font-bold text-green-600">"Permitir"</span>.</li>
                    <li><span className="font-black text-[#0056B3]">4.</span> Recarga la página.</li>
                  </ol>

                  <button
                    onClick={handleDismiss}
                    className="w-full h-12 rounded-2xl bg-[#1A1A3A] text-white font-black text-sm active:scale-95 transition-transform"
                  >
                    Entendido
                  </button>
                </>
              )}

              {/* --- Estado GRANTED: confirmación de éxito --- */}
              {uiState === 'granted' && (
                <>
                  <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center mb-5 shadow-[5px_5px_14px_rgba(0,180,100,0.35)] shrink-0">
                    <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
                  </div>

                  <h2 className="text-xl font-black text-[#1A1A3A] text-center leading-tight mb-2">
                    ¡Notificaciones activadas!
                  </h2>

                  <p className="text-sm text-[#1A1A3A]/60 text-center">
                    Te avisaremos de mensajes y novedades al instante.
  </p>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
